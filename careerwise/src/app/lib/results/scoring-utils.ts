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

type FitOptions = {
  noiseBand?: number;            // default 0.5
  deficitFactor?: number;        // default 3
  conflictFactor?: number;       // default 10
  conflictQuadratic?: boolean;   // default true
  strictMissing?: boolean;       // default true (for cluster report)
  traitOrder?: string[];         // optional stable ordering
};

export function calculateAsymmetricFit(
  userProfile: Record<string, number>,      // assumed 1..5
  targetProfile: Record<string, number>,    // assumed 1..5
  conflicts: Record<string, number> = {},
  opts: FitOptions = {}
) {
  const noiseBand = opts.noiseBand ?? 0.5;
  const deficitFactor = opts.deficitFactor ?? 3;
  const conflictFactor = opts.conflictFactor ?? 10;
  const conflictQuadratic = opts.conflictQuadratic ?? true;
  const strictMissing = opts.strictMissing ?? true;

  let totalPenalty = 0;
  const details: string[] = [];
  const warnings: string[] = [];
  const breakdown: Array<{ trait: string; penalty: number; kind: "deficit" | "conflict" }> = [];

  const traits = opts.traitOrder ?? Array.from(
    new Set([...Object.keys(targetProfile), ...Object.keys(conflicts)])
  );

  // Deficits only
  for (const trait of traits) {
    if (!(trait in targetProfile)) continue;

    const targetVal = targetProfile[trait];
    const userVal = userProfile[trait];

    if (typeof userVal !== "number") {
      if (strictMissing) throw new Error(`Missing user trait: ${trait}`);
      continue;
    }

    const deficit = Math.max(0, targetVal - userVal - noiseBand);

    if (deficit > 0) {
      // importance scaling: missing a "core" trait hurts more
      const importance = Math.max(1, targetVal); // 1..5
      const penalty = (deficit * deficit) * deficitFactor * (importance / 3);

      totalPenalty += penalty;
      breakdown.push({ trait, penalty, kind: "deficit" });
      details.push(`Lower ${trait} than ideal.`);
    }
  }

  // Conflicts (excess only)
  for (const [trait, threshold] of Object.entries(conflicts)) {
    const userVal = userProfile[trait];
    if (typeof userVal !== "number") {
      if (strictMissing) throw new Error(`Missing user trait: ${trait}`);
      continue;
    }

    const excess = Math.max(0, userVal - threshold);
    if (excess > 0) {
      const penalty = conflictQuadratic
        ? (excess * excess) * conflictFactor
        : excess * conflictFactor;

      totalPenalty += penalty;
      breakdown.push({ trait, penalty, kind: "conflict" });
      warnings.push(`High ${trait} may clash here.`);
    }
  }

  const score = Math.max(0, Math.min(100, Math.round(100 - totalPenalty)));

  return { score, details, warnings, breakdown };
}