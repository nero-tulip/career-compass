// src/app/lib/results/generators/generate-decision-style.ts
import type { User } from "firebase/auth";
import {
  loadBig5Summary,
  loadMacroSummary,
  loadRiasecSummary,
} from "@/app/lib/results/loaders/client-loaders";

export type DecisionSummary = {
  paragraph: string;
  tags: string[];
  decisionStyle: string;
  stressResponse: string;
  goalApproach: string;
};

export async function generateDecisionSummary(
  user: User,
  rid: string
): Promise<DecisionSummary> {
  const [big5, macro, riasec] = await Promise.all([
    loadBig5Summary(user, rid).catch(() => undefined),
    loadMacroSummary(user, rid).catch(() => undefined),
    loadRiasecSummary(user, rid).catch(() => undefined),
  ]);

  const O = big5?.avg.O ?? 0;
  const C = big5?.avg.C ?? 0;
  const E = big5?.avg.E ?? 0;
  const A = big5?.avg.A ?? 0;
  const N = big5?.avg.N ?? 0;
  const topR = riasec?.top3?.[0] ?? "";
  const flexibility = macro?.likert?.m8?.score ?? 3;

  // --- Tag heuristics ---
  const tags = [
    O >= 3.6 && "🧠 Analytical",
    E >= 3.6 && "🔥 Decisive",
    C >= 3.6 && "🎯 Disciplined",
    N <= 2.5 && "🧘 Calm under pressure",
    flexibility >= 4 && "🌍 Flexible",
    topR === "I" && "🔍 Investigative thinker",
  ].filter(Boolean) as string[];

  // --- Decision style ---
  let decisionStyle = "";
  if (O >= 3.6 && C >= 3.6) {
    decisionStyle = "You balance analysis with follow-through — methodical, evidence-driven, and practical.";
  } else if (O >= 3.6) {
    decisionStyle = "You think in possibilities. Your choices are guided by ideas, patterns, and curiosity.";
  } else if (E >= 3.6) {
    decisionStyle = "You decide quickly, guided by instinct and social input. Action beats hesitation for you.";
  } else {
    decisionStyle = "You prefer to gather context and weigh options carefully before committing.";
  }

  // --- Stress response ---
  let stressResponse = "";
  if (N <= 2.5) {
    stressResponse = "You stay composed under pressure and recover quickly from setbacks.";
  } else if (N >= 3.6) {
    stressResponse = "You may feel stress intensely but also use it as motivation when goals matter.";
  } else {
    stressResponse = "You experience stress moderately — enough to stay alert without being overwhelmed.";
  }

  // --- Goal approach ---
  let goalApproach = "";
  if (C >= 3.6) {
    goalApproach = "You like defined targets, structured plans, and measurable outcomes.";
  } else if (O >= 3.6) {
    goalApproach = "You chase mastery and insight more than milestones — progress matters more than perfection.";
  } else if (E >= 3.6) {
    goalApproach = "You set ambitious goals and move fast, often learning by doing.";
  } else {
    goalApproach = "You prefer adaptable goals that evolve as you learn.";
  }

  const paragraph = [
    "Your decision-making reflects your balance between thought, action, and adaptability.",
    decisionStyle,
    stressResponse,
    goalApproach,
  ].join(" ");

  return { paragraph, tags, decisionStyle, stressResponse, goalApproach };
}