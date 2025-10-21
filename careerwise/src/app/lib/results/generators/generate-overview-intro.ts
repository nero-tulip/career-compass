import type { IntakeSummary } from "@/app/lib/results/types";

/**
 * Builds a warm, natural paragraph summarizing the user's intake answers.
 * Adapts phrasing dynamically based on context (student, professional, etc.).
 */
export type OverviewIntro = { text: string; meta?: { name?: string } };

export function generateOverviewIntro(intake: IntakeSummary): OverviewIntro {
  const name = intake.name?.trim() || "there";
  const age = intake.ageBand ? `${intake.ageBand}-year-old` : "";
  const country = intake.country?.label ?? "";
  const edu = intake.educationLevel?.label ?? "";
  const statusLabels = intake.status?.map((s) => s.label) ?? [];
  const stage = intake.stageOfCareer?.label ?? "";
  const goals = intake.goals?.map((g) => g.label.toLowerCase()) ?? [];

  // --- Contextual logic ---
  const isStudent =
    statusLabels.some((s) =>
      ["High school student", "College / University student"].includes(s)
    ) || stage.includes("college");

  const isProfessional =
    statusLabels.some((s) =>
      ["Working full-time", "Self-employed / Freelancer"].includes(s)
    ) || stage.includes("career");

  const isJobSeeker = statusLabels.includes("Unemployed / Looking");

  // --- Dynamic phrases ---
  const introLine = `Hi ${name},`;
  const greetLine = "It’s been fun getting to know you!";

  // Profile summary
  let profileLine = "";
  if (isStudent) {
    profileLine = `You’re a ${age || ""}${country ? ` living in ${country}` : ""}${
      edu ? ` and currently studying at the ${edu.toLowerCase()}` : ""
    }${statusLabels.length ? `, ${statusLabels.join(", ").toLowerCase()}` : ""}.`;
  } else if (isProfessional) {
    profileLine = `You’re a ${age || ""}${country ? ` living in ${country}` : ""}${
      edu ? ` with a background in ${edu.toLowerCase()}` : ""
    } and currently ${statusLabels.join(", ").toLowerCase()}.`;
  } else if (isJobSeeker) {
    profileLine = `You’re a ${age || ""}${country ? ` living in ${country}` : ""}${
      edu ? ` and you’ve completed ${edu}` : ""
    }, currently exploring your next step.`;
  } else {
    profileLine = `You’re a ${age || ""}${country ? ` living in ${country}` : ""}${
      edu ? ` and you’ve completed ${edu}` : ""
    }.`;
  }

  // Stage-of-career line
  let stageLine = "";
  if (stage) {
    if (stage.includes("college")) {
      stageLine = "You’re about to make one of your first big career choices.";
    } else if (stage.includes("change")) {
      stageLine = "You’re at a turning point, exploring a new direction for your career.";
    } else if (stage.includes("growth")) {
      stageLine = "You’re focused on growing within your current career path.";
    } else if (stage.includes("entrepreneur")) {
      stageLine = "You’ve got an entrepreneurial spark driving you forward.";
    } else {
      stageLine = `You’re currently ${stage.toLowerCase()}.`;
    }
  }

  // Goals / motivation
  let goalLine = "";
  if (goals.length) {
    const formattedGoals =
      goals.length === 1
        ? goals[0]
        : goals.length === 2
        ? goals.join(" and ")
        : goals.slice(0, -1).join(", ") + ", and " + goals.slice(-1);
    goalLine = `You’re using CareerCompass to ${formattedGoals}.`;
  } else {
    goalLine = "You’re using CareerCompass to learn more about yourself and your opportunities.";
  }

  // Closing
  const closing = "Does that sound about right?";

  const text = [introLine, "", greetLine, "", profileLine, stageLine, goalLine, "", closing]
    .filter(Boolean)
    .join("\n");

  return { text, meta: { name } };
}