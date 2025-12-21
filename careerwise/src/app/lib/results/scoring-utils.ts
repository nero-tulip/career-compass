// src/app/lib/results/scoring-utils.ts

import type { Scale } from "./clusters-taxonomy";

export const SCALE_MAP: Record<Scale, number> = {
  very_low: 1,
  low: 2,
  low_medium: 2.5,
  medium: 3,
  medium_high: 3.5,
  high: 4,
  very_high: 5,
  variable: 3,
};

export function calculateAsymmetricFit(
  userProfile: Record<string, number>,      // assumed 1..5
  targetProfile: Record<string, number>,    // assumed 1..5
  conflicts: Record<string, number> = {}
) {
  let totalPenalty = 0;
  const details: string[] = [];
  const warnings: string[] = [];

  // Deficits only
  for (const [trait, targetVal] of Object.entries(targetProfile)) {
    const userVal = userProfile[trait];

    // If you're enforcing RIASEC exists, this should never happen:
    if (typeof userVal !== "number") {
      continue; // or throw, depending on how strict you want scoring to be
    }

    const deficit = Math.max(0, targetVal - userVal - 0.5);

    if (deficit > 0) {
      const penalty = deficit * deficit * 3;
      totalPenalty += penalty;
      details.push(`Lower ${trait} than ideal (-${Math.round(penalty)})`);
    }
  }

  // Conflicts (excess only)
  for (const [trait, threshold] of Object.entries(conflicts)) {
    const userVal = userProfile[trait];
    if (typeof userVal !== "number") continue;

    const excess = Math.max(0, userVal - threshold);
    if (excess > 0) {
      const penalty = excess * 15;
      totalPenalty += penalty;
      warnings.push(`High ${trait} may clash here (-${Math.round(penalty)})`);
    }
  }

  return {
    score: Math.max(0, Math.round(100 - totalPenalty)),
    details,
    warnings,
  };
}