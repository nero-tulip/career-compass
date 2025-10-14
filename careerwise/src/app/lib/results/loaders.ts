/**
 * Thin client-side loaders that reuse your existing drafts API helpers.
 * These are safe to call in client components (or route handlers that forward auth).
 */
import type { User } from "firebase/auth";
import { loadSection } from "@/app/lib/drafts";
import type { Big5Profile, RiasecProfile, IntakeSummary, MacroSummary } from "./types";
import { mapIntake } from "./map-intake";
import { mapMacro } from "./map-macro";

export async function loadIntakeSummary(user: User, rid: string): Promise<IntakeSummary | undefined> {
  const raw = await loadSection(user, rid, "intake");
  return mapIntake(raw);
}

export async function loadMacroSummary(user: User, rid: string): Promise<MacroSummary | undefined> {
  const raw = await loadSection(user, rid, "macro");
  return mapMacro(raw);
}

export async function loadRiasecProfile(user: User, rid: string): Promise<RiasecProfile | undefined> {
  const raw = await loadSection(user, rid, "riasec");
  // Raw is usually an array of {questionId, score} OR a computed profile {R,I,A,S,E,C}
  if (raw && typeof raw === "object" && "R" in raw) {
    return raw as RiasecProfile;
  }
  // fallback: compute averages if needed (optional)
  return undefined;
}

export async function loadBig5Profile(user: User, rid: string): Promise<Big5Profile | undefined> {
  const raw = await loadSection(user, rid, "big5");
  if (raw && typeof raw === "object" && "traits" in raw) {
    return (raw.traits as Big5Profile) ?? undefined;
  }
  if (raw && typeof raw === "object" && "O" in raw) {
    return raw as Big5Profile;
  }
  return undefined;
}