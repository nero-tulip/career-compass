// src/app/lib/results/values-taxonomy.ts
export const MOTIVATION_TAXONOMY = [
  "Mastery", "Creativity", "Impact", "Autonomy", "Belonging",
  "Recognition", "Stability", "Financial Reward", "Leadership",
  "Service/Mentorship", "Variety/Challenge", "Structure/Clarity",
  "Purpose/Mission", "Work–Life Harmony", "Learning/Growth", "Prestige/Status"
] as const;

export type MotivationName = typeof MOTIVATION_TAXONOMY[number];