// src/app/lib/results/generators/generate-riasec-section.ts
import type { RIASECSummary, RIASECKey } from "@/app/lib/results/loaders/map-riasec";

/** Deterministic RNG seeded by a string (user/rid) */
function makeRng(seedStr: string) {
  let h = 2166136261 ^ seedStr.length;
  for (let i = 0; i < seedStr.length; i++) {
    h ^= seedStr.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return function rand() {
    // xorshift-ish step
    h += (h << 1) + (h << 4) + (h << 7) + (h << 8) + (h << 24);
    // convert to [0,1)
    return ((h >>> 0) % 1_000_000) / 1_000_000;
  };
}

/** Pick a random opener for a level, deterministically, avoiding duplicates within one report generation */
function pickUniqueOpener(
  lvl: "very_high" | "high" | "moderate" | "low" | "very_low",
  openers: Record<"very_high" | "high" | "moderate" | "low" | "very_low", string[]>,
  used: Set<string>,
  rng: () => number
): string {
  const pool = openers[lvl] ?? [];
  if (pool.length === 0) return "";
  // try a few times to find an unused one using deterministic rng
  for (let attempt = 0; attempt < 8; attempt++) {
    const idx = Math.floor(rng() * pool.length);
    const candidate = pool[idx];
    if (!used.has(candidate)) {
      used.add(candidate);
      return candidate;
    }
  }
  // fall back to first not used, or the first one
  for (const s of pool) {
    if (!used.has(s)) {
      used.add(s);
      return s;
    }
  }
  return pool[0];
}

export type TraitNarrative = {
  key: RIASECKey;
  header: string;
  level: "very_high" | "high" | "moderate" | "low" | "very_low";
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
function levelFor(score: number):
  | "very_high"
  | "high"
  | "moderate"
  | "low"
  | "very_low" {
  if (score >= 4.5) return "very_high";
  if (score >= 3.8) return "high";
  if (score >= 3) return "moderate";
  if (score >= 2.2) return "low";
  return "very_low";
}

const LABELS: Record<RIASECKey, string> = {
  R: "Realistic",
  I: "Investigative",
  A: "Artistic",
  S: "Social",
  E: "Enterprising",
  C: "Conventional",
};

/** --- Trait Templates with More Nuance --- */
const TRAIT_TEMPLATES: Record<
  RIASECKey,
  {
    tagline: string;
    very_high: string;
    high: string;
    moderate: string;
    low: string;
    very_low: string;
  }
> = {
  R: {
    tagline: "Hands-on & practical",
    very_high:
      "You thrive in tangible, physical environments. Building, fixing, or operating real things gives you deep satisfaction and a clear sense of progress.",
    high:
      "You’re energized by practical, results-oriented work—using tools, equipment, or systems to make something real.",
    moderate:
      "You enjoy practical work when it connects to a meaningful goal but also value balance with planning or creative thinking.",
    low:
      "You’re not strongly drawn to hands-on activity. You might prefer conceptual or interpersonal work to manual or technical tasks.",
    very_low:
      "You actively avoid hands-on or mechanical work, finding more fulfillment in abstract ideas, relationships, or creative expression.",
  },
  I: {
    tagline: "Analytical & curious",
    very_high:
      "You’re deeply inquisitive—driven to understand complex systems and underlying causes. You likely enjoy research, analysis, and long-form problem-solving.",
    high:
      "You’re naturally analytical and like breaking problems down logically to find solutions.",
    moderate:
      "You enjoy learning how things work when relevant but prefer balancing thinking with doing.",
    low:
      "You’re less interested in prolonged analysis and may prefer clear tasks, teamwork, or creative expression over independent research.",
    very_low:
      "You avoid abstract or analytical work and prefer visible, immediate action or interpersonal engagement.",
  },
  A: {
    tagline: "Creative & expressive",
    very_high:
      "You’re highly imaginative and drawn to self-expression—whether through art, writing, design, or storytelling. You see beauty and metaphor everywhere.",
    high:
      "You value originality and like bringing a personal touch or flair to your projects.",
    moderate:
      "You appreciate creativity in moderation—using it to improve ideas rather than as the centerpiece.",
    low:
      "You prefer clarity, efficiency, and practical results over open-ended artistic work.",
    very_low:
      "You tend to avoid ambiguous or abstract creative work, preferring order, rules, and predictable outcomes.",
  },
  S: {
    tagline: "Helpful & people-focused",
    very_high:
      "You’re deeply motivated by helping, teaching, and connecting. You likely find meaning in roles that uplift or guide others.",
    high:
      "You enjoy teamwork and human connection, and you’re energized when contributing to others’ success.",
    moderate:
      "You value people skills but like maintaining boundaries and balance between solo and group work.",
    low:
      "You prefer limited social interaction, thriving more in focused individual roles or small, familiar teams.",
    very_low:
      "You’re drained by people-heavy environments and feel most productive working independently with minimal collaboration.",
  },
  E: {
    tagline: "Initiating & persuasive",
    very_high:
      "You have a strong entrepreneurial drive—naturally taking charge, spotting opportunities, and motivating others toward results.",
    high:
      "You like leading when the vision excites you and you feel ownership of the outcome.",
    moderate:
      "You can lead when needed but prefer contributing without constant responsibility for direction.",
    low:
      "You’re more comfortable supporting than steering, preferring defined roles and predictable expectations.",
    very_low:
      "You actively avoid leadership or persuasion roles, finding them stressful or misaligned with your strengths.",
  },
  C: {
    tagline: "Organized & systematic",
    very_high:
      "You find satisfaction in structure, process, and precision. You likely enjoy optimizing systems, managing details, and keeping things on track.",
    high:
      "You value reliability and like when things run smoothly thanks to clear organization and routines.",
    moderate:
      "You appreciate some structure but also like flexibility and freedom to adapt as needed.",
    low:
      "You’re not overly concerned with strict systems—preferring variety or adaptability to rigid order.",
    very_low:
      "You resist structure entirely and may find rules, procedures, or repetition suffocating.",
  },
};

const LEVEL_PHRASE: Record<
  "very_high" | "high" | "moderate" | "low" | "very_low",
  string
> = {
  very_high: "a very strong",
  high: "a strong",
  moderate: "a moderate",
  low: "a lower",
  very_low: "a very low",
};

/** --- Core paragraph builder (more human, conversational tone, no duplicate openers) --- */
function traitParagraph(
  key: RIASECKey,
  score: number,
  usedOpeners: Set<string>,
  rng: () => number
): TraitNarrative {
  const lvl = levelFor(score);
  const t = TRAIT_TEMPLATES[key];
  const header = `${LABELS[key]} (${key}) — ${t.tagline}`;

  const openers: Record<
    "very_high" | "high" | "moderate" | "low" | "very_low",
    string[]
  > = {
    very_high: [
      `This area really stands out for you — scoring ${score.toFixed(
        2
      )} puts you near the top of the scale.`,
      `You absolutely shine here, with a score of ${score.toFixed(
        2
      )} showing a very strong pull toward ${LABELS[key].toLowerCase()} work.`,
      `You scored ${score.toFixed(
        2
      )}, one of your highest results — clearly this is a big part of how you operate.`,
    ],
    high: [
      `You scored ${score.toFixed(
        2
      )}, showing a solid leaning toward ${LABELS[key].toLowerCase()} activities.`,
      `There’s a clear strength here — ${LABELS[
        key
      ].toLowerCase()} traits play a noticeable role in how you work.`,
      `With a score of ${score.toFixed(
        2
      )}, you show a strong interest in ${LABELS[key].toLowerCase()} pursuits.`,
    ],
    moderate: [
      `Your score of ${score.toFixed(
        2
      )} suggests a balanced relationship with ${LABELS[
        key
      ].toLowerCase()} work — you appreciate it when it fits the context.`,
      `You’re somewhere in the middle here — ${LABELS[
        key
      ].toLowerCase()} tasks appeal to you, but they’re not your main driver.`,
      `A moderate ${score.toFixed(
        2
      )} score means you can enjoy ${LABELS[
        key
      ].toLowerCase()} work when it aligns with your goals.`,
    ],
    low: [
      `Scoring ${score.toFixed(
        2
      )} suggests ${LABELS[key].toLowerCase()} work isn’t a big motivator for you.`,
      `You might not find ${LABELS[
        key
      ].toLowerCase()} activities especially energizing — your interests likely lie elsewhere.`,
      `At ${score.toFixed(
        2
      )}, you show a lighter connection to ${LABELS[key].toLowerCase()} themes.`,
    ],
    very_low: [
      `With a score of ${score.toFixed(
        2
      )}, this area doesn’t seem to resonate much for you.`,
      `You scored quite low (${score.toFixed(
        2
      )}), suggesting that ${LABELS[
        key
      ].toLowerCase()
      } work feels more like a chore than a passion.`,
      `This one’s clearly not your cup of tea — ${score.toFixed(
        2
      )} puts it near the bottom of your preference list.`,
    ],
  };

  // use the helper to avoid duplicates
  const opener = pickUniqueOpener(lvl, openers, usedOpeners, rng);

  return {
    key,
    header,
    level: lvl,
    score,
    paragraph: `${opener} ${t[lvl]}`,
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
export function generateRiasecSection(
  data: RIASECSummary,
  seed: string
): RiasecSection {
  const ordered: RIASECKey[] = ["R", "I", "A", "S", "E", "C"];
  const map = Object.fromEntries(
    data.scores.map((s) => [s.key, s.avg])
  ) as Record<RIASECKey, number>;
  
  const rng = makeRng(seed);
  const usedOpeners = new Set<string>();

  const traits = ordered.map((key) =>
    traitParagraph(key, map[key] ?? 0, usedOpeners, rng)
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