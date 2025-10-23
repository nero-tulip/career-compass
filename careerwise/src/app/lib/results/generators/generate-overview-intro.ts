import type { IntakeSummary, MacroSummary } from "@/app/lib/results/types";

/** Which kind of highlight to use (maps to pastel classes in UI) */
export type HighlightTag =
  | "name" | "age" | "country" | "education" | "status" | "stage" | "goal"
  // granular macro tags (multi-color control)
  | "macroIndustry" | "macroEnv"
  | "macroLeadership" | "macroIncome" | "macroImpact"
  | "macroFlex" | "macroSecurity"
  | "macroTravel" | "macroLocation";

/** A renderable chunk of text; add `hi` to pastel-highlight it */
export type IntroSegment = { text: string; hi?: HighlightTag };

/** Lines → array of segments (each sentence is a line) */
export type OverviewIntro = { lines: IntroSegment[][]; meta?: { name?: string } };

const goalTranslations: Record<string, string> = {
  "clarity on career direction": "gain clarity on your career direction",
  "increased self-awareness": "increase your self-awareness",
  "find matching careers": "discover careers that truly match you",
  "a concrete action plan": "build a concrete plan of action",
  "mentor guidance": "find guidance from mentors",
  "explore new fields": "explore new professional fields",
  "skills development": "develop new skills and grow personally",
};

const seg = (text: string, hi?: HighlightTag): IntroSegment => ({ text, hi });
const cap = (s: string) => (s ? s[0].toUpperCase() + s.slice(1) : s);

/** Join multiple segment arrays with ", " and " and " (preserves highlights) */
function joinWithCommaAndAnd(parts: IntroSegment[][]): IntroSegment[] {
  if (parts.length === 0) return [];
  if (parts.length === 1) return parts[0];
  const out: IntroSegment[] = [];
  parts.forEach((p, i) => {
    if (i > 0) {
      out.push(seg(i === parts.length - 1 ? " and " : ", "));
    }
    out.push(...p);
  });
  return out;
}

export function generateOverviewIntro(
  intake: IntakeSummary,
  macro?: MacroSummary
): OverviewIntro {
  const name = intake.name?.trim();
  const age = intake.ageBand ? `${intake.ageBand}` : "";
  const country = intake.country?.label ?? "";
  const statusLabels = intake.status?.map((s) => s.label) ?? [];
  const stage = intake.stageOfCareer?.label ?? "";
  const goals = intake.goals?.map((g) => g.label.toLowerCase()) ?? [];

  // Context flags
  const isStudent =
    statusLabels.some((s) =>
      ["High school student", "College / University student"].includes(s)
    ) || stage.includes("college");

  const isProfessional =
    statusLabels.some((s) =>
      ["Working full-time", "Working part-time"].includes(s)
    ) || stage.includes("career");

  const isSelfEmp = statusLabels.includes("Self-employed / Freelancer");
  const isJobSeeker = statusLabels.includes("Unemployed / Looking");

  const lines: IntroSegment[][] = [];

  // Line 1: greeting
  lines.push([seg("Hi "), seg(name || "there", "name"), seg(",")]);

  // Line 2: warm opener
  lines.push([seg("It’s been fun getting to know you!")]);

  // Line 3: profile sentence
  const profile: IntroSegment[] = [];
  profile.push(seg("You're "));
  if (age) profile.push(seg(age, "age"), seg("-year-old"));
  if (country) {
    if (age) profile.push(seg(" "));
    profile.push(seg("living in "), seg(country, "country"));
  }

  // Education phrasing (use value → phrase, always highlight)
  const eduVal = intake.educationLevel?.value ?? "";
  const eduPhrase =
    eduVal === "secondary" ? "high school or an equivalent qualification" :
    eduVal === "some_college" ? "some college or undergraduate coursework" :
    eduVal === "bachelors" ? "a bachelor's degree" :
    eduVal === "masters" ? "a master's degree" :
    eduVal === "doctorate" ? "a doctorate" :
    eduVal === "other" ? "specialized training (e.g., trade school or a bootcamp)" :
    "";

  if (eduPhrase) profile.push(seg(" who's completed "), seg(eduPhrase, "education"));

  if (isSelfEmp) {
    profile.push(seg(" and you're carving your own path as a "), seg("self-employed professional", "status"));
  } else if (isProfessional) {
    const st = statusLabels.map((s) => s.toLowerCase()).join(", ");
    if (st) profile.push(seg(" and you're "), seg(st, "status"));
  } else if (isStudent) {
    profile.push(seg(" and you're "), seg("currently in school", "status"));
  } else if (isJobSeeker) {
    profile.push(seg(" and you're "), seg("unemployed and looking", "status"));
  }

  profile.push(seg("."));
  lines.push(profile);

  // Line 4: stage sentence
  if (stage) {
    if (stage.includes("entrepreneur")) {
      lines.push([seg("You’ve got an "), seg("entrepreneurial spark", "stage"), seg(" driving you forward.")]);
    } else {
      const stageText =
        stage.includes("college") ? "You’re about to make one of your first big career choices." :
        stage.includes("change") ? "You’re at a turning point, exploring a new direction for your career." :
        stage.includes("growth") ? "You’re focused on growing within your current path." :
        stage.includes("exploration") ? "You’re exploring what truly fits you best career-wise." :
        `You’re currently ${stage.toLowerCase()}.`;
      lines.push([seg(stageText)]);
    }
  }

  // Line 5: goals (each translated goal is highlighted)
  const translatedGoals = goals.map(
    (g) => goalTranslations[g] || `learn more about ${g}`
  );
  if (translatedGoals.length) {
    const goalParts = translatedGoals.map((g) => [seg(g, "goal")]);
    lines.push([seg("And you’re using CareerCompass to "), ...joinWithCommaAndAnd(goalParts), seg(".")]);
  } else {
    lines.push([seg("And you’re using CareerCompass to "), seg("better understand yourself and your opportunities", "goal"), seg(".")]);
  }

  /* ---------------- MACRO (grouped, multi-color highlights) ---------------- */
  if (macro) {
    lines.push([seg("With regards to your career preferences, here’s what we’ve gathered:")]);

    /** INDUSTRY + WORK ENV */
    const industries = macro.chips?.industry?.labels ?? [];
    const workEnv = macro.selects?.work_env?.value;
    if (industries.length || workEnv) {
      const clean = industries
        .map((l) =>
          l
            .replace(/[\p{Emoji_Presentation}\p{Extended_Pictographic}]/gu, "")
            .replace(/\/.*/g, "")
            .trim()
            .toLowerCase()
        )
        .filter(Boolean);

      const hasOther = clean.some((c) => c.includes("other"));
      const filtered = hasOther ? clean.filter((c) => !c.includes("other")) : clean;

      const joined =
        filtered.length <= 1
          ? (filtered[0] || "")
          : filtered.slice(0, -1).join(", ") + " and " + filtered.slice(-1);

      const prefix = filtered.length > 1 ? "industries like " : "the field of ";

      const envMap: Record<string, string> = {
        startup: "a fast-paced startup environment that values innovation",
        corporate: "a structured corporate setting with clear processes",
        nonprofit: "a mission-driven organisation focused on social impact",
        academic: "a research-oriented academic environment",
        creative: "a creative workplace where ideas flow freely",
        small_business: "a close-knit small-business atmosphere",
        remote: "a remote role that offers flexibility",
        entrepreneur: "an entrepreneurial role where you steer your own projects",
        freelance: "independent freelance work where you set your own direction",
        other: "an open-ended environment while you explore your options",
      };
      const envText = workEnv ? envMap[workEnv] : undefined;

      const line: IntroSegment[] = [
        seg("You’re most drawn to working in "),
        seg(prefix, undefined),
      ];
      if (joined) line.push(seg(joined, "macroIndustry"));
      if (envText) line.push(seg(" and you seem to thrive best in "), seg(envText, "macroEnv"));
      if (hasOther) line.push(seg(", but you’re open to exploring others as well"));
      line.push(seg("."));
      lines.push(line);
    }

    /** LEADERSHIP + INCOME + IMPACT (merged into one sentence with per-phrase highlights) */
    const leadership = macro.likert?.m4?.score;
    const income = macro.likert?.m1?.score;
    const impact = macro.likert?.m7?.score;

    const motiveParts: IntroSegment[][] = [];
    if (leadership !== undefined) {
      if (leadership >= 4) motiveParts.push([seg("confident stepping into leadership roles and guiding others", "macroLeadership")]);
      else if (leadership <= 2) motiveParts.push([seg("comfortable contributing within a supportive team", "macroLeadership")]);
    }
    if (income !== undefined) {
      if (income >= 4) motiveParts.push([seg("motivated by growth and financial success", "macroIncome")]);
      else if (income <= 2) motiveParts.push([seg("more driven by meaning and fulfillment than money", "macroIncome")]);
    }
    if (impact !== undefined && impact >= 4) {
      motiveParts.push([seg("driven to make a positive impact through your work", "macroImpact")]);
    }

    if (motiveParts.length) {
      lines.push([seg("You’re "), ...joinWithCommaAndAnd(motiveParts), seg(".")]);
    }

    /** FLEXIBILITY + SECURITY (both highlighted) */
    const flex = macro.likert?.m8?.score;
    const sec = macro.likert?.m3?.score;
    if (flex !== undefined || sec !== undefined) {
      if (flex >= 4 && sec >= 4) {
        lines.push([
          seg("You value "),
          seg("flexibility", "macroFlex"),
          seg(" and "),
          seg("stability", "macroSecurity"),
          seg(" — freedom matters, but so does security."),
        ]);
      } else if (flex >= 4) {
        lines.push([
          seg("You value "),
          seg("autonomy and flexibility", "macroFlex"),
          seg(" in how you structure your time."),
        ]);
      } else if (sec >= 4) {
        lines.push([
          seg("You place strong importance on "),
          seg("job security", "macroSecurity"),
          seg(" and long-term stability."),
        ]);
      }
    }

    /** TRAVEL + LOCATION (each phrase highlighted separately; specific countries included) */
    const travel = macro.selects?.travel_appetite?.value;
    const location = macro.selects?.where_to_work?.value;
    const preferredCountries = macro.chips?.preferred_countries?.labels ?? [];

    if (travel || location) {
      const travelMap: Record<string, string> = {
        love_frequent: "frequent travel for work",
        occasional: "occasional trips without constant travel",
        anchored: "staying rooted in one place",
      };
      const locMap: Record<string, string> = {
        home_country: "continue working in your current country",
        open_relocate: "relocate for the right opportunity",
        specific: "move to a specific country that inspires you",
        remote: "work remotely from anywhere",
      };

      const segs: IntroSegment[] = [seg("When it comes to your lifestyle, ")];

      if (travel) {
        segs.push(seg("you prefer "), seg(travelMap[travel] ?? "a balanced travel rhythm", "macroTravel"));
      }

      if (location) {
        if (travel) segs.push(seg(", and "));
        if (location === "specific" && preferredCountries.length) {
          const formatted = preferredCountries
            .map((c) => c.charAt(0).toUpperCase() + c.slice(1).toLowerCase())
            .join(preferredCountries.length > 1 ? ", " : "");
          const finalCountries =
            preferredCountries.length > 1
              ? formatted.replace(/,([^,]*)$/, " and$1")
              : formatted;
          segs.push(seg("you’d like to "), seg(`move to ${finalCountries}`, "macroLocation"));
        } else {
          segs.push(seg("you’d like to "), seg(locMap[location] ?? "choose where you work freely", "macroLocation"));
        }
      }

      segs.push(seg("."));
      lines.push(segs);
    }
  }

  // Closing
  lines.push([seg("Does that sound about right?")]);

  return { lines, meta: { name } };
}