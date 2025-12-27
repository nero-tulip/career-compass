// src/app/lib/results/generators/generate-next-steps.ts
import type { User } from "firebase/auth";
import {
  loadIntakeSummary,
  loadMacroSummary,
  loadRiasecSummary,
  loadBig5Summary,
} from "@/app/lib/results/loaders/client-loaders";
import { generateCareerClusters } from "@/app/lib/results/generators/generate-career-clusters";

export type Signal = { from: "intake" | "macro" | "riasec" | "big5" | "clusters"; signal: string };

export type NextStep = {
  title: string;
  why: string;
  actions: string[];
  effort: "low" | "medium" | "high";
  signals: Signal[];
};

export type NextStepsSummary = {
  steps: NextStep[];
  note?: string;
};

function push(arr: NextStep[], s: NextStep, max = 5) {
  if (arr.length >= max) return;
  if (!arr.some(x => x.title.toLowerCase() === s.title.toLowerCase())) {
    arr.push(s);
  }
}

export async function generateNextSteps(user: User, rid: string): Promise<NextStepsSummary> {
  const [intake, macro, riasec, big5, clusters] = await Promise.all([
    loadIntakeSummary(user, rid).catch(() => undefined),
    loadMacroSummary(user, rid).catch(() => undefined),
    loadRiasecSummary(user, rid).catch(() => undefined),
    loadBig5Summary(user, rid).catch(() => undefined),
    generateCareerClusters(user, rid).catch(() => ({ clusters: [] })),
  ]);

  const steps: NextStep[] = [];
  const topCluster = clusters?.clusters?.[0];

  // ---- 1) Validate shortlist
  {
    const signals: Signal[] = [];
    if (topCluster) signals.push({ from: "clusters", signal: `top=${topCluster.key}` });
    push(steps, {
      title: "Validate your shortlist",
      why: "A 45–60 minute pass brings clarity fast without overcommitting.",
      actions: [
        "Pick your top 1–2 clusters from this report.",
        "Skim 3 example roles per cluster; save the ones that feel exciting.",
        "Write 3 reasons each role appeals to you (skills, impact, lifestyle).",
      ],
      effort: "low",
      signals,
    });
  }

  // Helpful flags
  const hasS = (riasec?.top3 ?? []).includes("S" as any);
  const hasI = (riasec?.top3 ?? []).includes("I" as any);

  const O = big5?.avg.O ?? 0;
  const C = big5?.avg.C ?? 0;
  const E = big5?.avg.E ?? 0;
  const A = big5?.avg.A ?? 0;
  const N = big5?.avg.N ?? 0;

  const leadershipScore = macro?.likert?.m4?.score ?? 0;
  const socialScore     = macro?.likert?.m6?.score ?? 0;
  const flexibilityPref = macro?.likert?.m8?.score ?? 0;
  const workEnv         = macro?.selects?.work_env?.label ?? "";
  const locationIntent  = macro?.selects?.where_to_work?.label
                       ?? macro?.selects?.locationIntent?.label
                       ?? "";

  // ---- 2) Info interviews
  if (E >= 3.4 || A >= 3.6 || hasS) {
    const signals: Signal[] = [];
    signals.push({ from: "big5", signal: `E=${E.toFixed(2)} A=${A.toFixed(2)}` });
    if (hasS) signals.push({ from: "riasec", signal: "S high" });

    push(steps, {
      title: "Set up 2 informational interviews",
      why: "Talking to people doing the work yields context you can’t Google.",
      actions: [
        "Message 5 people on LinkedIn across your top cluster(s).",
        "Use a short script: who you are, what you’re exploring, 15 minutes?",
        "Ask about day-to-day, skills that matter, and starter projects.",
      ],
      effort: "medium",
      signals,
    });
  }

  // ---- 3) Ship a micro-project
  if (hasI || O >= 3.5 || C >= 3.5) {
    const signals: Signal[] = [];
    if (hasI) signals.push({ from: "riasec", signal: "I high" });
    signals.push({ from: "big5", signal: `O=${O.toFixed(2)} C=${C.toFixed(2)}` });

    push(steps, {
      title: "Ship a micro-project",
      why: "A 7–10 day artifact proves fit, teaches faster, and boosts confidence.",
      actions: [
        "Pick one role from your shortlist and find a typical task.",
        "Replicate a small deliverable (e.g., 1-pager, dashboard, mockups).",
        "Write 5 bullets on what you learned and what you’d do next.",
      ],
      effort: "medium",
      signals,
    });
  }

  // ---- 4) Probe environment
  {
    const signals: Signal[] = [];
    if (workEnv)        signals.push({ from: "macro", signal: `work_env=${workEnv}` });
    if (locationIntent) signals.push({ from: "macro", signal: `location=${locationIntent}` });

    push(steps, {
      title: "Probe your ideal environment",
      why: "Culture and logistics are make-or-break — test them early.",
      actions: [
        `Shadow or tour a ${workEnv || "target"} team for 1–2 hours (ask to sit in on a stand-up).`,
        `Try a ${locationIntent || "location preference"}-friendly role posting filter and note differences.`,
        "List 3 culture must-haves and 3 deal-breakers you observe.",
      ],
      effort: "low",
      signals,
    });
  }

  // ---- 5) Cluster-specific step
  if (topCluster) {
    const key = topCluster.key as string;
    if (key === "tech_engineering" || key === "data_research") {
      push(steps, {
        title: "Complete a scoped challenge",
        why: "A focused challenge mirrors early job tasks and reveals fit quickly.",
        actions: [
          "Pick a public dataset or small app idea aligned to your role.",
          "Deliver a single feature or analysis in 7 days (timebox to 6–8 hours).",
          "Publish with a short README explaining your decisions.",
        ],
        effort: "medium",
        signals: [{ from: "clusters", signal: key }],
      });
    } else if (key === "design_creative" || key === "media_communications") {
      push(steps, {
        title: "Create a mini-portfolio piece",
        why: "A tangible artifact beats a CV for creative/comm roles.",
        actions: [
          "Redesign a real screen/ad, or produce a content piece for a niche audience.",
          "Show before → after, and write 5 bullets on your rationale.",
          "Share it publicly and ask 2 practitioners for critique.",
        ],
        effort: "medium",
        signals: [{ from: "clusters", signal: key }],
      });
    } else if (key === "education_social" || key === "healthcare_helping") {
      push(steps, {
        title: "Volunteer a ‘trial’ contribution",
        why: "Real-world exposure builds context and network while testing resonance.",
        actions: [
          "Offer 2–3 hours/week support to a local org aligned to your interests.",
          "Ask to assist on a defined task (curriculum snippet, patient intake flow).",
          "Reflect on energy levels and skills used; note what felt meaningful.",
        ],
        effort: "medium",
        signals: [{ from: "clusters", signal: key }],
      });
    } else if (key === "business_leadership" || key === "ops_admin") {
      push(steps, {
        title: "Run a 2-week improvement sprint",
        why: "Process wins demonstrate leverage and leadership potential.",
        actions: [
          "Pick a small workflow (yours or a friend’s/team’s).",
          "Map current → ideal → run one iteration with metrics.",
          "Write a 1-pager: baseline, experiment, result, next step.",
        ],
        effort: "medium",
        signals: [{ from: "clusters", signal: key }],
      });
    } else if (key === "hands_on_trades") {
      push(steps, {
        title: "Shadow a hands-on professional",
        why: "Direct exposure clarifies physical/pace demands better than reading.",
        actions: [
          "Arrange a 2–4h shadowing session (safety permitting).",
          "Ask about apprenticeship paths and certifications.",
          "Note which tasks felt energizing vs. draining.",
        ],
        effort: "low",
        signals: [{ from: "clusters", signal: key }],
      });
    }
  }

  // Ensure minimum list
  if (steps.length < 3) {
    push(steps, {
      title: "Block 90 minutes for deliberate exploration",
      why: "Structured time protects momentum when life gets busy.",
      actions: [
        "Open your calendar and book one 90-minute block this week.",
        "Pick ONE step from this list and complete it in that window.",
        "Write a 5-bullet reflection immediately after.",
      ],
      effort: "low",
      signals: [],
    });
  }

  return {
    steps,
    note: "These are lightweight, high-signal actions. As we add LLM guidance, this section will tailor next steps even more tightly to your profile.",
  };
}