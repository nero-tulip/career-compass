import type { IntakeSummary } from "@/app/lib/results/types";

/** Which kind of highlight to use (maps to pastel classes in UI) */
export type HighlightTag =
  | "name"
  | "age"
  | "country"
  | "education"
  | "status"
  | "stage"
  | "goal";

/** A renderable chunk of text; add `hi` to pastel-highlight it */
export type IntroSegment = { text: string; hi?: HighlightTag };

/** Lines → array of segments (each sentence is a line) */
export type OverviewIntro = {
  lines: IntroSegment[][];
  meta?: { name?: string };
};

const goalTranslations: Record<string, string> = {
  "clarity on career direction": "gain clarity on your career direction",
  "increased self-awareness": "increase your self-awareness",
  "find matching careers": "discover careers that truly match you",
  "a concrete action plan": "build a concrete plan of action",
  "mentor guidance": "find guidance from mentors",
  "explore new fields": "explore new professional fields",
  "skills development": "develop new skills and grow personally",
};

function seg(text: string, hi?: HighlightTag): IntroSegment {
  return { text, hi };
}
function cap(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export function generateOverviewIntro(intake: IntakeSummary): OverviewIntro {
  const name = intake.name?.trim();
  const age = intake.ageBand ? `${intake.ageBand}` : "";
  const country = intake.country?.label ?? "";
  const edu = intake.educationLevel?.label ?? "";
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

  // Line 3: profile sentence (built in pieces so we can highlight tokens)
  const profile: IntroSegment[] = [];

  // Start
  profile.push(seg("You're "));
  if (age) {
    profile.push(seg(age, "age"), seg("-year-old"));
  }

  // location
  if (country) {
    if (age) profile.push(seg(" "));
    profile.push(seg("living in "), seg(country, "country"));
  }

  // education phrasing
  // --- education phrasing (use value codes; always highlight) ---
  const eduVal = intake.educationLevel?.value ?? ""; // "bachelors" | "masters" | ...
  let eduPhrase = "";

  switch (eduVal) {
    case "secondary":
      eduPhrase = "high school or an equivalent qualification";
      break;
    case "some_college":
      eduPhrase = "some college or undergraduate coursework";
      break;
    case "bachelors":
      eduPhrase = "a bachelor's degree";
      break;
    case "masters":
      eduPhrase = "a master's degree";
      break;
    case "doctorate":
      eduPhrase = "a doctorate";
      break;
    case "other":
      eduPhrase = "specialized training (e.g., trade school or a bootcamp)";
      break;
    default:
      eduPhrase = ""; // unknown / omitted
  }

  if (eduPhrase) {
    // pick your preferred connective; here’s “who’s completed …”
    profile.push(seg(" who's completed "), seg(eduPhrase, "education"));
  }

  // status phrasing
  if (isSelfEmp) {
    profile.push(
      seg(" and you're carving your own path as a "),
      seg("self-employed professional", "status")
    );
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
    let stageText = "";
    if (stage.includes("college")) {
      stageText = "You’re about to make one of your first big career choices.";
    } else if (stage.includes("change")) {
      stageText =
        "You’re at a turning point, exploring a new direction for your career.";
    } else if (stage.includes("growth")) {
      stageText = "You’re focused on growing within your current path.";
    } else if (stage.includes("entrepreneur")) {
      // highlight this phrase specifically
      lines.push([
        seg("You’ve got an "),
        seg("entrepreneurial spark", "stage"),
        seg(" driving you forward."),
      ]);
    } else if (stage.includes("exploration")) {
      stageText = "You’re exploring what truly fits you best career-wise.";
    } else {
      stageText = `You’re currently ${stage.toLowerCase()}.`;
    }
    if (stageText) lines.push([seg(stageText.replace(/\s+/g, " ").trim())]);
  }

  // Line 5: goals (each translated goal is highlighted)
  const translatedGoals = goals.map(
    (g) => goalTranslations[g] || `learn more about ${g}`
  );
  if (translatedGoals.length) {
    const goalSegs: IntroSegment[] = [
      seg("And you’re using CareerCompass to "),
    ];
    translatedGoals.forEach((g, i) => {
      if (i > 0 && i === translatedGoals.length - 1) {
        goalSegs.push(seg(", and "));
      } else if (i > 0) {
        goalSegs.push(seg(", "));
      }
      // ensure nice casing for highlights
      goalSegs.push(seg((g), "goal"));
    });
    goalSegs.push(seg("."));
    lines.push(goalSegs);
  } else {
    lines.push([
      seg("And you’re using CareerCompass to "),
      seg("better understand yourself and your opportunities", "goal"),
      seg("."),
    ]);
  }

  // Line 6: closing
  lines.push([seg("Does that sound about right?")]);

  return { lines, meta: { name } };
}
