// src/app/lib/intakeSummary.ts

/**
 * Intake schema (from your JSON):
 * profile: { name, ageBand, country, status[] }
 * prefs: {
 *   creativeAnalytical (0 creative → 100 analytical),
 *   independentTeam (0 independent → 100 team),
 *   structureFlex (0 structure → 100 flexibility),
 *   travel ("love_frequent" | "occasional" | "anchored"),
 *   workLocationIntent ("home_country" | "open_relocate" | "specific"),
 *   preferredCountries?: string[],
 *   dreamJob?: string
 * }
 */

export type RawIntake = {
  profile?: {
    name?: string;
    ageBand?: number; // 13..80
    country?: string; // ISO or label
    status?: string[]; // ["high_school", "university", ...]
  };
  prefs?: {
    creativeAnalytical?: number; // 0..100
    independentTeam?: number;    // 0..100
    structureFlex?: number;      // 0..100
    travel?: "love_frequent" | "occasional" | "anchored";
    workLocationIntent?: "home_country" | "open_relocate" | "specific";
    preferredCountries?: string[];
    dreamJob?: string;
  };
};

export type IntakeSummary = {
  summaryText: string;   // 1–2 sentences
  highlights: string[];  // concise bullets for LLM context or UI
};

function pctToWord(v?: number, left = "left", right = "right") {
  if (v === undefined || v === null) return undefined;
  if (v >= 75) return right;         // strongly right side
  if (v >= 60) return `somewhat ${right}`;
  if (v > 40)  return "balanced";
  if (v >= 25) return `somewhat ${left}`;
  return left;                        // strongly left side
}

function mapStatusPretty(values?: string[]) {
  if (!values || !values.length) return undefined;
  const pretty: Record<string,string> = {
    high_school: "high school student",
    university: "college/university student",
    bootcamp: "bootcamp/self-study",
    work_part_time: "working part-time",
    work_full_time: "working full-time",
    unemployed: "unemployed / looking",
  };
  return values.map(v => pretty[v] ?? v).join(", ");
}

function mapTravel(v?: string) {
  if (!v) return undefined;
  if (v === "love_frequent") return "enjoys frequent travel";
  if (v === "occasional")    return "is fine with occasional travel";
  if (v === "anchored")      return "prefers an anchored role (minimal travel)";
  return undefined;
}

function mapWorkLocationIntent(v?: string, preferred?: string[]) {
  if (!v) return undefined;
  if (v === "home_country")  return "wants to work in their current country";
  if (v === "open_relocate") return "is open to relocation if the role fits";
  if (v === "specific") {
    const list = (preferred ?? []).join(", ");
    return list ? `wants to work in: ${list}` : "wants to work in specific countries";
  }
  return undefined;
}

export function summarizeIntake(intakeUnknown: unknown): IntakeSummary {
  const intake = (intakeUnknown ?? {}) as RawIntake;

  const name = intake.profile?.name?.trim();
  const age = intake.profile?.ageBand;
  const country = intake.profile?.country;
  const statusPretty = mapStatusPretty(intake.profile?.status);

  const creativity = pctToWord(intake.prefs?.creativeAnalytical, "creative", "analytical");
  const teaming    = pctToWord(intake.prefs?.independentTeam, "independent", "team-oriented");
  const structure  = pctToWord(intake.prefs?.structureFlex, "structure", "flexibility");
  const travelPref = mapTravel(intake.prefs?.travel);
  const locationPref = mapWorkLocationIntent(intake.prefs?.workLocationIntent, intake.prefs?.preferredCountries);
  const dreamJob = intake.prefs?.dreamJob?.trim();

  // --- Summary (1–2 sentences) ---
  const parts: string[] = [];
  parts.push(name ? `${name} is` : "This person is");
  if (statusPretty) parts.push(statusPretty);
  if (age !== undefined) parts.push(`${age} years old`);
  if (country) parts.push(`based in ${country}`);
  const s1 = parts.join(", ") + ".";

  const prefs: string[] = [];
  if (creativity) prefs.push(`leans ${creativity}`);
  if (teaming)    prefs.push(`${teaming}`);
  if (structure)  prefs.push(`values ${structure}`);
  if (travelPref) prefs.push(travelPref);
  if (locationPref) prefs.push(locationPref);
  const s2 = prefs.length ? `Work preferences: ${prefs.join(", ")}.` : "";

  const s3 = dreamJob ? `Dream job note: ${dreamJob}` : "";

  const summaryText = [s1, s2, s3].filter(Boolean).join(" ").replace(/\s+/g, " ").trim();

  // --- Highlights (bullets) ---
  const highlights: string[] = [];
  if (statusPretty) highlights.push(`Status: ${statusPretty}`);
  if (country)      highlights.push(`Country: ${country}`);
  if (age !== undefined) highlights.push(`Age: ${age}`);
  if (creativity)   highlights.push(`Creative vs Analytical: ${creativity}`);
  if (teaming)      highlights.push(`Independent vs Team: ${teaming}`);
  if (structure)    highlights.push(`Structure vs Flexibility: ${structure}`);
  if (travelPref)   highlights.push(`Travel: ${travelPref}`);
  if (locationPref) highlights.push(`Location intent: ${locationPref}`);
  if (intake.prefs?.preferredCountries?.length) {
    highlights.push(`Preferred countries: ${intake.prefs.preferredCountries.join(", ")}`);
  }
  if (dreamJob) highlights.push(`Dream job: ${dreamJob}`);

  return {
    summaryText: summaryText || "Intake provided across profile and work preferences.",
    highlights,
  };
}