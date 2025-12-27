// src/app/api/results/route.ts
import { NextResponse, NextRequest } from 'next/server';
import type { Answer } from '@/app/types/quiz';
import type { MacroAnswer } from '@/app/types/quiz';
import type { RIASECProfile } from '@/app/types/career';
import { interpretMacroAnswer } from '../../lib/careerMatch';
import careers from '@/app/data/careers.json';
import { summarizeIntake } from "@/app/lib/intakeSummary";

// 🔒 Admin Firestore (server-only)
import { adminDb, adminAuth } from '@/app/lib/firebaseAdmin';

// Ensure Node runtime (env + Admin SDK)
export const runtime = 'nodejs';

interface DraftDoc {
  status?: string;
  entitlement?: 'free' | 'premium';
  intake?: unknown;
  macro?: MacroAnswer[];
  riasec?: Answer[];
  progress?: { section?: string; page?: number };
  createdAt?: unknown;
  updatedAt?: unknown;
}

interface CareerRow {
  title: string;
  riasec?: Partial<RIASECProfile>;
  [k: string]: any;
}

interface CareerProfileOut {
  riasec: RIASECProfile;
  macroPreferences: Record<string, number>;
  dominantTraits: string[];
}

/** ---------- Auth: ONLY via Bearer ID token ---------- */
async function requireUidFromAuthHeader(request: Request): Promise<string> {
  const authz = request.headers.get('authorization') || request.headers.get('Authorization');
  if (!authz || !authz.startsWith('Bearer ')) {
    throw new Error('unauthenticated');
  }
  const idToken = authz.slice('Bearer '.length).trim();
  const decoded = await adminAuth().verifyIdToken(idToken);
  return decoded.uid;
}

/** ---------- RIASEC math (dynamic averaging; no hardcoded divisor) ---------- */
function calculateRIASECProfileDynamic(answers: Answer[]): RIASECProfile {
  const totals: RIASECProfile = { R: 0, I: 0, A: 0, S: 0, E: 0, C: 0 };
  const counts: Record<keyof RIASECProfile, number> = { R: 0, I: 0, A: 0, S: 0, E: 0, C: 0 };

  console.log('=== RIASEC CALCULATION (dynamic) ===');
  console.log('Total answers received:', answers.length);

  for (const a of answers) {
    const key = a.questionId.charAt(0).toUpperCase() as keyof RIASECProfile;
    if (key in totals) {
      totals[key] += Number(a.score) || 0;
      counts[key] += 1;
    } else {
      console.log(`  -> WARNING: Unknown category key in questionId "${a.questionId}"`);
    }
  }

  const profile: RIASECProfile = { R: 0, I: 0, A: 0, S: 0, E: 0, C: 0 };
  (Object.keys(profile) as (keyof RIASECProfile)[]).forEach((k) => {
    profile[k] = counts[k] > 0 ? totals[k] / counts[k] : 0;
  });

  console.log('Totals:', totals);
  console.log('Counts:', counts);
  console.log('Averages:', profile);
  console.log('=== END RIASEC CALCULATION (dynamic) ===');

  return profile;
}

function getDominantTraits(profile: RIASECProfile): string[] {
  return Object.entries(profile)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3)
    .map(([trait]) => trait);
}

/** ---------- Cosine similarity ranking for careers ---------- */
function cosineSim(a: RIASECProfile, b: Partial<RIASECProfile>): number {
  const keys: (keyof RIASECProfile)[] = ['R', 'I', 'A', 'S', 'E', 'C'];
  let dot = 0, na = 0, nb = 0;
  for (const k of keys) {
    const av = a[k] || 0;
    const bv = (b[k] ?? 0) as number;
    dot += av * bv;
    na += av * av;
    nb += bv * bv;
  }
  const denom = Math.sqrt(na) * Math.sqrt(nb);
  return denom === 0 ? 0 : dot / denom;
}

function rankCareersByCosine(
  profile: RIASECProfile,
  rows: CareerRow[],
  limit = 3
) {
  return rows
    .filter((c) => c.riasec && typeof c.riasec === 'object')
    .map((c) => ({
      ...c,
      score: cosineSim(profile, c.riasec as Partial<RIASECProfile>),
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

/** ---------- JSON-first OpenAI call (Responses API + Structured Outputs) ---------- */
type AnalysisJSON = {
  summary: string;
  strengths: string[];
  growthAreas: string[];
  topCareers: Array<{
    title: string;
    whyMatch: string;
    successTraits: string[];
    firstSteps: string[];
  }>;
  nextSteps: string[];
};

function toMarkdownFromJSON(j: AnalysisJSON, profile: RIASECProfile, dominantTraits: string[]) {
  const lines: string[] = [];
  lines.push(`## Summary`);
  lines.push(j.summary || '—');
  lines.push('');
  lines.push(`## Profile Highlights`);
  lines.push(
    `RIASEC Averages — R:${profile.R.toFixed(2)} I:${profile.I.toFixed(2)} A:${profile.A.toFixed(2)} S:${profile.S.toFixed(2)} E:${profile.E.toFixed(2)} C:${profile.C.toFixed(2)}`
  );
  lines.push(`Dominant Traits — ${dominantTraits.join(', ') || '—'}`);
  lines.push('');
  if (j.strengths?.length) {
    lines.push(`## Strengths`);
    for (const s of j.strengths) lines.push(`- ${s}`);
    lines.push('');
  }
  if (j.growthAreas?.length) {
    lines.push(`## Growth Areas`);
    for (const s of j.growthAreas) lines.push(`- ${s}`);
    lines.push('');
  }
  if (j.topCareers?.length) {
    lines.push(`## Top Career Matches`);
    for (const c of j.topCareers) {
      lines.push(`### ${c.title}`);
      if (c.whyMatch) lines.push(`${c.whyMatch}`);
      if (c.successTraits?.length) {
        lines.push(`**Traits for success:**`);
        for (const t of c.successTraits) lines.push(`- ${t}`);
      }
      if (c.firstSteps?.length) {
        lines.push(`**First steps:**`);
        for (const fs of c.firstSteps) lines.push(`- ${fs}`);
      }
      lines.push('');
    }
  }
  if (j.nextSteps?.length) {
    lines.push(`## Next Steps`);
    for (const n of j.nextSteps) lines.push(`- ${n}`);
  }
  return lines.join('\n');
}

function analysisJsonSchema(): any {
  return {
    name: "AnalysisJSON",
    schema: {
      type: "object",
      additionalProperties: false,
      required: ["summary", "strengths", "growthAreas", "topCareers", "nextSteps"],
      properties: {
        summary: { type: "string" },
        strengths: { type: "array", items: { type: "string" } },
        growthAreas: { type: "array", items: { type: "string" } },
        topCareers: {
          type: "array",
          minItems: 1,
          items: {
            type: "object",
            additionalProperties: false,
            required: ["title", "whyMatch", "successTraits", "firstSteps"],
            properties: {
              title: { type: "string" },
              whyMatch: { type: "string" },
              successTraits: { type: "array", items: { type: "string" } },
              firstSteps: { type: "array", items: { type: "string" } }
            }
          }
        },
        nextSteps: { type: "array", items: { type: "string" } }
      }
    },
    strict: true
  };
}

// Robust extractor for Responses API JSON text payloads
function extractResponsesTextPayload(data: any): string | null {
  if (typeof data?.output_text === 'string') return data.output_text;

  if (Array.isArray(data?.output)) {
    for (const item of data.output) {
      if (Array.isArray(item?.content)) {
        for (const c of item.content) {
          if (typeof c?.text === 'string') return c.text;
          if (typeof c?.['text'] === 'string') return c.text;
        }
      }
    }
  }
  return null;
}

async function getChatGPTAnalysisJSON(params: {
  profile: RIASECProfile;
  dominantTraits: string[];
  macroSummaryText: string;
  intakeSummary: { summaryText: string; highlights: string[] };
  topCareerTitles: string[];
}): Promise<AnalysisJSON> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error('OpenAI API key not found in environment variables');

  const model = process.env.OPENAI_MODEL || 'gpt-5-mini';

  const system = `
You are an expert career counselor. Respond ONLY with valid JSON that matches the provided JSON Schema.
No markdown, no commentary—just a JSON object. Keep advice concrete and practical for an adult learner.
`.trim();

  const userPayload = {
    riasecProfile: params.profile,
    dominantTraits: params.dominantTraits,
    macroSummaryText: params.macroSummaryText,
    intakeSummary: params.intakeSummary,
    datasetTopCareerTitles: params.topCareerTitles
  };

  const body = {
    model,
    response_format: {
      type: "json_schema",
      json_schema: analysisJsonSchema()
    },
    input: [
      { role: 'system', content: system },
      {
        role: 'user',
        content:
          `Using the schema named "AnalysisJSON", return a JSON object ONLY.\n\n` +
          `Context JSON:\n` +
          JSON.stringify(userPayload, null, 2)
      }
    ],
    temperature: 0.4
  };

  const response = await fetch('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify(body),
  });

  console.log('OpenAI Responses status:', response.status);

  if (!response.ok) {
    const errorText = await response.text();
    console.error('OpenAI API error:', errorText);
    throw new Error(`Failed to get analysis JSON from OpenAI Responses API: ${response.status} ${errorText}`);
  }

  const data = await response.json();
  const raw = extractResponsesTextPayload(data);

  if (!raw) {
    console.error('Unexpected Responses API payload shape:', JSON.stringify(data).slice(0, 2000));
    throw new Error('invalid_openai_payload');
  }

  const parsed = JSON.parse(raw);
  return parsed as AnalysisJSON;
}

/** ---------- POST: compute & save results ---------- */
export async function POST(request: Request) {
  try {
    const uid = await requireUidFromAuthHeader(request);

    const body = (await request.json()) as { rid?: string; mode?: 'preview' | 'final' };
    const rid = body?.rid;
    const mode: 'preview' | 'final' = body?.mode ?? 'final';

    if (!rid) return NextResponse.json({ error: 'missing_rid' }, { status: 400 });

    const db = adminDb();
    const now = new Date();

    const draftRef = db.collection('users').doc(uid).collection('drafts').doc(rid);
    const draftSnap = await draftRef.get();
    if (!draftSnap.exists) return NextResponse.json({ error: 'draft_not_found' }, { status: 404 });
    const draft = draftSnap.data() as DraftDoc;

    const intakeSummary = summarizeIntake(draft.intake ?? null);

    const macroAnswers = draft.macro ?? [];
    const riaAnswers = draft.riasec ?? [];
    if (!Array.isArray(riaAnswers) || riaAnswers.length === 0) {
      return NextResponse.json({ error: 'no_riasec_answers' }, { status: 400 });
    }

    const riasecProfile = calculateRIASECProfileDynamic(riaAnswers as Answer[]);
    const dominantTraits = getDominantTraits(riasecProfile);

    const macroSummaryText = (macroAnswers as MacroAnswer[])
      .map((ans) => interpretMacroAnswer(ans.questionId, ans.score))
      .filter(Boolean)
      .join('\n');

    const rankedCareers = rankCareersByCosine(riasecProfile, careers as CareerRow[], 3);

    const careerProfile: CareerProfileOut = {
      riasec: riasecProfile,
      macroPreferences: {},
      dominantTraits,
    };

    if (mode === 'preview') {
      await draftRef.set(
        {
          preview: {
            profile: careerProfile,
            matchingCareers: rankedCareers,
            at: now,
          },
          updatedAt: now,
        },
        { merge: true }
      );

      return NextResponse.json({
        success: true,
        mode: 'preview',
        profile: careerProfile,
        matchingCareers: rankedCareers,
      });
    }

    const topTitles = rankedCareers.map((c) => c.title);
    let analysisJson: AnalysisJSON;
    let analysisMarkdown: string;

    try {
      analysisJson = await getChatGPTAnalysisJSON({
        profile: riasecProfile,
        dominantTraits,
        macroSummaryText,
        intakeSummary,
        topCareerTitles: topTitles,
      });
      analysisMarkdown = toMarkdownFromJSON(analysisJson, riasecProfile, dominantTraits);
    } catch (e) {
      console.warn('Falling back to simple markdown analysis due to JSON error.', e);
      analysisJson = {
        summary: 'Automated analysis unavailable. Showing a minimal summary.',
        strengths: [],
        growthAreas: [],
        topCareers: topTitles.map((t) => ({
          title: t,
          whyMatch: '',
          successTraits: [],
          firstSteps: []
        })),
        nextSteps: []
      };
      analysisMarkdown =
        `## Summary\n` +
        `RIASEC Averages — R:${riasecProfile.R.toFixed(2)} I:${riasecProfile.I.toFixed(2)} A:${riasecProfile.A.toFixed(2)} S:${riasecProfile.S.toFixed(2)} E:${riasecProfile.E.toFixed(2)} C:${riasecProfile.C.toFixed(2)}\n\n` +
        `## Top Career Matches\n` +
        (topTitles.map((t) => `- ${t}`).join('\n') || '_No matches found._');
    }

    const resultRef = db.collection('users').doc(uid).collection('results').doc(rid);

    await resultRef.set({
      type: draft.entitlement === 'premium' ? 'premium' : 'free',
      rid,
      profile: careerProfile,
      matchingCareers: rankedCareers,
      analysisJson,
      analysis: analysisMarkdown,
      completedAt: now,
    });

    await draftRef.set(
      {
        status: draft.entitlement === 'premium' ? 'premium_done' : 'free_done',
        freeResultRef: resultRef.path,
        updatedAt: now,
      },
      { merge: true }
    );

    await db.collection('users').doc(uid).set({ activeRid: null }, { merge: true });

    return NextResponse.json({
      success: true,
      mode: 'final',
      rid,
      profile: careerProfile,
      matchingCareers: rankedCareers,
      analysisJson,
    });
  } catch (error: any) {
    console.error('Error in /api/results:', error);
    const msg = typeof error?.message === 'string' ? error.message : 'internal_error';
    const status =
      msg === 'unauthenticated' ? 401 :
      msg === 'missing_rid' ? 400 :
      msg === 'draft_not_found' ? 404 :
      msg === 'no_riasec_answers' ? 400 :
      msg === 'invalid_openai_payload' ? 502 :
      500;

    return NextResponse.json({ error: msg }, { status });
  }
}

/** ---------- GET: fetch saved results (no change to contract) ---------- */
export async function GET(req: NextRequest) {
  try {
    const authz = req.headers.get("authorization") || req.headers.get("Authorization");
    if (!authz || !authz.startsWith("Bearer ")) {
      return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
    }
    const idToken = authz.slice("Bearer ".length).trim();
    const decoded = await adminAuth().verifyIdToken(idToken);
    const uid = decoded.uid;

    const rid = req.nextUrl.searchParams.get("rid");
    if (!rid) {
      return NextResponse.json({ error: "missing_rid" }, { status: 400 });
    }

    const db = adminDb();
    const resRef = db.collection("users").doc(uid).collection("results").doc(rid);
    const snap = await resRef.get();

    if (!snap.exists) {
      return NextResponse.json({ error: "result_not_found" }, { status: 404 });
    }

    const data = snap.data() || {};
    return NextResponse.json({ success: true, rid, result: data });
  } catch (err: any) {
    console.error("GET /api/results error:", err);
    const msg = typeof err?.message === "string" ? err.message : "internal_error";
    const status = msg === "unauthenticated" ? 401 : 500;
    return NextResponse.json({ error: msg }, { status });
  }
}