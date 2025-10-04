// src/app/api/results/section/route.ts
import { NextResponse, NextRequest } from 'next/server';
import { adminDb, adminAuth } from '@/app/lib/firebaseAdmin';
import { scoreBig5 } from '@/app/lib/big5';
import type { Big5Item, Big5Answer } from '@/app/types/big5';

type RIASEC = { R:number; I:number; A:number; S:number; E:number; C:number };
type Big5TraitsMean = { E:number; A:number; C:number; N:number; O:number };

export const runtime = 'nodejs';

async function requireUid(req: Request) {
  const authz = req.headers.get('authorization') || req.headers.get('Authorization');
  if (!authz?.startsWith('Bearer ')) throw new Error('unauthenticated');
  const token = authz.slice('Bearer '.length).trim();
  const decoded = await adminAuth().verifyIdToken(token);
  return decoded.uid;
}

// --- RIASEC compute (average per letter, dynamic) ---
function computeRiasec(
  answers: Array<{questionId:string; score:number}>
): { profile: RIASEC; top3: string[] } {
  const totals: RIASEC = { R:0,I:0,A:0,S:0,E:0,C:0 };
  const counts = { R:0,I:0,A:0,S:0,E:0,C:0 };
  for (const a of answers) {
    const k = a.questionId.charAt(0).toUpperCase() as keyof RIASEC;
    if (k in totals) {
      totals[k] += Number(a.score) || 0;
      (counts as any)[k] += 1;
    }
  }
  const profile: RIASEC = { R:0,I:0,A:0,S:0,E:0,C:0 };
  (Object.keys(profile) as (keyof RIASEC)[]).forEach(k=>{
    profile[k] = (counts as any)[k] ? totals[k]/(counts as any)[k] : 0;
  });
  const top3 = Object.entries(profile).sort(([,a],[,b]) => b-a).slice(0,3).map(([k])=>k);
  return { profile, top3 };
}

/**
 * Read a section's answer array from the draft:
 * - For "riasec" and "big5" we expect an array of { questionId, score }
 */
async function readDraftSection(
  db: FirebaseFirestore.Firestore,
  uid: string,
  rid: string,
  section: 'riasec'|'big5'
) {
  const dref = db.collection('users').doc(uid).collection('drafts').doc(rid);
  const snap = await dref.get();
  if (!snap.exists) return null;
  const data = snap.data() || {};
  return data[section] || null;
}

export async function POST(req: Request) {
  try {
    const uid = await requireUid(req);
    const db = adminDb();
    const { rid, section, mode }: { rid?: string; section?: 'riasec'|'big5'; mode?: 'preview'|'final' } =
      await req.json().catch(()=> ({}));

    if (!rid || (section !== 'riasec' && section !== 'big5')) {
      return NextResponse.json({ error: 'bad_request' }, { status: 400 });
    }

    // Load answers from draft
    const answers = await readDraftSection(db, uid, rid, section);
    if (!Array.isArray(answers) || answers.length === 0) {
      return NextResponse.json({ error: 'no_answers' }, { status: 400 });
    }

    let payload: any;
    if (section === 'riasec') {
      const { profile, top3 } = computeRiasec(answers);
      payload = { profile, top3, computedAt: new Date() };
    } else {
      // BIG-5: reuse shared scorer
      const mod = await import('@/app/data/big5Questions.json');
      const items = (mod.default?.items || mod.items) as Big5Item[];

      // map draft answers {questionId, score} -> scorer’s {itemId, value}
      const mapped: Big5Answer[] = answers.map((a: any) => ({
        itemId: String(a.questionId),
        value: Number(a.score) || 0,
      }));

      const scored = scoreBig5(items, mapped);

      // Your result page expects means (1..5) keyed E/A/C/N/O
      const traits: Big5TraitsMean = {
        E: scored.mean.E,
        A: scored.mean.A,
        C: scored.mean.C,
        N: scored.mean.N,
        O: scored.mean.O,
      };

      payload = { traits, computedAt: new Date() };
    }

    // Upsert results doc and write the component
    const resRef = db.collection('users').doc(uid).collection('results').doc(rid);
    await resRef.set({ components: { [section]: payload }, updatedAt: new Date() }, { merge: true });

    return NextResponse.json({ success: true, rid, section, result: payload, mode: mode || 'final' });
  } catch (e: any) {
    const msg = e?.message === 'unauthenticated' ? 'unauthenticated' : 'internal_error';
    const status = msg === 'unauthenticated' ? 401 : 500;
    console.error('POST /api/results/section', e);
    return NextResponse.json({ error: msg }, { status });
  }
}

export async function GET(req: NextRequest) {
  try {
    const uid = await requireUid(req as any);
    const db = adminDb();
    const rid = req.nextUrl.searchParams.get('rid') || '';
    const section = req.nextUrl.searchParams.get('section') as 'riasec'|'big5'|null;

    if (!rid || !section) return NextResponse.json({ error: 'bad_request' }, { status: 400 });

    const resRef = db.collection('users').doc(uid).collection('results').doc(rid);
    const snap = await resRef.get();

    if (snap.exists) {
      const data = snap.data() || {};
      const comp = data?.components?.[section];
      if (comp) return NextResponse.json({ success: true, rid, section, result: comp });
    }

    // Lazy compute if missing
    const answers = await readDraftSection(db, uid, rid, section);
    if (!Array.isArray(answers) || answers.length === 0) {
      return NextResponse.json({ error: 'no_answers' }, { status: 404 });
    }

    let payload: any;
    if (section === 'riasec') {
      const { profile, top3 } = computeRiasec(answers);
      payload = { profile, top3, computedAt: new Date() };
    } else {
      const mod = await import('@/app/data/big5Questions.json');
      const items = (mod.default?.items || mod.items) as Big5Item[];

      const mapped: Big5Answer[] = answers.map((a: any) => ({
        itemId: String(a.questionId),
        value: Number(a.score) || 0,
      }));

      const scored = scoreBig5(items, mapped);

      const traits: Big5TraitsMean = {
        E: scored.mean.E,
        A: scored.mean.A,
        C: scored.mean.C,
        N: scored.mean.N,
        O: scored.mean.O,
      };

      payload = { traits, computedAt: new Date() };
    }

    await resRef.set({ components: { [section]: payload }, updatedAt: new Date() }, { merge: true });
    return NextResponse.json({ success: true, rid, section, result: payload });
  } catch (e: any) {
    const msg = e?.message === 'unauthenticated' ? 'unauthenticated' : 'internal_error';
    const status = msg === 'unauthenticated' ? 401 : 500;
    console.error('GET /api/results/section', e);
    return NextResponse.json({ error: msg }, { status });
  }
}