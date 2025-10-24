// src/app/lib/results/generators/generate-riasec-section.ts
import type { RIASECSummary, RIASECKey } from "@/app/lib/results/loaders/map-riasec";

export type TraitNarrative = {
  key: RIASECKey;
  header: string;
  level: "high" | "moderate" | "low";
  score: number;
  paragraph: string;
};

export type RiasecSection = {
  intro: string;
  traits: TraitNarrative[];
  combinedInsight: string;
  environments: {
    paragraph: string;
    examples: string[];
  };
};

/** --- Helper Functions --- */
function levelFor(score: number): "high" | "moderate" | "low" {
  if (score >= 4.2) return "high";
  if (score >= 3.2) return "moderate";
  return "low";
}

const LABELS: Record<RIASECKey, string> = {
  R: "Realistic",
  I: "Investigative",
  A: "Artistic",
  S: "Social",
  E: "Enterprising",
  C: "Conventional",
};

const TRAIT_TEMPLATES: Record<
  RIASECKey,
  { high: string; moderate: string; low: string; tagline: string }
> = {
  R: {
    tagline: "Hands-on & practical",
    high: "You’re energized by building, operating, or fixing real things. You prefer clear results, tools, and materials over abstract theory, and you likely enjoy learning by doing.",
    moderate:
      "You appreciate practical work when it connects to a clear outcome, though you also value planning and context.",
    low: "You’re less motivated by hands-on tasks and may prefer work with ideas, people, or aesthetics over tools and machinery.",
  },
  I: {
    tagline: "Analytical & curious",
    high: "You like to understand how systems work, dig into problems, and make sense of complexity. Deep focus and independent exploration tend to suit you.",
    moderate:
      "You enjoy problem-solving when it serves a clear purpose, balancing analysis with action.",
    low: "You’re less drawn to prolonged analysis and may prefer concrete execution, coordination, or creative expression.",
  },
  A: {
    tagline: "Creative & expressive",
    high: "You value originality, aesthetics, and personal voice. You tend to enjoy design, writing, storytelling, or other expressive mediums.",
    moderate:
      "You appreciate creativity as a spice—useful when it helps communicate or improve ideas.",
    low: "You prefer clarity and structure over open-ended creative exploration.",
  },
  S: {
    tagline: "Helpful & people-focused",
    high: "You’re motivated by supporting, teaching, or guiding others. Collaboration and service give your work meaning.",
    moderate:
      "You enjoy people work in the right dose, especially with clear roles and shared goals.",
    low: "You’re selective about people-heavy roles and may prefer focused individual work or small teams.",
  },
  E: {
    tagline: "Initiating & persuasive",
    high: "You like to take the lead, rally resources, and move ideas forward. Ambition, ownership, and outcomes matter to you.",
    moderate:
      "You’ll step up when needed, especially if the vision is compelling and the path is clear.",
    low: "You prefer contributing without carrying the responsibility of steering the ship.",
  },
  C: {
    tagline: "Organized & systematic",
    high: "You value order, reliability, and repeatable processes. You’re good at bringing structure and consistency to operations.",
    moderate:
      "You like enough structure to move efficiently, but not so much that it limits flexibility.",
    low: "You’re comfortable with ambiguity and may resist heavy process when it slows momentum.",
  },
};

/** --- Core paragraph builder --- */
function traitParagraph(
  key: RIASECKey,
  score: number
): TraitNarrative {
  const lvl = levelFor(score);
  const t = TRAIT_TEMPLATES[key];
  const header = `${LABELS[key]} (${key}) — ${t.tagline}`;
  const youLine = `You scored ${score.toFixed(
    2
  )}, which indicates a ${lvl} preference for ${LABELS[
    key
  ].toLowerCase()} work.`;
  return {
    key,
    header,
    level: lvl,
    score,
    paragraph: `${youLine} ${t[lvl]}`,
  };
}

/** --- Combined Insight --- */
function combinedInsight(top3: RIASECKey[]): string {
  const names = top3.map((k) => LABELS[k]).join(", ");
  return `Overall, your strongest interests cluster around ${names}. This blend often means you’re motivated by environments that let you use your strengths in multiple ways — thinking, creating, leading, or supporting, depending on the balance.`;
}

/** --- Environments and Activities --- */
function environmentsFor(top3: RIASECKey[]): {
  paragraph: string;
  examples: string[];
} {
  const set = new Set(top3);

  if (set.has("I") && set.has("A")) {
    return {
      paragraph:
        "You’ll likely thrive in research-driven and creative environments that let you explore ideas, solve complex problems, and turn insights into tangible innovations.",
      examples: [
        "R&D teams and innovation labs",
        "Data analysis or product design",
        "Scientific communication and educational media",
      ],
    };
  }

  if (set.has("E") && set.has("I")) {
    return {
      paragraph:
        "You’re well-suited to analytical but fast-paced settings where strategy meets execution — places where you can test ideas, take ownership, and see measurable results.",
      examples: [
        "Startups and entrepreneurial ventures",
        "Consulting or business analytics",
        "Technical project management",
      ],
    };
  }

  if (set.has("S") && set.has("A")) {
    return {
      paragraph:
        "You thrive in human-centered, creative contexts that balance empathy and expression — often where communication, design, or education come together.",
      examples: [
        "Teaching and training design",
        "Educational content creation",
        "Therapy, coaching, or social innovation work",
      ],
    };
  }

  return {
    paragraph:
      "You perform best in roles that align closely with your top interests — ideally those that keep you learning, contributing, and working with a sense of purpose.",
    examples: [
      "Collaborative problem-solving teams",
      "Cross-functional innovation projects",
      "Environments that value creativity and initiative",
    ],
  };
}

/** --- Public function --- */
export function generateRiasecSection(data: RIASECSummary): RiasecSection {
  const ordered: RIASECKey[] = ["R", "I", "A", "S", "E", "C"];
  const map = Object.fromEntries(
    data.scores.map((s) => [s.key, s.avg])
  ) as Record<RIASECKey, number>;

  const traits = ordered.map((key) =>
    traitParagraph(key, map[key] ?? 0)
  );

  const intro =
    "The RIASEC model measures six dimensions of career interests. Each reflects a different way people prefer to work and create value.";

  const combined = combinedInsight(data.top3);
  const env = environmentsFor(data.top3);

  return {
    intro,
    traits,
    combinedInsight: combined,
    environments: env,
  };
}