import type { Big5Summary, Big5Key } from "@/app/lib/results/loaders/map-big5";

export type Big5TraitNarrative = {
  key: Big5Key;
  header: string;
  score: number;
  level: "very_high" | "high" | "moderate" | "low" | "very_low";
  paragraph: string;
};

export type Big5Section = {
  intro: string;
  traits: Big5TraitNarrative[];
  combinedInsight: string;
};

/* ---------------- Helper ---------------- */
function levelFor(score: number): Big5TraitNarrative["level"] {
  if (score >= 4.5) return "very_high";
  if (score >= 3.8) return "high";
  if (score >= 3) return "moderate";
  if (score >= 2.2) return "low";
  return "very_low";
}

const LABELS: Record<Big5Key, string> = {
  O: "Openness",
  C: "Conscientiousness",
  E: "Extraversion",
  A: "Agreeableness",
  N: "Neuroticism",
};

/* ---------------- Deterministic copy bank ---------------- */
const TEMPLATES: Record<
  Big5Key,
  Record<Big5TraitNarrative["level"], string>
> = {
  O: {
    very_high:
      "You’re deeply curious, imaginative, and drawn to new ideas or unconventional paths. Abstract thinking and exploration come naturally.",
    high:
      "You enjoy learning, creativity, and new experiences, often bringing originality into your work and hobbies.",
    moderate:
      "You balance openness with practicality — comfortable with new ideas, but you don’t chase novelty for its own sake.",
    low:
      "You prefer clarity, tradition, and proven methods over constant experimentation or abstract theory.",
    very_low:
      "You tend to stick with what’s familiar, practical, and concrete, avoiding abstract or speculative thinking.",
  },
  C: {
    very_high:
      "You’re highly organized, disciplined, and goal-driven — the kind of person who thrives with systems and accountability.",
    high:
      "You’re reliable and detail-oriented, preferring to plan ahead and meet commitments with consistency.",
    moderate:
      "You’re dependable when it counts but flexible enough not to over-structure everything.",
    low:
      "You prefer freedom and spontaneity over strict plans, sometimes at the expense of routine or consistency.",
    very_low:
      "You resist structure entirely, often following impulse or inspiration more than schedules or systems.",
  },
  E: {
    very_high:
      "You’re social, expressive, and energized by people and activity. You draw energy from engagement and love leading the charge.",
    high:
      "You enjoy company, teamwork, and opportunities to interact — though you also know when to step back.",
    moderate:
      "You’re comfortable in social settings but equally fine with solitude — a healthy balance between inward and outward focus.",
    low:
      "You prefer smaller groups or quiet environments, conserving energy for meaningful interactions.",
    very_low:
      "You find large gatherings draining and are happiest working independently or in calm, predictable settings.",
  },
  A: {
    very_high:
      "You’re deeply empathetic, cooperative, and compassionate — people trust you to listen and understand.",
    high:
      "You work well with others, value harmony, and tend to avoid unnecessary conflict.",
    moderate:
      "You can be kind and cooperative when needed but aren’t afraid to assert boundaries or opinions.",
    low:
      "You prioritize truth and results over tact, which can make you honest but occasionally blunt.",
    very_low:
      "You prefer independence over diplomacy and may struggle with patience for group consensus.",
  },
  N: {
    very_high:
      "You’re emotionally sensitive and deeply self-aware, experiencing both highs and lows intensely. When managed well, this brings empathy and insight.",
    high:
      "You feel emotions strongly but are learning how to balance them with perspective.",
    moderate:
      "You’re generally even-keeled, with a healthy emotional range that rarely overwhelms you.",
    low:
      "You stay calm under pressure and recover quickly from stress or setbacks.",
    very_low:
      "You’re remarkably steady — almost unflappable — though you may occasionally under-express emotion.",
  },
};

/* ---------------- Builders ---------------- */
function traitParagraph(key: Big5Key, score: number): Big5TraitNarrative {
  const lvl = levelFor(score);
  const label = LABELS[key];
  const header = `${label} (${key})`;
  const paragraph = `${TEMPLATES[key][lvl]}`;
  return { key, header, score, level: lvl, paragraph };
}

function combinedInsight(top3: Big5Key[]): string {
  const names = top3.map((k) => LABELS[k]).join(", ");
  return `Your strongest personality dimensions — ${names} — combine to shape how you think, relate, and make decisions. Understanding this mix helps you lean into your strengths and anticipate where you might need balance.`;
}

export function generateBig5Section(data: Big5Summary): Big5Section {
  const ordered: Big5Key[] = ["O", "C", "E", "A", "N"];
  const traits = ordered.map((key) =>
    traitParagraph(key, data.avg[key] ?? 0)
  );

  return {
    intro:
      "The Big-5 model captures five broad personality dimensions that describe how you naturally think, feel, and interact with the world.",
    traits,
    combinedInsight: combinedInsight(data.top3),
  };
}