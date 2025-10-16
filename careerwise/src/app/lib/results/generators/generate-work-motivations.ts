// src/app/lib/results/generators/generate-work-motivations.ts
import type { User } from "firebase/auth";
import {
  loadIntakeSummary,
  loadMacroSummary,
  loadRiasecSummary,
  loadBig5Summary,
} from "@/app/lib/results/loaders/client-loaders";
import type { Motivator, MotivatorKey } from "@/app/lib/results/types";
import type { RIASECProfile } from "@/app/lib/results/types";

/* ---------------------------- labels ---------------------------- */

const LABELS: Record<MotivatorKey, string> = {
  mastery: "Mastery & Growth",
  impact: "Impact & Meaning",
  autonomy: "Autonomy & Ownership",
  stability: "Stability & Security",
  recognition: "Recognition & Influence",
  creativity: "Creativity & Expression",
  service: "Service & Mentorship",
  adventure: "Challenge & Variety",
  structure: "Structure & Clarity",
};

/* ------------------------ macro id registry --------------------- */
/** Matches your macroQuestions.json exactly (see your message). */
const IDS = {
  // Priorities
  income: "m1",
  impact: "m7",
  stability: "m3", // job security

  // Work style
  flexibility: "m8",

  // Proxies
  leadership: "m4",
  socialInteraction: "m6",
  entrepreneurialDrive: "m2",
} as const;

/* ---------------------------- helpers --------------------------- */

/** Merge-by-key + confidence bumping */
function push(
  arr: Motivator[],
  key: MotivatorKey,
  rationale: string,
  src: Motivator["sources"],
  conf: Motivator["confidence"] = "medium"
) {
  const i = arr.findIndex((m) => m.key === key);
  if (i === -1) {
    arr.push({ key, label: LABELS[key], rationale, sources: [...src], confidence: conf });
    return;
  }
  // merge sources
  arr[i].sources.push(...src);
  // bump confidence one notch
  arr[i].confidence =
    arr[i].confidence === "low" ? "medium" : "high";
}

/** Likert (1–5) → "Low" | "Medium" | "High" */
function likertToLevel(n?: number): "Low" | "Medium" | "High" | undefined {
  if (!n || Number.isNaN(n)) return undefined;
  if (n <= 2) return "Low";
  if (n === 3) return "Medium";
  return "High"; // 4–5
}

/**
 * Read a Likert score from your `mapMacro` output:
 *  macro.likert[id]?.score (1..5) → level string.
 */
function getLevelFromMacro(
  macro: any | undefined,
  id: string
): "Low" | "Medium" | "High" | undefined {
  const score = Number(macro?.likert?.[id]?.score ?? 0);
  return likertToLevel(score);
}

/**
 * Safely get the top RIASEC key whether top3 is [{key,value}] or ["R","I",...].
 */
function getTopRiasecKey(
  riasec: { top3?: Array<{ key: keyof RIASECProfile; value: number } | keyof RIASECProfile> } | undefined
): keyof RIASECProfile | undefined {
  const first = riasec?.top3?.[0];
  if (!first) return undefined;
  if (typeof first === "string") return first as keyof RIASECProfile;
  if (typeof first === "object" && "key" in first) return first.key as keyof RIASECProfile;
  return undefined;
}

/* ---------------------- main generator -------------------------- */

/**
 * Deterministic v1 motivator synthesis.
 * Later you can swap the body for an LLM but keep the return shape.
 */
export async function generateWorkMotivations(
  user: User,
  rid: string
): Promise<Motivator[]> {
  const [intake, macro, riasec, big5] = await Promise.all([
    loadIntakeSummary(user, rid).catch(() => undefined),
    loadMacroSummary(user, rid).catch(() => undefined),
    loadRiasecSummary(user, rid).catch(() => undefined),
    loadBig5Summary(user, rid).catch(() => undefined),
  ]);

  const out: Motivator[] = [];

  /* ---------------------- Macro-derived rules ---------------------- */
  const incomePriority = getLevelFromMacro(macro, IDS.income);
  const impactPref = getLevelFromMacro(macro, IDS.impact);
  const flexibility = getLevelFromMacro(macro, IDS.flexibility);
  const stabilityPref = getLevelFromMacro(macro, IDS.stability);

  const leadership = getLevelFromMacro(macro, IDS.leadership);
  const social = getLevelFromMacro(macro, IDS.socialInteraction);
  const founderDrive = getLevelFromMacro(macro, IDS.entrepreneurialDrive);

  if (impactPref === "High") {
    push(
      out,
      "impact",
      "You care about seeing tangible outcomes that matter to people or society.",
      [{ from: "macro", signal: "impact: High" }],
      "high"
    );
  }

  if (flexibility === "High") {
    push(
      out,
      "autonomy",
      "You value independence, flexible execution, and ownership of your work.",
      [{ from: "macro", signal: "flexibility: High" }]
    );
  }

  if (stabilityPref === "High") {
    push(
      out,
      "stability",
      "You prefer predictable environments with clear guardrails and reliability.",
      [{ from: "macro", signal: "job security: High" }]
    );
  }

  // Recognition: infer from income and/or leadership appetite
  if (incomePriority === "High" || leadership === "High") {
    push(
      out,
      "recognition",
      "Status, visible outcomes, or high-leverage paths are motivating to you.",
      [
        {
          from: "macro",
          signal: `income: ${incomePriority ?? "—"} / leadership: ${leadership ?? "—"}`,
        },
      ]
    );
  }

  // Autonomy proxy: leadership and/or founder drive
  if (leadership === "High" || founderDrive === "High") {
    push(
      out,
      "autonomy",
      "You like taking the lead and owning outcomes.",
      [
        {
          from: "macro",
          signal: `leadership: ${leadership ?? "—"} / founderDrive: ${founderDrive ?? "—"}`,
        },
      ]
    );
  }

  if (social === "High") {
    push(
      out,
      "service",
      "Collaboration, mentoring, and people-facing work likely feel meaningful.",
      [{ from: "macro", signal: "social interaction: High" }]
    );
  }

  /* ---------------------- RIASEC-derived rules --------------------- */
  const topR = getTopRiasecKey(riasec);
  switch (topR) {
    case "I":
      push(
        out,
        "mastery",
        "Deep understanding and improving your craft energize you.",
        [{ from: "riasec", signal: "I high" }]
      );
      break;
    case "A":
      push(
        out,
        "creativity",
        "You’re fueled by originality, aesthetic judgment, and expressive work.",
        [{ from: "riasec", signal: "A high" }]
      );
      break;
    case "S":
      push(
        out,
        "service",
        "Helping others grow and feel supported is a natural fit.",
        [{ from: "riasec", signal: "S high" }]
      );
      break;
    case "E":
      push(
        out,
        "recognition",
        "You’re energized by influence, momentum, and visible outcomes.",
        [{ from: "riasec", signal: "E high" }]
      );
      push(
        out,
        "autonomy",
        "You like taking the lead and owning outcomes.",
        [{ from: "riasec", signal: "E high" }]
      );
      break;
    case "R":
      push(
        out,
        "adventure",
        "Hands-on challenge, tangible work, and variety keep you engaged.",
        [{ from: "riasec", signal: "R high" }]
      );
      push(
        out,
        "structure",
        "Clear procedures and tools help you move fast and well.",
        [{ from: "riasec", signal: "R high" }]
      );
      break;
    case "C":
      push(
        out,
        "structure",
        "You thrive with clarity, dependable systems, and high standards.",
        [{ from: "riasec", signal: "C high" }]
      );
      push(
        out,
        "stability",
        "Predictable environments help you deliver consistently.",
        [{ from: "riasec", signal: "C high" }]
      );
      break;
  }

  /* ---------------------- Big-5 derived rules ---------------------- */
  const O = big5?.avg?.O ?? 0;
  const C = big5?.avg?.C ?? 0;
  const E = big5?.avg?.E ?? 0;
  const A = big5?.avg?.A ?? 0;
  const N = big5?.avg?.N ?? 0;

  if (O >= 3.6) {
    push(
      out,
      "creativity",
      "You’re curious and enjoy novel ideas and variety — creative work feels meaningful.",
      [{ from: "big5", signal: `O mean ~ ${O.toFixed(2)}` }]
    );
    push(
      out,
      "adventure",
      "You appreciate challenge and new domains; variety sustains motivation.",
      [{ from: "big5", signal: `O mean ~ ${O.toFixed(2)}` }]
    );
  }
  if (C >= 3.6) {
    push(
      out,
      "mastery",
      "You take pride in doing things well and improving skill over time.",
      [{ from: "big5", signal: `C mean ~ ${C.toFixed(2)}` }]
    );
    push(
      out,
      "structure",
      "Clear plans and standards help you perform at your best.",
      [{ from: "big5", signal: `C mean ~ ${C.toFixed(2)}` }]
    );
  }
  if (E >= 3.6) {
    push(
      out,
      "recognition",
      "You’re energized by people, momentum, and visible outcomes.",
      [{ from: "big5", signal: `E mean ~ ${E.toFixed(2)}` }]
    );
  }
  if (A >= 3.6) {
    push(
      out,
      "service",
      "Collaboration, mentoring, and prosocial work likely feel meaningful.",
      [{ from: "big5", signal: `A mean ~ ${A.toFixed(2)}` }]
    );
  }
  if (N <= 2.4) {
    push(
      out,
      "adventure",
      "You may tolerate ambiguity and change more easily, making variety exciting.",
      [{ from: "big5", signal: `N mean ~ ${N.toFixed(2)}` }],
      "low"
    );
  } else if (N >= 3.6) {
    push(
      out,
      "stability",
      "Environments with clear expectations and healthier pacing help you sustain energy.",
      [{ from: "big5", signal: `N mean ~ ${N.toFixed(2)}` }]
    );
  }

  /* ---------------------------- sort & cap ------------------------- */
  const order: MotivatorKey[] = [
    "impact",
    "mastery",
    "creativity",
    "autonomy",
    "recognition",
    "service",
    "stability",
    "structure",
    "adventure",
  ];

  return out
    .sort((a, b) => {
      // confidence desc
      const rank = (c: Motivator["confidence"]) =>
        c === "high" ? 2 : c === "medium" ? 1 : 0;
      const dc = rank(b.confidence) - rank(a.confidence);
      if (dc !== 0) return dc;
      // stable label order
      return order.indexOf(a.key) - order.indexOf(b.key);
    })
    .slice(0, 5);
}