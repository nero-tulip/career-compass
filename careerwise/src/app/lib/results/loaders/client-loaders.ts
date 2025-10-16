import type { User } from "firebase/auth";
import { loadSection } from "@/app/lib/drafts";

import { mapIntake } from "../map-intake";
import { mapMacro } from "../map-macro";
import { loadRiasecSummary } from "./map-riasec";
import { loadBig5Summary } from "./map-big5";

import type { IntakeSummary, MacroSummary } from "../types";

/** Thin client-side loader wrappers so pages/generators can stay clean. */
export async function loadIntakeSummary(
  user: User,
  rid: string
): Promise<IntakeSummary | undefined> {
  const raw = await loadSection(user, rid, "intake");
  return mapIntake(raw);
}

export async function loadMacroSummary(
  user: User,
  rid: string
): Promise<MacroSummary | undefined> {
  const raw = await loadSection(user, rid, "macro");
  return mapMacro(raw);
}

/** Re-export these so callers can import from one place if they want. */
export { loadRiasecSummary, loadBig5Summary };