// src/app/lib/results/generators/generate-team-role.ts
import type { User } from "firebase/auth";
import {
  loadBig5Summary,
  loadRiasecSummary,
  loadMacroSummary,
} from "@/app/lib/results/loaders/client-loaders";


/** Local, self-contained types (keeps this file portable). */
export type Signal = { from: "big5" | "riasec" | "macro"; signal: string };

export type TeamRoleKey =
  | "analyst"
  | "organizer"
  | "connector"
  | "driver"
  | "harmonizer"
  | "explorer";

export type TeamRoleSummary = {
  roleKey: TeamRoleKey;
  label: string;
  tagline: string;
  confidence: "high" | "likely" | "mixed";
  rationale: string;
  signals: Signal[];
  strengths: string[];
  friction: string[];
  complements: string[];
  tips: string[];
};

function confBump(curr: TeamRoleSummary["confidence"]): TeamRoleSummary["confidence"] {
  if (curr === "mixed") return "likely";
  if (curr === "likely") return "high";
  return "high";
}

/**
 * Rule-of-thumb mapping from Big-5 + Macro + (optional) RIASEC into a team-role archetype.
 * Deterministic, readable, and easy to swap later for LLM while keeping the same return shape.
 */
export async function generateTeamRole(
  user: User,
  rid: string
): Promise<TeamRoleSummary> {
  const [big5, macro, riasec] = await Promise.all([
    loadBig5Summary(user, rid).catch(() => undefined),
    loadMacroSummary(user, rid).catch(() => undefined),
    loadRiasecSummary(user, rid).catch(() => undefined),
  ]);

  const O = big5?.avg.O ?? 0;
  const C = big5?.avg.C ?? 0;
  const E = big5?.avg.E ?? 0;
  const A = big5?.avg.A ?? 0;
  const N = big5?.avg.N ?? 0;

  // Macro (Likert scales are 1–5; select values are strings)
  const leadershipScore = macro?.likert?.m4?.score ?? 0;               // “Do you enjoy leading others?”
  const socialScore     = macro?.likert?.m6?.score ?? 0;               // “How much social interaction…”
  const flexibilityPref = macro?.likert?.m8?.score ?? 0;               // schedule control
  const workEnv         = macro?.selects?.work_env?.value ?? "";       // startup/corporate/…

  // RIASEC hint (top letter)
  const topR = riasec?.top3?.[0] ?? ""; // ✅ top3 elements are already "R" | "I" | "A" | "S" | "E" | "C"

  // Start with a neutral default
  let role: TeamRoleSummary = {
    roleKey: "explorer",
    label: "The Explorer",
    tagline: "Curious generalist who bridges ideas and possibilities.",
    confidence: "mixed",
    rationale:
      "Your pattern suggests breadth, curiosity, and comfort with ambiguity. You tend to scout opportunities, connect dots, and prototype directions.",
    signals: [],
    strengths: [
      "Learns quickly across domains",
      "Connects disparate ideas",
      "Comfortable starting from zero",
    ],
    friction: [
      "May lose interest once systems are stable",
      "Can overextend into too many tracks",
    ],
    complements: [
      "Organizer (to lock in process and scale)",
      "Analyst (to deepen rigor and quality)",
    ],
    tips: [
      "Timebox exploration; commit to one path per cycle",
      "Pair with an Operator/Organizer to land projects",
    ],
  };

  // Helper to set/override role with signals as we go
  const setRole = (patch: Partial<TeamRoleSummary>, s?: Signal) => {
    role = { ...role, ...patch };
    if (s) role.signals.push(s);
  };

  // ---- First-pass by Big-5 structure ----
  // High E & High A → Connector
  if (E >= 3.6 && A >= 3.6) {
    setRole(
      {
        roleKey: "connector",
        label: "The Connector",
        tagline: "Social glue who aligns people and momentum.",
        confidence: confBump(role.confidence),
        rationale:
          "High Extraversion and Agreeableness map to relationship-building, facilitation, and cross-team momentum.",
        strengths: [
          "Builds trust quickly",
          "Bridges stakeholders",
          "Energizes groups and initiatives",
        ],
        friction: [
          "Context switching can dilute depth work",
          "May avoid hard tradeoffs to keep harmony",
        ],
        complements: ["Analyst", "Organizer", "Driver"],
        tips: [
          "Block deep-work windows for preparation",
          "Use written briefs to anchor decisions",
        ],
      },
      { from: "big5", signal: `E=${E.toFixed(2)}, A=${A.toFixed(2)}` }
    );
  }

  // High C & Mid/Low E → Organizer
  if (C >= 3.6 && E <= 3.4) {
    setRole(
      {
        roleKey: "organizer",
        label: "The Organizer",
        tagline: "Process builder who drives reliability and scale.",
        confidence: confBump(role.confidence),
        rationale:
          "High Conscientiousness with lower Extraversion suggests systems, documentation, and heads-down execution strength.",
        strengths: [
          "Creates clarity and standards",
          "Improves reliability and throughput",
          "Great at follow-through",
        ],
        friction: [
          "May resist rapid pivots without clear rationale",
          "Can be under-recognized in loud rooms",
        ],
        complements: ["Connector", "Driver"],
        tips: [
          "Surface wins and impact in demos",
          "Add small experiments to avoid stagnation",
        ],
      },
      { from: "big5", signal: `C=${C.toFixed(2)}, E=${E.toFixed(2)}` }
    );
  }

  // High O & High I (RIASEC) → Analyst
  if (O >= 3.6 || topR === "I") {
    setRole(
      {
        roleKey: "analyst",
        label: "The Analyst",
        tagline: "Clarity-seeker who adds rigor and explanatory power.",
        confidence: confBump(role.confidence),
        rationale:
          "Openness and Investigative interest map to analysis, sense-making, and model-building.",
        strengths: [
          "Cuts through noise with frameworks",
          "Uplifts quality via evidence",
          "Great at writing and deep dives",
        ],
        friction: [
          "Can stay in analysis too long",
          "May struggle when decisions require imperfect data",
        ],
        complements: ["Connector", "Driver"],
        tips: [
          "Agree a decision timebox up front",
          "Share an 80/20 summary first, appendix later",
        ],
      },
      { from: "riasec", signal: topR ? `Top=${topR}` : `O=${O.toFixed(2)}` }
    );
  }

  // High E & High C or strong leadership → Driver
  if ((E >= 3.6 && C >= 3.4) || leadershipScore >= 4) {
    setRole(
      {
        roleKey: "driver",
        label: "The Driver",
        tagline: "Outcome-oriented owner who turns plans into shipped work.",
        confidence: confBump(role.confidence),
        rationale:
          "Extraversion with structure (or explicit leadership appetite) aligns to directing projects and hitting milestones.",
        strengths: [
          "Creates momentum and accountability",
          "Clarifies priorities and tradeoffs",
          "Good at stakeholder alignment",
        ],
        friction: [
          "Risk of moving fast without enough discovery",
          "Can step on toes if context is thin",
        ],
        complements: ["Analyst", "Organizer"],
        tips: [
          "Schedule discovery upfront; protect deep-work time for others",
          "Publish short written decisions to keep alignment",
        ],
      },
      { from: "macro", signal: `leadership=${leadershipScore}` }
    );
  }

  // High A & S (RIASEC) → Harmonizer
  if (A >= 3.6 || topR === "S") {
    setRole(
      {
        roleKey: "harmonizer",
        label: "The Harmonizer",
        tagline: "Empathic teammate who improves collaboration and outcomes.",
        confidence: confBump(role.confidence),
        rationale:
          "Agreeableness and Social interest often show up as coaching, facilitation, and de-escalation strengths.",
        strengths: [
          "Creates psychological safety",
          "Reads context and intent",
          "Helps teams gel and sustain pace",
        ],
        friction: [
          "May over-index on harmony vs. hard calls",
          "Energy dips in highly adversarial cultures",
        ],
        complements: ["Driver", "Analyst"],
        tips: [
          "Use written tradeoffs to depersonalize tough choices",
          "Pair with a Driver to land decisions faster",
        ],
      },
      { from: "big5", signal: `A=${A.toFixed(2)} / RIASEC S=${topR === "S" ? "high" : "—"}` }
    );
  }

  // Environment nudges (startup ↔ corporate) tweak copy, not label
  if (workEnv === "startup" || flexibilityPref >= 4) {
    role.tips.push("Lean on short cycles and public demos; bias to shipping.");
    role.signals.push({ from: "macro", signal: "work_env=startup/flex" });
  }
  if (workEnv === "corporate" || C >= 3.6) {
    role.tips.push("Codify process improvements; publish playbooks for scale.");
    role.signals.push({ from: "macro", signal: "work_env=corporate" });
  }

  // Confidence guardrail: if signals are sparse
  if (role.signals.length <= 1 && role.confidence === "high") {
    role.confidence = "likely";
  }
  if (role.signals.length === 0) {
    role.confidence = "mixed";
  }

  // Keep signals tidy (short tags)
  role.signals = role.signals.slice(0, 6);

  return role;
}