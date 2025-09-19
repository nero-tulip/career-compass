// src/app/api/results/route.ts
import { NextResponse } from 'next/server';
import type { Answer } from '@/app/types/quiz';
import type { MacroAnswer } from '@/app/types/quiz';
import type { RIASECProfile } from '@/app/types/career';
import { prepareCareerAnalysisPrompt, interpretMacroAnswer } from '@/app/lib/careerMatch';
import careers from '@/app/data/careers.json';
import { NextRequest } from "next/server";

// 🔒 Admin Firestore (server-only)
import { getAuth } from 'firebase-admin/auth';
import { adminDb } from '@/app/lib/firebaseAdmin';

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

interface CareerProfile {
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
  // Totals & counts per key
  const totals: RIASECProfile = { R: 0, I: 0, A: 0, S: 0, E: 0, C: 0 };
  const counts: Record<keyof RIASECProfile, number> = { R: 0, I: 0, A: 0, S: 0, E: 0, C: 0 };

  console.log('=== RIASEC CALCULATION (dynamic) ===');
  console.log('Total answers received:', answers.length);

  for (const a of answers) {
    // Your current IDs start with the category letter (e.g., "R12")
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

/** ---------- Your existing OpenAI call (kept as-is) ---------- */
async function getChatGPTAnalysis(prompt: string): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error('OpenAI API key not found in environment variables');

  console.log('Calling OpenAI API...');

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: 'gpt-4-turbo-preview',
      messages: [
        {
          role: 'system',
          content:
            'You are a career counselor with expertise in RIASEC personality types and career matching. Provide detailed, actionable career advice based on the provided profile and career matches.',
        },
        { role: 'user', content: prompt },
      ],
      temperature: 0.7,
      max_tokens: 2000,
    }),
  });

  console.log('OpenAI API response status:', response.status);

  if (!response.ok) {
    const errorText = await response.text();
    console.error('OpenAI API error:', errorText);
    throw new Error(`Failed to get analysis from ChatGPT: ${response.status} ${errorText}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
}

/** ---------- Route handler (minimal changes elsewhere) ---------- */
export async function POST(request: Request) {
  try {
    // Auth → uid (Bearer ID token only)
    const uid = await requireUidFromAuthHeader(request);

    // Body with rid + mode
    const body = (await request.json()) as { rid?: string; mode?: 'preview' | 'final' };
    const rid = body?.rid;
    const mode: 'preview' | 'final' = body?.mode ?? 'final';

    if (!rid) return NextResponse.json({ error: 'missing_rid' }, { status: 400 });

    const db = adminDb();
    const now = new Date();

    // Load draft server-side
    const draftRef = db.collection('users').doc(uid).collection('drafts').doc(rid);
    const draftSnap = await draftRef.get();
    if (!draftSnap.exists) return NextResponse.json({ error: 'draft_not_found' }, { status: 404 });
    const draft = draftSnap.data() as DraftDoc;

    const macroAnswers = draft.macro ?? [];
    const riaAnswers = draft.riasec ?? [];
    if (!Array.isArray(riaAnswers) || riaAnswers.length === 0) {
      return NextResponse.json({ error: 'no_riasec_answers' }, { status: 400 });
    }

    // 1) Compute profile (dynamic averaging)
    const riasecProfile = calculateRIASECProfileDynamic(riaAnswers as Answer[]);

    // 2) Build macro summary text (unchanged behavior)
    const macroSummaryText = (macroAnswers as MacroAnswer[])
      .map((ans) => interpretMacroAnswer(ans.questionId, ans.score))
      .filter(Boolean)
      .join('\n');

    // 3) Rank careers via cosine similarity
    const matchingCareers = rankCareersByCosine(riasecProfile, careers as CareerRow[], 3);

    // 4) Assemble profile object (unchanged shape)
    const careerProfile: CareerProfile = {
      riasec: riasecProfile,
      macroPreferences: {}, // keep placeholder for now
      dominantTraits: getDominantTraits(riasecProfile),
    };

    // 5) Preview mode → write rolling snapshot to draft; no AI call
    if (mode === 'preview') {
      await draftRef.set(
        {
          preview: {
            profile: careerProfile,
            matchingCareers,
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
        matchingCareers,
      });
    }

    // 6) Final mode → ChatGPT analysis + persist result + mark draft done
    const prompt = prepareCareerAnalysisPrompt(riasecProfile, macroSummaryText);
    const analysis = await getChatGPTAnalysis(prompt);

    const resultRef = db.collection('users').doc(uid).collection('results').doc(rid);

    await resultRef.set({
      type: draft.entitlement === 'premium' ? 'premium' : 'free',
      rid,
      profile: careerProfile,
      matchingCareers,
      analysis,
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

    // Optional: clear activeRid on user (kept from earlier suggestion)
    await db.collection('users').doc(uid).set({ activeRid: null }, { merge: true });

    return NextResponse.json({
      success: true,
      mode: 'final',
      rid,
      profile: careerProfile,
      matchingCareers,
      analysis,
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

// Ensure we’re on Node so process.env and Admin SDK are available
export const runtime = "nodejs";

// GET /api/results?rid=...
export async function GET(req: NextRequest) {
  try {
    // Auth: Bearer ID token (same as POST)
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

    // Return exactly what the client needs
    return NextResponse.json({
      success: true,
      rid,
      result: data,
    });
  } catch (err: any) {
    console.error("GET /api/results error:", err);
    const msg = typeof err?.message === "string" ? err.message : "internal_error";
    const status = msg === "unauthenticated" ? 401 : 500;
    return NextResponse.json({ error: msg }, { status });
  }
}