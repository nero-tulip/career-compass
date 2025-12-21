// src/app/lib/results/generators/generate-career-clusters.ts

import type { User } from "firebase/auth";
import { CAREER_CLUSTERS, type ClusterId } from "../clusters-taxonomy";
import { loadUserSignals } from "@/app/lib/results/loaders/load-user-signals";
import { calculateAsymmetricFit } from "@/app/lib/results/scoring-utils";

type RiasecCode = "R" | "I" | "A" | "S" | "E" | "C";

export type ClusterItem = {
  /* =========================
     IDENTITY
     ========================= */

  key: ClusterId;
  label: string;
  description: string;

  /* =========================
     OVERALL ASSESSMENT
     ========================= */

  /** Overall orientation level shown prominently in UI */
  matchLevel: "Strong Fit" | "Viable with Tradeoffs" | "High Risk" | "Low Fit";

  /** Internal numeric score for sorting only (never shown raw) */
  score: number;

  /* =========================
     INTEREST ALIGNMENT (RIASEC)
     ========================= */

  interestFit: {
    level: "strong" | "moderate" | "weak";
    matchedTraits: Array<{
      code: RiasecCode;
      label: string;
      strength: "core" | "supporting";
    }>;
    missingTraits: Array<{
      code: RiasecCode;
      reason: string;
    }>;
  };

  /* =========================
     TEMPERAMENT & SUSTAINABILITY (BIG FIVE)
     ========================= */

  sustainability: {
    level: "safe" | "risky" | "unsustainable";
    supports: string[];
    risks: string[];
  };

  /* =========================
     LIFESTYLE & VALUES (MACRO)
     ========================= */

  lifestyleAlignment: {
    level: "aligned" | "mixed" | "misaligned";
    alignedWith: string[];
    tradeoffs: string[];
  };

  /* =========================
     CONTEXTUAL RELEVANCE (INTAKE)
     ========================= */

  relevance: {
    level: "high" | "medium" | "low";
    notes: string[];
  };

  /* =========================
     USER-FACING EXPLANATION
     ========================= */

  summary: {
    headline: string;
    bullets: string[];
  };

  /* =========================
     EXPLORATION (NOT PRESCRIPTION)
     ========================= */

  pathways: string[];
};

export type ClusterResult = {
  clusters: ClusterItem[];
};

const RIASEC_LABEL: Record<RiasecCode, string> = {
  R: "Realistic",
  I: "Investigative",
  A: "Artistic",
  S: "Social",
  E: "Enterprising",
  C: "Conventional",
};

function sumRiasec(v: Record<string, number> | undefined) {
  if (!v) return 0;
  return (v.R ?? 0) + (v.I ?? 0) + (v.A ?? 0) + (v.S ?? 0) + (v.E ?? 0) + (v.C ?? 0);
}

function toMatchLevel(score: number): ClusterItem["matchLevel"] {
  if (score >= 80) return "Strong Fit";
  if (score >= 60) return "Viable with Tradeoffs";
  if (score >= 40) return "High Risk";
  return "Low Fit";
}

function toInterestLevel(score: number): ClusterItem["interestFit"]["level"] {
  if (score >= 80) return "strong";
  if (score >= 55) return "moderate";
  return "weak";
}

function traitStrength(target: number): "core" | "supporting" {
  // "core" = the world strongly rewards it
  // "supporting" = it helps but isn't the main engine
  return target >= 3.5 ? "core" : "supporting";
}

/* =========================
   STEP 2 HELPERS (BIG FIVE)
   ========================= */

type Big5Short = "O" | "C" | "E" | "A" | "N";
type Big5Verbose = "openness" | "conscientiousness" | "extraversion" | "agreeableness" | "neuroticism";
type AnyBig5Key = Big5Short | Big5Verbose;

const BIG5_LABEL: Record<AnyBig5Key, string> = {
  O: "Openness",
  C: "Conscientiousness",
  E: "Extraversion",
  A: "Agreeableness",
  N: "Neuroticism",
  openness: "Openness",
  conscientiousness: "Conscientiousness",
  extraversion: "Extraversion",
  agreeableness: "Agreeableness",
  neuroticism: "Neuroticism",
};

function usesShortBig5Keys(profile: any): boolean {
  return profile && typeof profile === "object" && ("O" in profile || "N" in profile);
}

function mapUserBig5ToTargetKeys(userBig5: Record<string, number>, targetUsesShort: boolean): Record<string, number> {
  if (targetUsesShort) {
    return {
      O: userBig5.O,
      C: userBig5.C,
      E: userBig5.E,
      A: userBig5.A,
      N: userBig5.N,
    };
  }
  return {
    openness: userBig5.O,
    conscientiousness: userBig5.C,
    extraversion: userBig5.E,
    agreeableness: userBig5.A,
    neuroticism: userBig5.N,
  };
}

function buildBig5Targets(defBig5: any) {
  const targetUsesShort = usesShortBig5Keys(defBig5);

  // Treat N as a ceiling/conflict (low N should never be penalized)
  const noiseBand = 0.5;

  if (targetUsesShort) {
    const target: Record<string, number> = {
      O: defBig5.O,
      C: defBig5.C,
      E: defBig5.E,
      A: defBig5.A,
      // N excluded (handled as conflict)
    };
    const conflicts: Record<string, number> = {
      N: Math.min(5, (defBig5.N ?? 3) + noiseBand),
    };
    const traitOrder = ["O", "C", "E", "A", "N"];
    return { targetUsesShort, target, conflicts, traitOrder, noiseBand };
  }

  const target: Record<string, number> = {
    openness: defBig5.openness,
    conscientiousness: defBig5.conscientiousness,
    extraversion: defBig5.extraversion,
    agreeableness: defBig5.agreeableness,
    // neuroticism excluded (handled as conflict)
  };
  const conflicts: Record<string, number> = {
    neuroticism: Math.min(5, (defBig5.neuroticism ?? 3) + noiseBand),
  };
  const traitOrder = ["openness", "conscientiousness", "extraversion", "agreeableness", "neuroticism"];
  return { targetUsesShort, target, conflicts, traitOrder, noiseBand };
}

function toSustainabilityLevel(score: number): ClusterItem["sustainability"]["level"] {
  if (score >= 80) return "safe";
  if (score >= 60) return "risky";
  return "unsustainable";
}

export async function generateCareerClusters(user: User, rid: string): Promise<ClusterResult> {
  // STEP 1: load unified signals and require RIASEC
  const signals = await loadUserSignals(user, rid);

  // Your UX gates this, but we still hard-fail if RIASEC isn't actually present.
  // (loadUserSignals currently can return zeros if missing; this detects that too.)
  const userRiasec = signals.riasec;
  if (!userRiasec || sumRiasec(userRiasec as any) === 0) {
    throw new Error("Cluster Gen: Missing RIASEC profile (user has not completed RIASEC).");
  }

  const userBig5 = signals.big5;

  const clusters: ClusterItem[] = Object.values(CAREER_CLUSTERS).map((def) => {
    // --- RIASEC Fit (PRIMARY) ---
    const interestFitScore = calculateAsymmetricFit(
      userRiasec as any,
      def.riasecProfile as any,
      (def.riasecConflicts as any) ?? {},
      { traitOrder: ["R", "I", "A", "S", "E", "C"] }
    );

    const interestScore = Math.max(0, Math.min(100, interestFitScore.score));

    // Build clean interest bullets from breakdown (full names, no raw letters, no penalty numbers)
    const interestDeficits = interestFitScore.breakdown
      .filter((b) => b.kind === "deficit")
      .sort((a, b) => b.penalty - a.penalty)
      .map(({ trait }) => {
        const code = trait as RiasecCode;
        return `Lower ${RIASEC_LABEL[code]} interest than ideal.`;
      });

    const interestConflicts = interestFitScore.breakdown
      .filter((b) => b.kind === "conflict")
      .sort((a, b) => b.penalty - a.penalty)
      .map(({ trait }) => {
        const code = trait as RiasecCode;
        return `Very high ${RIASEC_LABEL[code]} interest may clash in this world.`;
      });

    // --- STEP 2: Big Five fit (MODULATOR) ---
    let big5Score: number | null = null;
    let sustainabilitySupports: string[] = [];
    let sustainabilityRisks: string[] = [];

    if (userBig5 && def.bigFiveProfile) {
      const { targetUsesShort, target, conflicts, traitOrder, noiseBand } = buildBig5Targets(def.bigFiveProfile as any);
      const userBig5Mapped = mapUserBig5ToTargetKeys(userBig5 as any, targetUsesShort);

      const big5Fit = calculateAsymmetricFit(
        userBig5Mapped,
        target,
        conflicts,
        {
          traitOrder,
          strictMissing: true,
          // Slightly gentler than interest scoring; this is a modulator, not the gate.
          deficitFactor: 2.5,
          conflictFactor: 10,
          conflictQuadratic: true,
          noiseBand,
        }
      );

      big5Score = Math.max(0, Math.min(100, big5Fit.score));

      // Build supports/risks deterministically (readable, not raw trait keys)
      for (const trait of traitOrder) {
        const label = BIG5_LABEL[trait as AnyBig5Key] ?? trait;

        // Conflicts first (e.g., Neuroticism ceiling)
        if (trait in conflicts) {
          const threshold = conflicts[trait];
          const uv = userBig5Mapped[trait];
          if (uv > threshold + 0.0) {
            sustainabilityRisks.push(
              `Higher ${label} may make this environment feel more intense day-to-day.`
            );
          } else if (uv <= threshold - noiseBand) {
            sustainabilitySupports.push(
              `Lower ${label} can be an advantage under pressure.`
            );
          }
          continue;
        }

        if (!(trait in target)) continue;

        const tv = target[trait];
        const uv = userBig5Mapped[trait];

        if (uv + noiseBand < tv) {
          sustainabilityRisks.push(
            `This world tends to reward higher ${label}; you may need more deliberate habits here.`
          );
        } else if (uv >= tv + noiseBand) {
          sustainabilitySupports.push(
            `Your ${label} supports the day-to-day demands of this world.`
          );
        }
      }

      // Keep UI tidy
      sustainabilitySupports = sustainabilitySupports.slice(0, 3);
      sustainabilityRisks = sustainabilityRisks.slice(0, 3);
    }

    // Final score for ranking/UI: 85% interest, 15% temperament (if available)
    const overallScore =
      typeof big5Score === "number"
        ? Math.round(interestScore * 0.85 + big5Score * 0.15)
        : interestScore;

    const score = Math.max(0, Math.min(100, overallScore));

    // Build matched/missing traits in a deterministic way:
    const matchedTraits: ClusterItem["interestFit"]["matchedTraits"] = [];
    const missingTraits: ClusterItem["interestFit"]["missingTraits"] = [];

    (["R", "I", "A", "S", "E", "C"] as RiasecCode[]).forEach((code) => {
      const targetVal = (def.riasecProfile as any)[code] ?? 0;
      const userVal = (userRiasec as any)[code] ?? 0;

      // Only talk about traits the cluster meaningfully cares about
      if (targetVal < 2.0) return;

      const deficit = targetVal - userVal;

      if (deficit <= 0.5) {
        matchedTraits.push({
          code,
          label: `${RIASEC_LABEL[code]} Interest`,
          strength: traitStrength(targetVal),
        });
      } else {
        missingTraits.push({
          code,
          reason: `This world typically rewards higher ${RIASEC_LABEL[code]} interest than your current profile suggests.`,
        });
      }
    });

    // Sort matched traits so "core" shows first, then by target level desc
    matchedTraits.sort((a, b) => {
      const aTarget = (def.riasecProfile as any)[a.code] ?? 0;
      const bTarget = (def.riasecProfile as any)[b.code] ?? 0;
      if (a.strength !== b.strength) return a.strength === "core" ? -1 : 1;
      return bTarget - aTarget;
    });

    // Headline: emphasize top 2 matched traits if available
    const topMatched = matchedTraits.slice(0, 2).map((t) => RIASEC_LABEL[t.code]);
    const headline =
      topMatched.length > 0
        ? `Your interests align with ${topMatched.join(" + ")} demands in this world.`
        : `This world rewards interests that may not be central in your current profile.`;

    // Bullets: interest reasons + one sustainability caveat (if any), short and UI-friendly
    const bullets = [
      ...interestDeficits.slice(0, 2),
      ...interestConflicts.slice(0, 2),
      ...(sustainabilityRisks.length ? [sustainabilityRisks[0]] : []),
    ].slice(0, 4);

    if (bullets.length === 0) {
      bullets.push("RIASEC alignment is broadly neutral here (no major deficits detected).");
    }

    const sustainabilityLevel =
      typeof big5Score === "number"
        ? toSustainabilityLevel(big5Score)
        : "risky";

    return {
      key: def.id,
      label: def.label,
      description: def.description,

      score,
      matchLevel: toMatchLevel(score),

      interestFit: {
        level: toInterestLevel(interestScore),
        matchedTraits,
        missingTraits,
      },

      sustainability: {
        level: sustainabilityLevel,
        supports: typeof big5Score === "number" ? sustainabilitySupports : [],
        risks:
          typeof big5Score === "number"
            ? (sustainabilityRisks.length ? sustainabilityRisks : ["Temperament fit looks broadly neutral."])
            : ["Big Five fit not evaluated (missing Big Five signals)."],
      },

      // Step 3 will replace this (Macro fit)
      lifestyleAlignment: {
        level: "mixed",
        alignedWith: [],
        tradeoffs: ["Macro lifestyle/values alignment not evaluated yet (Step 3)."],
      },

      // Step 3 will replace this (Intake relevance)
      relevance: {
        level: "medium",
        notes: ["Intake relevance not evaluated yet (Step 3)."],
      },

      summary: {
        headline,
        bullets,
      },

      pathways: def.pathways ?? [],
    };
  });

  clusters.sort((a, b) => b.score - a.score);
  return { clusters };
}