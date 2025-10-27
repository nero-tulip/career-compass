// src/app/lib/results/generators/generate-work-motivations.ts
import type { User } from "firebase/auth";
import {
  loadIntakeSummary,
  loadMacroSummary,
  loadRiasecSummary,
  loadBig5Summary,
} from "@/app/lib/results/loaders/client-loaders";
import type { Motivator, MotivatorKey, RIASECProfile } from "@/app/lib/results/types";
import type { ValuesReport } from "@/app/lib/results/types";

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
  belonging: "Belonging & Teamwork",
};

/* ------------------------ macro id registry --------------------- */
const IDS = {
  income: "m1",
  impact: "m7",
  stability: "m3",
  flexibility: "m8",
  leadership: "m4",
  socialInteraction: "m6",
  entrepreneurialDrive: "m2",
} as const;

/* ---------------------------- helpers --------------------------- */

function dedupeSources(src: Motivator["sources"]) {
  const seen = new Set<string>();
  return src.filter((s) => {
    const k = `${s.from}:${s.signal}`;
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}

function rankConfidence(c: Motivator["confidence"]) {
  return c === "high" ? 2 : c === "medium" ? 1 : 0;
}

/** Lightweight score (0–100) from confidence + signal richness */
function toScore(m: Pick<Motivator, "confidence" | "sources" | "key">): number {
  const base = 30;
  const confBonus = m.confidence === "high" ? 40 : m.confidence === "medium" ? 20 : 5;

  // signal diversity: +5 per unique source type (macro/riasec/big5), up to 3
  const kinds = new Set(m.sources.map((s) => s.from));
  const diversity = Math.min(3, kinds.size) * 5;

  // richness: +3 per extra signal (beyond first 2), up to +15
  const richness = Math.max(0, m.sources.length - 2) * 3;
  const richnessCap = Math.min(15, richness);

  // small key weight to stabilize order (optional)
  const keyWeight = {
    impact: 6, mastery: 5, creativity: 4, autonomy: 4,
    recognition: 3, service: 3, stability: 3, structure: 2, adventure: 2,
  } as Record<MotivatorKey, number>;

  const raw = base + confBonus + diversity + richnessCap + (keyWeight[m.key] ?? 0);
  return Math.max(0, Math.min(100, Math.round(raw)));
}

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
    arr.push({
      key,
      label: LABELS[key],
      rationale,
      sources: dedupeSources(src),
      confidence: conf,
      score: undefined,
    });
    return;
  }
  // merge sources & bump confidence
  arr[i].sources = dedupeSources([...arr[i].sources, ...src]);
  arr[i].confidence = arr[i].confidence === "low" ? "medium" : "high";
}

/** Likert (1–5) → "Low" | "Medium" | "High" */
function likertToLevel(n?: number): "Low" | "Medium" | "High" | undefined {
  if (!n || Number.isNaN(n)) return undefined;
  if (n <= 2) return "Low";
  if (n === 3) return "Medium";
  return "High"; // 4–5
}

function getLevelFromMacro(macro: any | undefined, id: string) {
  const score = Number(macro?.likert?.[id]?.score ?? 0);
  return likertToLevel(score);
}

/** Handle top3 in either form: ["R","I",...] or [{key:"R", value:...}] */
function getTopRiasecKey(
  riasec: { top3?: Array<{ key: keyof RIASECProfile; value: number } | keyof RIASECProfile> } | undefined
): keyof RIASECProfile | undefined {
  const first = riasec?.top3?.[0];
  if (!first) return undefined;
  if (typeof first === "string") return first as keyof RIASECProfile;
  if (typeof first === "object" && "key" in first) return first.key as keyof RIASECProfile;
  return undefined;
}

/** Final polishing: rationale + score + sorting */
function finalize(arr: Motivator[]): Motivator[] {
  for (const m of arr) {
    const hint = m.sources
      .slice(0, 2)
      .map((s) => `${s.from}: ${s.signal}`)
      .join("; ");
    const ending = hint ? ` Signals: ${endingPeriod(hint)}.` : "";
    m.rationale = `${stripTrailingSpace(m.rationale)}${ending}`;
    m.score = toScore(m);
  }

  return arr
    .sort((a, b) => {
      const dc = rankConfidence(b.confidence) - rankConfidence(a.confidence);
      if (dc !== 0) return dc;
      return (b.score ?? 0) - (a.score ?? 0);
    })
    .slice(0, 5);
}

function stripTrailingSpace(s: string) {
  return s.replace(/\s+$/,'');
}
function endingPeriod(s: string) {
  return s.replace(/[.\s]+$/,'');
}

/* ---------------------- main motivators generator -------------------------- */

export async function generateWorkMotivations(user: User, rid: string): Promise<Motivator[]> {
  const [intake, macro, riasec, big5] = await Promise.all([
    loadIntakeSummary(user, rid).catch(() => undefined),
    loadMacroSummary(user, rid).catch(() => undefined),
    loadRiasecSummary(user, rid).catch(() => undefined),
    loadBig5Summary(user, rid).catch(() => undefined),
  ]);

  const out: Motivator[] = [];

  /* ---------------------- Macro-derived rules ---------------------- */
  const incomePriority = getLevelFromMacro(macro, IDS.income);
  const impactPref     = getLevelFromMacro(macro, IDS.impact);
  const flexibility    = getLevelFromMacro(macro, IDS.flexibility);
  const stabilityPref  = getLevelFromMacro(macro, IDS.stability);

  const leadership     = getLevelFromMacro(macro, IDS.leadership);
  const social         = getLevelFromMacro(macro, IDS.socialInteraction);
  const founderDrive   = getLevelFromMacro(macro, IDS.entrepreneurialDrive);

  if (impactPref === "High") {
    push(out, "impact",
      "You care about seeing tangible outcomes that matter to people or society.",
      [{ from: "macro", signal: "impact: High" }],
      "high");
  }

  if (flexibility === "High") {
    push(out, "autonomy",
      "You value independence, flexible execution, and ownership of your work.",
      [{ from: "macro", signal: "flexibility: High" }]);
  }

  if (stabilityPref === "High") {
    push(out, "stability",
      "You prefer predictable environments with clear guardrails and reliability.",
      [{ from: "macro", signal: "job security: High" }]);
  }

  if (incomePriority === "High" || leadership === "High") {
    push(out, "recognition",
      "Status, visible outcomes, or high-leverage paths are motivating to you.",
      [{ from: "macro", signal: `income: ${incomePriority ?? "—"} / leadership: ${leadership ?? "—"}` }]);
  }

  if (leadership === "High" || founderDrive === "High") {
    push(out, "autonomy",
      "You like taking the lead and owning outcomes.",
      [{ from: "macro", signal: `leadership: ${leadership ?? "—"} / founderDrive: ${founderDrive ?? "—"}` }]);
  }

  if (social === "High") {
    push(out, "service",
      "Collaboration, mentoring, and people-facing work likely feel meaningful.",
      [{ from: "macro", signal: "social interaction: High" }]);
  }

  /* ---------------------- RIASEC-derived rules --------------------- */
  const topR = getTopRiasecKey(riasec);
  switch (topR) {
    case "I":
      push(out, "mastery",
        "Deep understanding and improving your craft energize you.",
        [{ from: "riasec", signal: "I high" }]);
      break;
    case "A":
      push(out, "creativity",
        "You’re fueled by originality, aesthetic judgment, and expressive work.",
        [{ from: "riasec", signal: "A high" }]);
      break;
    case "S":
      push(out, "service",
        "Helping others grow and feel supported is a natural fit.",
        [{ from: "riasec", signal: "S high" }]);
      break;
    case "E":
      push(out, "recognition",
        "You’re energized by influence, momentum, and visible outcomes.",
        [{ from: "riasec", signal: "E high" }]);
      push(out, "autonomy",
        "You like taking the lead and owning outcomes.",
        [{ from: "riasec", signal: "E high" }]);
      break;
    case "R":
      push(out, "adventure",
        "Hands-on challenge, tangible work, and variety keep you engaged.",
        [{ from: "riasec", signal: "R high" }]);
      push(out, "structure",
        "Clear procedures and tools help you move fast and well.",
        [{ from: "riasec", signal: "R high" }]);
      break;
    case "C":
      push(out, "structure",
        "You thrive with clarity, dependable systems, and high standards.",
        [{ from: "riasec", signal: "C high" }]);
      push(out, "stability",
        "Predictable environments help you deliver consistently.",
        [{ from: "riasec", signal: "C high" }]);
      break;
  }

  /* ---------------------- Big-5 derived rules ---------------------- */
  const O = big5?.avg?.O ?? 0;
  const C = big5?.avg?.C ?? 0;
  const E = big5?.avg?.E ?? 0;
  const A = big5?.avg?.A ?? 0;
  const N = big5?.avg?.N ?? 0;

  if (O >= 3.6) {
    push(out, "creativity",
      "You’re curious and enjoy novel ideas and variety — creative work feels meaningful.",
      [{ from: "big5", signal: `O ≈ ${O.toFixed(2)}` }]);
    push(out, "adventure",
      "You appreciate challenge and new domains; variety sustains motivation.",
      [{ from: "big5", signal: `O ≈ ${O.toFixed(2)}` }]);
  }
  if (C >= 3.6) {
    push(out, "mastery",
      "You take pride in doing things well and improving skill over time.",
      [{ from: "big5", signal: `C ≈ ${C.toFixed(2)}` }]);
    push(out, "structure",
      "Clear plans and standards help you perform at your best.",
      [{ from: "big5", signal: `C ≈ ${C.toFixed(2)}` }]);
  }
  if (E >= 3.6) {
    push(out, "recognition",
      "You’re energized by people, momentum, and visible outcomes.",
      [{ from: "big5", signal: `E ≈ ${E.toFixed(2)}` }]);
  }
  if (A >= 3.6) {
    push(out, "service",
      "Collaboration, mentoring, and prosocial work likely feel meaningful.",
      [{ from: "big5", signal: `A ≈ ${A.toFixed(2)}` }]);
  }
  if (N <= 2.4) {
    push(out, "adventure",
      "You may tolerate ambiguity and change more easily, making variety exciting.",
      [{ from: "big5", signal: `N ≈ ${N.toFixed(2)}` }],
      "low");
  } else if (N >= 3.6) {
    push(out, "stability",
      "Environments with clear expectations and healthier pacing help you sustain energy.",
      [{ from: "big5", signal: `N ≈ ${N.toFixed(2)}` }]);
  }

  /* ---------------------------- finalize -------------------------- */
  return finalize(out);
}

/* ========================================================================== */
/*            Coach-style report (no experiments) - NEW EXPORT                */
/* ========================================================================== */

/** Per-value examples shown *inside each card* (stays on page; not an experiments block) */
const EXAMPLES_BY_KEY: Record<MotivatorKey, string[]> = {
  autonomy:  ["Own a clear problem end-to-end", "Negotiate flexible hours/WFH cadence"],
  mastery:   ["Block weekly ‘deep work’ for drills", "Ship one small craft improvement"],
  impact:    ["Shadow a customer call", "Volunteer for a visible, user-facing task"],
  creativity:["Prototype an alternative approach", "Pitch one ‘we could try…’ idea"],
  recognition:["Share a demo in show-and-tell", "Document a win and its impact"],
  stability: ["Clarify SLAs/boundaries", "Plan in predictable two-week increments"],
  service:   ["Offer a mentorship slot", "Pair-program or co-work a task"],
  adventure: ["Pick a slightly scary task this sprint", "Rotate into a new domain briefly"],
  structure: ["Co-create a ‘definition of done’", "Adopt a lightweight working agreement"],
  belonging: ["Celebrate small wins", "Schedule one relational 1:1 per week"],
};

const THRIVE_BY_KEY: Record<MotivatorKey, string[]> = {
  autonomy:  ["Clear ownership of outcomes", "Low micromanagement", "Flexible execution"],
  mastery:   ["Time for deep work", "Regular feedback loops on craft", "Stretch projects"],
  impact:    ["User contact or outcome metrics", "Visible line to customer value"],
  creativity:["Room for iteration", "Tolerance for drafts before polish"],
  recognition:["Demo culture", "Career ladder clarity", "Public recognition of wins"],
  stability: ["Realistic pacing", "Clear priorities", "Predictable processes"],
  service:   ["Mentorship opportunities", "Collaborative rituals"],
  adventure: ["Cross-functional exposure", "Space for small spikes/experiments"],
  structure: ["Definitions of done", "Team working agreements", "Good tooling"],
  belonging: ["Psychological safety", "Regular 1:1s", "Team celebrates progress"],
};

/** Build trade-off notes based on co-occurring motivators */
function buildTradeoffs(keys: Set<MotivatorKey>): Array<{ a: string; b: string; note: string }> {
  const T = (a: string, b: string, note: string) => ({ a, b, note });
  const out: Array<{ a: string; b: string; note: string }> = [];
  if (keys.has("autonomy") && keys.has("stability"))
    out.push(T("Autonomy", "Stability", "Aim for freedom within guardrails: define goals, not steps."));
  if (keys.has("creativity") && keys.has("structure"))
    out.push(T("Creativity", "Structure", "Use ‘sandbox → spec’: explore first, then lock a plan."));
  if (keys.has("recognition") && keys.has("service"))
    out.push(T("Recognition", "Service", "Alternate spotlight tasks with behind-the-scenes support."));
  if (keys.has("adventure") && keys.has("stability"))
    out.push(T("Variety", "Predictability", "Time-box experiments inside a stable rhythm."));
  return out;
}

/** Human-friendly opening paragraph */
function buildOpening(top: Motivator[]) {
  const names = top.map((m) => m.label.toLowerCase());
  if (!names.length) return "I don’t have enough signals yet to speak confidently.";
  if (names.length === 1) return `From your answers, you light up when work gives you ${names[0]}.`;
  if (names.length === 2) return `From your answers, you light up when work gives you ${names[0]} and ${names[1]}.`;
  return `From your answers, you light up when work gives you ${names[0]}, ${names[1]}, and ${names[2]}.`;
}

/**
 * Build the full conversational Values report for the page (no experiments section).
 * Returns narrative copy + structure ready for rendering.
 */
export async function generateValuesReport(user: User, rid: string): Promise<ValuesReport> {
  const motivs = await generateWorkMotivations(user, rid);
  const top = motivs.slice(0, 3);
  const opening = `${buildOpening(top)} Let’s translate that into day-to-day choices.`;

  const keys = new Set<MotivatorKey>(motivs.map((m) => m.key));
  const tradeoffs = buildTradeoffs(keys);

  const thriveConditions = top.flatMap((m) => THRIVE_BY_KEY[m.key] ?? []);

  const watchouts: string[] = [];
  const has = (k: MotivatorKey) => keys.has(k);
  if (has("autonomy") && !has("structure")) {
    watchouts.push("High autonomy can turn into chaos without weekly checkpoints.");
  }
  if (has("recognition") && has("service")) {
    watchouts.push("Protect time for both visibility and support so neither lags.");
  }
  if (has("stability") && has("adventure")) {
    watchouts.push("Batch novelty to avoid constant context switching.");
  }

  const talkTrack =
    `“I do my best work when I have ${top[0]?.label}${
      top[1] ? " and " + top[1].label : ""
    }. Could we shape my next project to include those conditions?”`;

  return {
    opening,
    topValues: top.map((m) => ({
      key: m.key,
      label: m.label,
      score: m.score ?? 0,
      confidence: m.confidence,
      coachNote: m.rationale,
      examples: EXAMPLES_BY_KEY[m.key] ?? [],
    })),
    tradeoffs,
    thriveConditions,
    watchouts,
    talkTrack,
  };
}