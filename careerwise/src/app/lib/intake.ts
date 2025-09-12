import { IntakeAnswers } from "@/app/types/intake";

export function summarizeIntake(intake: IntakeAnswers): string {
  const name = (intake["name"] as string) || "there";
  const age = intake["age_band"] as string | undefined;
  const country = intake["country"] as string | undefined;
  const status = intake["status"] as string[] | undefined;
  const creative = intake["creative_analytical"] as number | undefined;
  const travel = intake["travel_appetite"] as string | undefined;
  const where = intake["where_to_work"] as string | undefined;
  const preferred = (intake["preferred_countries"] as { code: string; name: string }[] | undefined)
    ?.map(c => c.name)
    .join(", ");

  const parts: string[] = [];
  parts.push(`User name: ${name}`);
  if (age) parts.push(`Age band: ${age}`);
  if (country) parts.push(`Country: ${country}`);
  if (status?.length) parts.push(`Status: ${status.join(" + ")}`);
  if (typeof creative === "number") parts.push(`Creative→Analytical: ${creative}/100`);
  if (travel) parts.push(`Travel appetite: ${travel}`);
  if (where) parts.push(`Work location intent: ${where}`);
  if (preferred) parts.push(`Preferred countries: ${preferred}`);

  const dream = (intake["dream_job"] as string | undefined)?.trim();
  if (dream) parts.push(`Dream job note: ${dream}`);

  return parts.join(" | ");
}
