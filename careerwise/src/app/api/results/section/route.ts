// src/app/api/results/section/route.ts
import { NextResponse, NextRequest } from 'next/server';
import { adminDb, adminAuth } from '@/app/lib/firebaseAdmin';

type RIASEC = { R:number; I:number; A:number; S:number; E:number; C:number };
type Big5 = { E:number; A:number; C:number; N:number; O:number };

export const runtime = 'nodejs';

async function requireUid(req: Request) {
  const authz = req.headers.get('authorization') || req.headers.get('Authorization');
  if (!authz?.startsWith('Bearer ')) throw new Error('unauthenticated');
  const token = authz.slice('Bearer '.length).trim();
  const decoded = await adminAuth().verifyIdToken(token);
  return decoded.uid;
}

// --- RIASEC compute (average per letter, dynamic) ---
function computeRiasec(answers: Array<{questionId:string; score:number}>): { profile: RIASEC; top3: string[] } {
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

// --- Big-5 compute (reverse-aware; average 1..5 per trait) ---
/** answers: [{ questionId:'E1'|'A2R'|..., score:1..5 }]
 * items: from /data/big5Questions.json → [{id, trait:'E'|'A'|'C'|'N'|'O', reverse:boolean}, ...]
 */
function computeBig5(
  items: Array<{id:string; trait:keyof Big5; reverse?:boolean}>,
  answers: Array<{questionId:string; score:number}>
): Big5 {
  const sums: Big5 = { E:0, A:0, C:0, N:0, O:0 };
  const counts: Record<keyof Big5, number> = { E:0, A:0, C:0, N:0, O:0 };

  const lookup = new Map(items.map(i => [i.id, i]));
  for (const a of answers) {
    const meta = lookup.get(a.questionId);
    if (!meta) continue;
    let s = Number(a.score) || 0;
    if (meta.reverse) s = 6 - s; // reverse-score on 1..5
    sums[meta.trait] += s;
    counts[meta.trait] += 1;
  }

  const out: Big5 = { E:0, A:0, C:0, N:0, O:0 };
  (Object.keys(out) as (keyof Big5)[]).forEach(t => {
    out[t] = counts[t] ? sums[t] / counts[t] : 0;
  });
  return out;
}

async function readDraftSection(db: FirebaseFirestore.Firestore, uid: string, rid: string, section: 'riasec'|'big5') {
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
      // Load items once (you can import JSON at top if preferred)
      const mod = await import('@/app/data/big5Questions.json');
      const items = (mod.default?.items || mod.items) as Array<{id:string; trait:'E'|'A'|'C'|'N'|'O'; reverse?:boolean}>;
      const traits = computeBig5(items, answers);
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

    // Reuse compute logic
    let payload: any;
    if (section === 'riasec') {
      const { profile, top3 } = computeRiasec(answers);
      payload = { profile, top3, computedAt: new Date() };
    } else {
      const mod = await import('@/app/data/big5Questions.json');
      const items = (mod.default?.items || mod.items) as Array<{id:string; trait:'E'|'A'|'C'|'N'|'O'; reverse?:boolean}>;
      const traits = computeBig5(items, answers);
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