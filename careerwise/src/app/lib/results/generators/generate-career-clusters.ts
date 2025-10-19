// src/app/lib/results/generators/generate-career-clusters.ts
import type { User } from "firebase/auth";
import {
  loadIntakeSummary,
  loadMacroSummary,
  loadRiasecSummary,
  loadBig5Summary,
} from "@/app/lib/results/loaders/client-loaders";

/**
 * NOTE: This is a placeholder, deterministic ranker you can later replace with an LLM.
 * Keep return shape stable so the UI doesn’t change when you upgrade the engine.
 */

export type ClusterKey =
  | "tech_engineering"
  | "data_research"
  | "design_creative"
  | "business_leadership"
  | "healthcare_helping"
  | "education_social"
  | "ops_admin"
  | "hands_on_trades"
  | "media_communications";

export type ClusterItem = {
  key: ClusterKey;
  label: string;
  score: number;               // 0..100
  rationale: string;           // short explanation
  contributingSignals: string[]; // short tags, e.g., "RIASEC I high", "Big5 O↑"
  exampleRoles: string[];      // TODO: replace with ONET-backed examples later
};

export type ClusterResult = {
  clusters: ClusterItem[];     // sorted desc by score
};

// ------- Label map -------
const LABELS: Record<ClusterKey, string> = {
  tech_engineering:      "Tech & Engineering",
  data_research:         "Data & Research",
  design_creative:       "Design & Creative",
  business_leadership:   "Business & Leadership",
  healthcare_helping:    "Healthcare & Helping",
  education_social:      "Education & Social",
  ops_admin:             "Operations & Administration",
  hands_on_trades:       "Hands-on Trades",
  media_communications:  "Media & Communications",
};

// ------- Tiny helpers -------
function bump(score: number, by: number) { return Math.min(100, score + by); }
function tag(arr: string[], t: string) { arr.push(t); }

// ------- Main -------
export async function generateCareerClusters(user: User, rid: string): Promise<ClusterResult> {
  const [intake, macro, riasec, big5] = await Promise.all([
    loadIntakeSummary(user, rid).catch(() => undefined),
    loadMacroSummary(user, rid).catch(() => undefined),
    loadRiasecSummary(user, rid).catch(() => undefined),
    loadBig5Summary(user, rid).catch(() => undefined),
  ]);

  // Initialize scores and rationale tags
  const base: Record<ClusterKey, ClusterItem> = {
    tech_engineering:     { key: "tech_engineering",     label: LABELS.tech_engineering,     score: 20, rationale: "", contributingSignals: [], exampleRoles: [] },
    data_research:        { key: "data_research",        label: LABELS.data_research,        score: 20, rationale: "", contributingSignals: [], exampleRoles: [] },
    design_creative:      { key: "design_creative",      label: LABELS.design_creative,      score: 20, rationale: "", contributingSignals: [], exampleRoles: [] },
    business_leadership:  { key: "business_leadership",  label: LABELS.business_leadership,  score: 20, rationale: "", contributingSignals: [], exampleRoles: [] },
    healthcare_helping:   { key: "healthcare_helping",   label: LABELS.healthcare_helping,   score: 20, rationale: "", contributingSignals: [], exampleRoles: [] },
    education_social:     { key: "education_social",     label: LABELS.education_social,     score: 20, rationale: "", contributingSignals: [], exampleRoles: [] },
    ops_admin:            { key: "ops_admin",            label: LABELS.ops_admin,            score: 20, rationale: "", contributingSignals: [], exampleRoles: [] },
    hands_on_trades:      { key: "hands_on_trades",      label: LABELS.hands_on_trades,      score: 20, rationale: "", contributingSignals: [], exampleRoles: [] },
    media_communications: { key: "media_communications", label: LABELS.media_communications, score: 20, rationale: "", contributingSignals: [], exampleRoles: [] },
  };

  // --- RIASEC influence (top letters)
  const topR = riasec?.top3?.[0] ?? ""; // "R" | "I" | "A" | "S" | "E" | "C"
  const top2 = riasec?.top3?.[1] ?? "";
  const top3 = riasec?.top3?.[2] ?? "";

  const riasecLetters = [topR, top2, top3].filter(Boolean);

  for (const L of riasecLetters) {
    switch (L) {
      case "I":
        base.data_research.score     = bump(base.data_research.score, 18);
        tag(base.data_research.contributingSignals, "RIASEC: I high");
        break;
      case "A":
        base.design_creative.score   = bump(base.design_creative.score, 18);
        tag(base.design_creative.contributingSignals, "RIASEC: A high");
        base.media_communications.score = bump(base.media_communications.score, 8);
        tag(base.media_communications.contributingSignals, "RIASEC: A high");
        break;
      case "S":
        base.education_social.score  = bump(base.education_social.score, 18);
        tag(base.education_social.contributingSignals, "RIASEC: S high");
        base.healthcare_helping.score = bump(base.healthcare_helping.score, 10);
        tag(base.healthcare_helping.contributingSignals, "RIASEC: S high");
        break;
      case "E":
        base.business_leadership.score = bump(base.business_leadership.score, 18);
        tag(base.business_leadership.contributingSignals, "RIASEC: E high");
        break;
      case "R":
        base.hands_on_trades.score   = bump(base.hands_on_trades.score, 18);
        tag(base.hands_on_trades.contributingSignals, "RIASEC: R high");
        base.tech_engineering.score  = bump(base.tech_engineering.score, 8);
        tag(base.tech_engineering.contributingSignals, "RIASEC: R high");
        break;
      case "C":
        base.ops_admin.score         = bump(base.ops_admin.score, 18);
        tag(base.ops_admin.contributingSignals, "RIASEC: C high");
        base.business_leadership.score = bump(base.business_leadership.score, 6);
        tag(base.business_leadership.contributingSignals, "RIASEC: C high");
        break;
    }
  }

  // --- Big Five influence (means are 1–5)
  const O = big5?.avg.O ?? 0;
  const C = big5?.avg.C ?? 0;
  const E = big5?.avg.E ?? 0;
  const A = big5?.avg.A ?? 0;
  const N = big5?.avg.N ?? 0;

  if (O >= 3.6) {
    base.design_creative.score  = bump(base.design_creative.score, 8);
    tag(base.design_creative.contributingSignals, "Big5: Openness high");
    base.data_research.score    = bump(base.data_research.score, 6);
    tag(base.data_research.contributingSignals, "Big5: Openness high");
  }

  if (C >= 3.6) {
    base.ops_admin.score        = bump(base.ops_admin.score, 10);
    tag(base.ops_admin.contributingSignals, "Big5: Conscientiousness high");
    base.business_leadership.score = bump(base.business_leadership.score, 6);
    tag(base.business_leadership.contributingSignals, "Big5: Conscientiousness high");
  }

  if (E >= 3.6) {
    base.business_leadership.score = bump(base.business_leadership.score, 10);
    tag(base.business_leadership.contributingSignals, "Big5: Extraversion high");
    base.media_communications.score = bump(base.media_communications.score, 8);
    tag(base.media_communications.contributingSignals, "Big5: Extraversion high");
    base.education_social.score = bump(base.education_social.score, 4);
    tag(base.education_social.contributingSignals, "Big5: Extraversion high");
  }

  if (A >= 3.6) {
    base.education_social.score = bump(base.education_social.score, 8);
    tag(base.education_social.contributingSignals, "Big5: Agreeableness high");
    base.healthcare_helping.score = bump(base.healthcare_helping.score, 8);
    tag(base.healthcare_helping.contributingSignals, "Big5: Agreeableness high");
  }

  if (N <= 2.5) {
    base.tech_engineering.score = bump(base.tech_engineering.score, 4);
    tag(base.tech_engineering.contributingSignals, "Big5: Neuroticism low");
  } else if (N >= 3.6) {
    base.ops_admin.score = bump(base.ops_admin.score, 4);
    tag(base.ops_admin.contributingSignals, "Big5: Neuroticism high (prefers predictability)");
  }

  // --- Macro preferences (likert 1–5, selects/chips labels available)
  const income = macro?.likert?.m1?.score ?? 0;        // income importance
  const jobSec = macro?.likert?.m3?.score ?? 0;        // job security
  const impact = macro?.likert?.m7?.score ?? 0;        // meaning/impact
  const flex   = macro?.likert?.m8?.score ?? 0;        // schedule control
  const lead   = macro?.likert?.m4?.score ?? 0;        // leadership appetite
  const social = macro?.likert?.m6?.score ?? 0;        // social interaction

  if (income >= 4) {
    base.business_leadership.score = bump(base.business_leadership.score, 6);
    tag(base.business_leadership.contributingSignals, "Macro: Income high");
    base.tech_engineering.score = bump(base.tech_engineering.score, 4);
    tag(base.tech_engineering.contributingSignals, "Macro: Income high");
  }
  if (impact >= 4) {
    base.education_social.score = bump(base.education_social.score, 6);
    tag(base.education_social.contributingSignals, "Macro: Impact high");
    base.healthcare_helping.score = bump(base.healthcare_helping.score, 6);
    tag(base.healthcare_helping.contributingSignals, "Macro: Impact high");
  }
  if (jobSec >= 4) {
    base.ops_admin.score = bump(base.ops_admin.score, 6);
    tag(base.ops_admin.contributingSignals, "Macro: Job security high");
  }
  if (flex >= 4) {
    base.media_communications.score = bump(base.media_communications.score, 4);
    tag(base.media_communications.contributingSignals, "Macro: Flexibility high");
  }
  if (lead >= 4) {
    base.business_leadership.score = bump(base.business_leadership.score, 6);
    tag(base.business_leadership.contributingSignals, "Macro: Leadership high");
  }
  if (social >= 4) {
    base.education_social.score = bump(base.education_social.score, 4);
    tag(base.education_social.contributingSignals, "Macro: Social interaction high");
    base.media_communications.score = bump(base.media_communications.score, 4);
    tag(base.media_communications.contributingSignals, "Macro: Social interaction high");
  }

  // --- Industry interest chips (light nudge)
  const interested = intake?.interestedIndustries?.map(x => x.value) ?? [];
  const has = (v: string) => interested.includes(v);

  if (has("tech") || has("engineering")) {
    base.tech_engineering.score = bump(base.tech_engineering.score, 8);
    tag(base.tech_engineering.contributingSignals, "Intake: Industry interest");
  }
  if (has("science")) {
    base.data_research.score = bump(base.data_research.score, 8);
    tag(base.data_research.contributingSignals, "Intake: Industry interest");
  }
  if (has("design") || has("arts_entertainment") || has("writing") || has("marketing")) {
    base.design_creative.score = bump(base.design_creative.score, 8);
    tag(base.design_creative.contributingSignals, "Intake: Industry interest");
    base.media_communications.score = bump(base.media_communications.score, 4);
    tag(base.media_communications.contributingSignals, "Intake: Industry interest");
  }
  if (has("education")) {
    base.education_social.score = bump(base.education_social.score, 8);
    tag(base.education_social.contributingSignals, "Intake: Industry interest");
  }
  if (has("healthcare")) {
    base.healthcare_helping.score = bump(base.healthcare_helping.score, 8);
    tag(base.healthcare_helping.contributingSignals, "Intake: Industry interest");
  }
  if (has("project_mgmt") || has("consulting") || has("sales") || has("finance")) {
    base.business_leadership.score = bump(base.business_leadership.score, 8);
    tag(base.business_leadership.contributingSignals, "Intake: Industry interest");
  }
  if (has("admin")) {
    base.ops_admin.score = bump(base.ops_admin.score, 8);
    tag(base.ops_admin.contributingSignals, "Intake: Industry interest");
  }
  if (has("construction") || has("engineering")) {
    base.hands_on_trades.score = bump(base.hands_on_trades.score, 6);
    tag(base.hands_on_trades.contributingSignals, "Intake: Industry interest");
  }

  // --- Fill example roles (PLACEHOLDER; replace with ONET later)
  base.tech_engineering.exampleRoles      = ["Software Engineer", "Systems Engineer", "Product Engineer"];
  base.data_research.exampleRoles         = ["Data Analyst", "UX Researcher", "Research Assistant"];
  base.design_creative.exampleRoles       = ["Designer", "Content Creator", "Brand Designer"];
  base.business_leadership.exampleRoles   = ["Product Manager", "Growth Lead", "Operations Manager"];
  base.healthcare_helping.exampleRoles    = ["Allied Health Assistant", "Health Coach", "Clinical Assistant"];
  base.education_social.exampleRoles      = ["Teacher/Tutor", "Learning Designer", "Program Coordinator"];
  base.ops_admin.exampleRoles             = ["Ops Coordinator", "QA & Compliance", "Project Administrator"];
  base.hands_on_trades.exampleRoles       = ["Electrician Apprentice", "Field Technician", "Construction Assistant"];
  base.media_communications.exampleRoles  = ["Marketing Coordinator", "Social Media Manager", "PR Assistant"];

  // --- Compose rationales (short, data-backed)
  Object.values(base).forEach((c) => {
    const why = c.contributingSignals.slice(0, 3).join(" • ");
    c.rationale = why ? `Signals: ${why}` : "General fit from your profile.";
    c.score = Math.round(c.score);
  });

  const clusters = Object.values(base).sort((a, b) => b.score - a.score);
  return { clusters };
}