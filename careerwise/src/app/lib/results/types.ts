// Shared types for the unified results pipeline

export type LabeledValue<T = string | number | boolean> = {
  /** The raw value we store (id / code / number / boolean) */
  value: T;
  /** Human-readable label shown to the user (what they clicked or how we describe it) */
  label: string;
  /** Optional “scale context” that explains the meaning of a numeric choice */
  scaleContext?: {
    /** e.g. "How important is earning a high income?" */
    prompt: string;
    /** e.g. ["don't care", "nice to have", ..., "major goal"] */
    scale: string[];
    /** 1-based index into the scale OR numeric 1..5 */
    choiceIndex?: number;
  };
};

export type IntakeSummary = {
  name?: string;
  ageBand?: number; // slider (13..80)
  country?: LabeledValue<string>; // country code + label
  educationLevel?: LabeledValue<string>;
  status?: LabeledValue<string>[]; // chips, multi
  stageOfCareer?: LabeledValue<string>;
  goals?: LabeledValue<string>[]; // chips, multi
  workEnvironment?: LabeledValue<string>;
  travelAppetite?: LabeledValue<string>;
  workLocationIntent?: LabeledValue<string>;
  preferredCountries?: LabeledValue<string>[]; // raw strings
  interestedIndustries?: LabeledValue<string>[]; // chips, multi
};

export type MacroLikert = {
  id: string;
  prompt: string;
  score: number; // 1..5
  choiceLabel: string; // resolved from scale
  scale: string[];
};

export type MacroSelect = {
  id: string;
  prompt: string;
  value: string;
  label: string;
};

export type MacroChips = {
  id: string;
  prompt: string;
  values: string[];
  labels: string[];
};

export type MacroTextarea = {
  id: string;
  prompt: string;
  text: string;
};

export type MacroSummary = {
  // Likert set (present if configured in JSON)
  likert: Record<string, MacroLikert>;
  // Non-likert
  selects: Record<string, MacroSelect>;
  chips: Record<string, MacroChips>;
  textareas: Record<string, MacroTextarea>;
};

export type RIASECProfile = { R: number; I: number; A: number; S: number; E: number; C: number };
export type Big5Profile = { O: number; C: number; E: number; A: number; N: number };

export type UserSignals = {
  intake?: IntakeSummary;
  macro?: MacroSummary;
  riasec?: RIASECProfile;
  big5?: Big5Profile;
};


export type MotivatorKey =
  | "mastery"         // growth, learning, craftsmanship
  | "impact"          // helping people / meaningful outcomes
  | "autonomy"        // independence, ownership, flexibility
  | "stability"       // security, predictability
  | "recognition"     // status, influence, visibility
  | "creativity"      // originality, self-expression
  | "service"         // care, mentorship, community
  | "adventure"       // novelty, challenge, variety
  | "structure"       // order, systems, process
  | "belonging"       // teamwork, supportive culture

export type Motivator = {
  key: MotivatorKey;
  label: string;
  rationale: string;           // short 1–2 sentence “why this fits you”
  sources: Array<{
    from: "intake" | "macro" | "riasec" | "big5";
    signal: string;            // e.g. "income_priority: High" or "RIASEC: A high"
  }>;
  confidence: "low" | "medium" | "high";
  score?: number;           // 0–100 optional overall score
};

// src/app/lib/results/types.ts
export type ValuesReport = {
  opening: string;
  topValues: Array<{
    key: MotivatorKey;
    label: string;
    score: number;
    confidence: "low" | "medium" | "high";
    coachNote: string;
    examples: string[];      // keep per-value examples on the cards
  }>;
  tradeoffs: Array<{ a: string; b: string; note: string }>;
  thriveConditions: string[];
  watchouts: string[];
  talkTrack: string;
};