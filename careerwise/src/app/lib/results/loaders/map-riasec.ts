// src/app/lib/results/loaders/map-riasec.ts
import type { User } from "firebase/auth";
import { loadSection } from "@/app/lib/drafts";
import type { RIASECProfile } from "@/app/lib/results/types";

export type RIASECKey = keyof RIASECProfile;
export type RIASECScore = { key: RIASECKey; avg: number; count: number };
export type RIASECSummary = { scores: RIASECScore[]; top3: RIASECKey[] };

export async function loadRiasecSummary(
  user: User,
  rid: string
): Promise<RIASECSummary> {
  const raw = await loadSection(user, rid, "riasec");
  if (!Array.isArray(raw)) throw new Error("Invalid or missing RIASEC data");

  const profile: RIASECProfile = { R: 0, I: 0, A: 0, S: 0, E: 0, C: 0 };
  const counts: Record<RIASECKey, number> = {
    R: 0, I: 0, A: 0, S: 0, E: 0, C: 0,
  };

  for (const ans of raw) {
    const qid = String(ans?.questionId ?? "");
    const letter = qid.charAt(0).toUpperCase() as RIASECKey;
    const score = Number(ans?.score ?? 0);
    if (letter in profile) {
      profile[letter] += score;
      counts[letter] += 1;
    }
  }

  const scores: RIASECScore[] = (Object.keys(profile) as RIASECKey[]).map((key) => {
    const total = profile[key];
    const count = counts[key] || 1;
    const avg = total / count; // normalize to 1–5
    return { key, avg, count };
  });

  const top3 = [...scores]
    .sort((a, b) => b.avg - a.avg)
    .slice(0, 3)
    .map((s) => s.key);

  return { scores, top3 };
}