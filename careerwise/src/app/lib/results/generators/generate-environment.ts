// src/app/lib/results/generators/generate-environment.ts
import type { User } from "firebase/auth";
import {
  loadBig5Summary,
  loadRiasecSummary,
  loadMacroSummary,
} from "@/app/lib/results/loaders/client-loaders";

export type EnvironmentSummary = {
  paragraph: string;
  tags: string[];
  bestFits: Array<{ label: string; rationale: string }>;
  avoidFits: Array<{ label: string; rationale: string }>;
};

export async function generateEnvironmentSummary(
  user: User,
  rid: string
): Promise<EnvironmentSummary> {
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
  const workEnv = macro?.selects?.work_env?.value ?? "";
  const flexibility = macro?.likert?.m8?.score ?? 3;
  const topRIASEC = riasec?.top3?.[0] ?? "";

  // derive traits
  const creative = O >= 3.6 || topRIASEC === "A";
  const structured = C >= 3.6 || topRIASEC === "C";
  const social = E >= 3.6 || topRIASEC === "S" || topRIASEC === "E";
  const calm = N <= 2.5;
  const flexible = flexibility >= 4 || workEnv === "startup" || workEnv === "freelance";

  const tags = [
    creative && "🎨 Creative",
    structured && "🏢 Structured",
    social && "🤝 Collaborative",
    flexible && "🌍 Flexible / Remote-friendly",
    calm && "🧘 Calm-paced",
  ].filter(Boolean) as string[];

  const paragraph = [
    creative
      ? "You thrive in imaginative, idea-driven spaces that reward curiosity and innovation."
      : "You prefer clarity and tangible results over endless brainstorming.",
    structured
      ? "Reliable systems and clear expectations help you do your best work."
      : "You enjoy flexibility and dislike too many rules.",
    social
      ? "Collaboration energizes you; working around people gives you motivation."
      : "You do your best work independently, where you can focus deeply.",
    flexible
      ? "You value freedom to choose when and how you work."
      : "A predictable routine gives you focus and peace of mind.",
  ].join(" ");

  const bestFits = [
    creative && { label: "Creative, innovative teams", rationale: "Encourage imagination, experimentation, and design thinking." },
    structured && { label: "Structured organizations", rationale: "Provide stability, clarity, and established workflows." },
    social && { label: "Collaborative cultures", rationale: "Frequent feedback and teamwork keep you engaged." },
    flexible && { label: "Remote or hybrid setups", rationale: "Autonomy in time and location lets you operate at your best." },
  ].filter(Boolean) as Array<{ label: string; rationale: string }>;

  const avoidFits = [
    structured
      ? { label: "Chaotic or unorganized teams", rationale: "Too much ambiguity causes friction." }
      : { label: "Highly bureaucratic companies", rationale: "Overly rigid processes may feel suffocating." },
    social
      ? { label: "Isolated solo roles", rationale: "Too little collaboration can feel draining." }
      : { label: "Constantly social offices", rationale: "You may lose focus amidst noise and small talk." },
  ];

  return { paragraph, tags, bestFits, avoidFits };
}