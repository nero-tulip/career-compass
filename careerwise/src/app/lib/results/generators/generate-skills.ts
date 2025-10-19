// src/app/lib/results/generators/generate-skills.ts
import type { User } from "firebase/auth";
import {
  loadBig5Summary,
  loadRiasecSummary,
  loadMacroSummary,
} from "@/app/lib/results/loaders/client-loaders";

export type SkillSummary = {
  strengths: Array<{ label: string; rationale: string }>;
  growthAreas: Array<{ label: string; rationale: string }>;
};

export async function generateSkillSummary(user: User, rid: string): Promise<SkillSummary> {
  const [big5, riasec, macro] = await Promise.all([
    loadBig5Summary(user, rid).catch(() => undefined),
    loadRiasecSummary(user, rid).catch(() => undefined),
    loadMacroSummary(user, rid).catch(() => undefined),
  ]);

  const O = big5?.avg.O ?? 0;
  const C = big5?.avg.C ?? 0;
  const E = big5?.avg.E ?? 0;
  const A = big5?.avg.A ?? 0;
  const N = big5?.avg.N ?? 0;
  const topR = riasec?.top3?.[0] ?? "";

  const strengths: Array<{ label: string; rationale: string }> = [];
  const growthAreas: Array<{ label: string; rationale: string }> = [];

  // --- Big Five derived ---
  if (O >= 3.6) strengths.push({ label: "Creativity & Innovation", rationale: "You enjoy exploring ideas and finding new ways to solve problems." });
  else growthAreas.push({ label: "Creative thinking", rationale: "Experiment with brainstorming or ideation exercises to spark more originality." });

  if (C >= 3.6) strengths.push({ label: "Organization & Reliability", rationale: "You’re structured, disciplined, and deliver consistently." });
  else growthAreas.push({ label: "Consistency & Follow-through", rationale: "Develop systems or habits to improve reliability and execution." });

  if (E >= 3.6) strengths.push({ label: "Communication & Leadership", rationale: "You’re energized by interaction and can rally others around ideas." });
  else growthAreas.push({ label: "Self-advocacy", rationale: "Practice sharing your ideas and asserting your perspective in groups." });

  if (A >= 3.6) strengths.push({ label: "Empathy & Collaboration", rationale: "You work well with others and care about team harmony." });
  else growthAreas.push({ label: "Collaborative communication", rationale: "Focus on understanding others’ perspectives during disagreements." });

  if (N <= 2.4) strengths.push({ label: "Emotional Stability", rationale: "You handle stress and uncertainty with composure." });
  else if (N >= 3.6) growthAreas.push({ label: "Stress Management", rationale: "Work on mindfulness or pacing strategies to stay calm under pressure." });

  // --- RIASEC derived ---
  switch (topR) {
    case "I":
      strengths.push({ label: "Analytical Reasoning", rationale: "You enjoy investigating, researching, and making data-driven conclusions." });
      break;
    case "A":
      strengths.push({ label: "Creative Expression", rationale: "You bring originality and aesthetic judgment to your work." });
      break;
    case "S":
      strengths.push({ label: "Interpersonal Skills", rationale: "You communicate with empathy and help others grow." });
      break;
    case "E":
      strengths.push({ label: "Leadership & Influence", rationale: "You naturally take initiative and guide others toward shared goals." });
      break;
    case "R":
      strengths.push({ label: "Hands-on Problem Solving", rationale: "You excel in practical, mechanical, or physical problem contexts." });
      break;
    case "C":
      strengths.push({ label: "Attention to Detail", rationale: "You value order, precision, and clear structure in your work." });
      break;
  }

  // --- Macro influences ---
  const leadership = macro?.likert?.m4?.score ?? 0;
  const flexibility = macro?.likert?.m8?.score ?? 0;

  if (leadership >= 4)
    strengths.push({ label: "Team Leadership", rationale: "You enjoy coordinating people and guiding direction." });
  else
    growthAreas.push({ label: "Leadership Initiative", rationale: "Build confidence by taking small ownership roles in projects." });

  if (flexibility >= 4)
    strengths.push({ label: "Adaptability", rationale: "You work well in changing environments and can adjust plans easily." });
  else
    growthAreas.push({ label: "Adaptability", rationale: "Try exposing yourself to new challenges to expand your comfort zone." });

  return { strengths, growthAreas };
}