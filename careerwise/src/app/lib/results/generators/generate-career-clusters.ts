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
  // Simple rule for Step 1:
  // "core" = the world strongly rewards it
  // "supporting" = it helps but isn't the main engine
  return target >= 3.5 ? "core" : "supporting";
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

  const clusters: ClusterItem[] = Object.values(CAREER_CLUSTERS).map((def) => {
    // --- RIASEC Fit (PRIMARY) ---
    const fit = calculateAsymmetricFit(
      userRiasec as any,
      def.riasecProfile as any,
      (def.riasecConflicts as any) ?? {}
    );

    const score = Math.max(0, Math.min(100, fit.score));

    // Build matched/missing traits in a deterministic way:
    const matchedTraits: ClusterItem["interestFit"]["matchedTraits"] = [];
    const missingTraits: ClusterItem["interestFit"]["missingTraits"] = [];

    (["R", "I", "A", "S", "E", "C"] as RiasecCode[]).forEach((code) => {
      const target = (def.riasecProfile as any)[code] ?? 0;
      const userVal = (userRiasec as any)[code] ?? 0;

      // Only talk about traits the cluster meaningfully cares about
      if (target < 2.0) return;

      // Allow the same “noise band” your scorer uses (0.5)
      const deficit = target - userVal;

      if (deficit <= 0.5) {
        matchedTraits.push({
          code,
          label: `${RIASEC_LABEL[code]} Interest`,
          strength: traitStrength(target),
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

    // Bullets: use fit details/warnings (already deficit/conflict aware)
    // Keep it short and UI-friendly.
    const bullets = [
      ...fit.details.slice(0, 2),
      ...fit.warnings.slice(0, 2),
    ].slice(0, 4);

    // Ensure we always have at least *something* user-facing
    if (bullets.length === 0) {
      bullets.push("RIASEC alignment is broadly neutral here (no major deficits detected).");
    }

    return {
      key: def.id,
      label: def.label,
      description: def.description,

      score,
      matchLevel: toMatchLevel(score),

      interestFit: {
        level: toInterestLevel(score),
        matchedTraits,
        missingTraits,
      },

      // Step 2 will replace this (Big Five fit)
      sustainability: {
        level: "risky",
        supports: [],
        risks: ["Big Five fit not evaluated yet (Step 2)."],
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