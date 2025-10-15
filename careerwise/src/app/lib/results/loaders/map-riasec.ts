// src/app/lib/results/loaders/map-riasec.ts
import type { User } from "firebase/auth";
import { loadSection } from "@/app/lib/drafts";
import type { RIASECProfile } from "@/app/lib/results/types";

export type RIASECKey = keyof RIASECProfile; // 'R' | 'I' | 'A' | 'S' | 'E' | 'C'
export type RIASECScore = { key: RIASECKey; value: number };
export type RIASECResult = {
  scores: RIASECScore[];
  top3: RIASECScore[];
};

export async function loadRiasecSummary(
  user: User,
  rid: string
): Promise<RIASECResult> {
  const raw = await loadSection(user, rid, "riasec");

  if (!Array.isArray(raw)) {
    throw new Error("Invalid or missing RIASEC data");
  }

  // Aggregate by letter inferred from questionId (e.g., "R12" -> "R")
  const profile: RIASECProfile = { R: 0, I: 0, A: 0, S: 0, E: 0, C: 0 };

  for (const ans of raw) {
    if (!ans) continue;
    const qid = String(ans.questionId ?? "");
    const letter = qid.charAt(0).toUpperCase() as RIASECKey;
    const score = Number(ans.score ?? 0) || 0;
    if (letter in profile) {
      profile[letter] += score;
    }
  }

  const scores: RIASECScore[] = (Object.entries(profile) as Array<[RIASECKey, number]>)
    .map(([key, value]) => ({ key, value }));

  const top3 = [...scores].sort((a, b) => b.value - a.value).slice(0, 3);

  return { scores, top3 };
}