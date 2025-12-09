import "server-only";

import { adminDb } from "@/app/lib/firebaseAdmin";
import {
  loadIntakeSummary,
  loadMacroSummary,
} from "@/app/lib/results/loaders/client-loaders";
import { loadRiasecSummary } from "@/app/lib/results/loaders/map-riasec";
import { loadBig5Summary } from "@/app/lib/results/loaders/map-big5";
import { computeMotivators } from "@/app/lib/results/motivators/computeMotivators";
import type { ValuesReport } from "@/app/lib/results/types";
import type { MotivationName } from "@/app/lib/results/values-taxonomy";

/** Cache helpers */
async function readCache(uid: string, rid: string): Promise<ValuesReport | undefined> {
  const ref = adminDb().doc(`users/${uid}/drafts/${rid}`);
  const snap = await ref.get();
  if (!snap.exists) return undefined;
  return snap.data()?.valuesReport as ValuesReport | undefined;
}

async function writeCache(uid: string, rid: string, report: ValuesReport) {
  const ref = adminDb().doc(`users/${uid}/drafts/${rid}`);
  await ref.set({ valuesReport: report, updatedAt: new Date() }, { merge: true });
}

/** Simple template generator for the summary */
function generateSummary(top3: MotivationName[]): string {
  const joined = top3.join(", ");
  return `Your profile suggests you are primarily driven by ${joined}. You likely thrive in environments that prioritize these values, while roles that conflict with them may lead to burnout or disengagement. Use these drivers as your "must-haves" when evaluating new opportunities.`;
}

export async function generateValuesReport(uid: string, rid: string): Promise<ValuesReport> {
  // 1) Check Cache
  const cached = await readCache(uid, rid).catch(() => undefined);
  if (cached) return cached;

  // 2) Load Data
  const fakeUser = { uid } as any;
  const [intake, macro, riasec, big5] = await Promise.all([
    loadIntakeSummary(fakeUser, rid).catch(() => undefined),
    loadMacroSummary(fakeUser, rid).catch(() => undefined),
    loadRiasecSummary(fakeUser, rid).catch(() => undefined),
    loadBig5Summary(fakeUser, rid).catch(() => undefined),
  ]);

  // 3) Prepare Inputs
  const intakeText = intake
    ? Object.values(intake)
        .map((v) => (typeof v === "string" ? v : JSON.stringify(v)))
        .join(" ")
        .slice(0, 4000)
    : "";

  const riasecMap = { R: 0, I: 0, A: 0, S: 0, E: 0, C: 0 };
  (riasec?.scores ?? []).forEach((s: any) => {
    const k = s.key as keyof typeof riasecMap;
    if (k in riasecMap) riasecMap[k] = s.avg ?? 0;
  });

  const big5Map = {
    O: big5?.avg?.O ?? 0,
    C: big5?.avg?.C ?? 0,
    E: big5?.avg?.E ?? 0,
    A: big5?.avg?.A ?? 0,
    N: big5?.avg?.N ?? 0,
  };

  // 4) Compute Motivators (Pure Logic)
  // We pass 'macro' now so the calculator can see explicit user choices
  const allMotivators = await computeMotivators({
    big5: big5Map,
    riasec: riasecMap,
    intakeText,
    macro, 
  });

  // 5) Sort & Slice
  // computeMotivators already returns sorted by score (desc), but let's be safe
  const sorted = [...allMotivators].sort((a, b) => (b.score ?? 0) - (a.score ?? 0));
  
  const topMotivators = sorted.slice(0, 3).map((m) => ({
    name: m.label as MotivationName,
    why: m.rationale,
    score: m.score,
  }));

  const lowMotivators = sorted.slice(-3).map((m) => ({
    name: m.label as MotivationName,
    why: m.rationale, // You might want to flip the text here for "low" logic later
  }));

  // 6) Construct Report
  const report: ValuesReport = {
    title: "What Drives You at Work",
    opening:
      "Work values are the conditions that make work feel meaningful. They shape your motivation, focus, and long-term satisfaction. Here is what your data suggests matters most to you.",
    topMotivations: topMotivators,
    lowMotivations: lowMotivators,
    summary: generateSummary(topMotivators.map((m) => m.name)),
    debug: { 
      usedSignals: { 
        macroIds: Object.keys(macro?.likert ?? {}), 
        riasecTop: riasec?.top3 
      } 
    },
  };

  await writeCache(uid, rid, report).catch(() => {});
  return report;
}