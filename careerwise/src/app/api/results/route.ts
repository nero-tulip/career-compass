// src/app/api/results/route.ts
import { NextResponse, NextRequest } from 'next/server';
import type { Answer } from '@/app/types/quiz';
import type { MacroAnswer } from '@/app/types/quiz';
import type { RIASECProfile } from '@/app/types/career';
import { interpretMacroAnswer } from '@/app/lib/careerMatch';
import careers from '@/app/data/careers.json';
import { summarizeIntake } from "@/app/lib/intakeSummary";

// 🔒 Admin Firestore (server-only)
import { getAuth } from 'firebase-admin/auth';
import { adminDb } from '@/app/lib/firebaseAdmin';

// Ensure Node runtime (env + Admin SDK)
export const runtime = 'nodejs';

interface DraftDoc {
  status?: string;
  entitlement?: 'free' | 'premium';
  intake?: unknown;                 // raw intake stored in draft
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
  const decoded = await getAuth().verifyIdToken(idToken);
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

/** ---------- JSON-first OpenAI call ---------- */
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

async function getChatGPTAnalysisJSON(params: {
  profile: RIASECProfile;
  dominantTraits: string[];
  macroSummaryText: string;
  intakeSummary: { summaryText: string; highlights: string[] };
  topCareerTitles: string[];
}): Promise<AnalysisJSON> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error('OpenAI API key not found in environment variables');

  // Build a compact, deterministic system+user prompt
  const system = `
You are an expert career counselor. Respond ONLY with valid JSON matching the provided schema. 
No markdown, no commentary—just a JSON object. Keep advice concrete and practical for an adult learner.
`.trim();

  const schemaExample: AnalysisJSON = {
    summary: "One paragraph that ties RIASEC + intake into a coherent career theme.",
    strengths: ["bullet 1", "bullet 2"],
    growthAreas: ["bullet 1", "bullet 2"],
    topCareers: [
      {
        title: "Career Title",
        whyMatch: "1–3 sentences referencing RIASEC + intake/macro context.",
        successTraits: ["trait 1", "trait 2"],
        firstSteps: ["step 1", "step 2"]
      }
    ],
    nextSteps: ["action 1", "action 2"]
  };

  const user = {
    riasecProfile: params.profile,
    dominantTraits: params.dominantTraits,
    macroSummaryText: params.macroSummaryText,
    intakeSummary: params.intakeSummary,   // <-- structured, schema-aware summary
    datasetTopCareerTitles: params.topCareerTitles
  };

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: 'gpt-4-turbo-preview',
      response_format: { type: "json_object" }, // <— enforce JSON
      temperature: 0.4,
      messages: [
        { role: 'system', content: system },
        {
          role: 'user',
          content:
            `Return a JSON object exactly matching this TypeScript shape:\n` +
            `type AnalysisJSON = ${JSON.stringify(schemaExample, null, 2)}\n\n` +
            `Here is the user's data (JSON):\n` +
            JSON.stringify(user, null, 2)
        }
      ],
    }),
  });

  console.log('OpenAI JSON response status:', response.status);

  if (!response.ok) {
    const errorText = await response.text();
    console.error('OpenAI API error:', errorText);
    throw new Error(`Failed to get analysis JSON from ChatGPT: ${response.status} ${errorText}`);
  }

  const data = await response.json();
  // The model must return valid JSON per response_format; still guard:
  const content = data.choices?.[0]?.message?.content ?? '{}';
  const parsed = JSON.parse(content);
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

    // Load draft server-side (includes intake, macro, riasec)
    const draftRef = db.collection('users').doc(uid).collection('drafts').doc(rid);
    const draftSnap = await draftRef.get();
    if (!draftSnap.exists) return NextResponse.json({ error: 'draft_not_found' }, { status: 404 });
    const draft = draftSnap.data() as DraftDoc;

    // 🔎 interpret intake → concise summary for the LLM
    const intakeSummary = summarizeIntake(draft.intake ?? null);

    const macroAnswers = draft.macro ?? [];
    const riaAnswers = draft.riasec ?? [];
    if (!Array.isArray(riaAnswers) || riaAnswers.length === 0) {
      return NextResponse.json({ error: 'no_riasec_answers' }, { status: 400 });
    }

    // 1) Compute profile (dynamic averaging)
    const riasecProfile = calculateRIASECProfileDynamic(riaAnswers as Answer[]);
    const dominantTraits = getDominantTraits(riasecProfile);

    // 2) Build macro summary text (unchanged behavior)
    const macroSummaryText = (macroAnswers as MacroAnswer[])
      .map((ans) => interpretMacroAnswer(ans.questionId, ans.score))
      .filter(Boolean)
      .join('\n');

    // 3) Rank careers via cosine similarity
    const rankedCareers = rankCareersByCosine(riasecProfile, careers as CareerRow[], 3);

    // 4) Assemble profile object (unchanged outward shape)
    const careerProfile: CareerProfileOut = {
      riasec: riasecProfile,
      macroPreferences: {}, // placeholder
      dominantTraits,
    };

    // 5) Preview mode → write rolling snapshot to draft; no AI call
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

    // 6) Final mode → JSON-first ChatGPT analysis + persist result + mark draft done
    const topTitles = rankedCareers.map((c) => c.title);
    let analysisJson: AnalysisJSON;
    let analysisMarkdown: string;

    try {
      analysisJson = await getChatGPTAnalysisJSON({
        profile: riasecProfile,
        dominantTraits,
        macroSummaryText,
        intakeSummary,                 // <-- use concise intake summary here
        topCareerTitles: topTitles,
      });
      analysisMarkdown = toMarkdownFromJSON(analysisJson, riasecProfile, dominantTraits);
    } catch (e) {
      console.warn('Falling back to simple markdown analysis due to JSON error.', e);
      // Fallback minimal content so the UI still works
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
      analysisJson,                // <— structured
      analysis: analysisMarkdown,  // <— markdown for current UI
      completedAt: now,
    });

    // Mark draft finished and link result
    await draftRef.set(
      {
        status: draft.entitlement === 'premium' ? 'premium_done' : 'free_done',
        freeResultRef: resultRef.path,
        updatedAt: now,
      },
      { merge: true }
    );

    // Optional: clear activeRid on user
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
    const decoded = await getAuth().verifyIdToken(idToken);
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