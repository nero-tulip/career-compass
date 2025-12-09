// src/app/lib/results/values-taxonomy.ts

export const MOTIVATION_TAXONOMY = [
  // Growth & Craft
  "Mastery",
  "Learning/Growth",
  "Innovation",          // <-- NEW: Building the new / problem solving
  "Creativity",

  // Outcomes & Drive
  "Impact",
  "Financial Reward",
  "Prestige/Status",
  "Competition",         // <-- NEW: Winning / Outperforming
  "Recognition",
  
  // Environment & Style
  "Autonomy",
  "Variety/Challenge",
  "Structure/Clarity",
  "Work–Life Harmony",
  "Risk-Taking",         // <-- OPTIONAL: Good for entrepreneurs, distinct from "Variety"
  "Stability",

  // People & Culture
  "Leadership",
  "Collaboration",       // <-- NEW: Active teamwork
  "Belonging",           // Feeling included/safe
  "Support/Mentorship",  // Renamed from "Service" for clarity
  "Purpose/Mission",
] as const;

export type MotivationName = typeof MOTIVATION_TAXONOMY[number];