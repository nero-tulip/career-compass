// src/app/lib/results/loaders/load-user-signals.ts

import type { User } from "firebase/auth";
import {
  loadRiasecSummary,
  loadBig5Summary,
  loadMacroSummary,
  loadIntakeSummary,
} from "@/app/lib/results/loaders/client-loaders";
import type { UserSignals, RIASECProfile, Big5Profile } from "@/app/lib/results/types";

export async function loadUserSignals(user: User, rid: string): Promise<UserSignals> {
  const [riasec, big5, macro, intake] = await Promise.all([
    loadRiasecSummary(user, rid).catch(() => undefined),
    loadBig5Summary(user, rid).catch(() => undefined),
    loadMacroSummary(user, rid).catch(() => undefined),
    loadIntakeSummary(user, rid).catch(() => undefined),
  ]);

  // RIASEC: only set if we can fully build the vector
  let riasecVector: RIASECProfile | undefined;
  if (riasec?.scores?.length) {
    const v: RIASECProfile = { R: 0, I: 0, A: 0, S: 0, E: 0, C: 0 };
    for (const s of riasec.scores) {
      if (s.key in v) v[s.key as keyof RIASECProfile] = s.avg;
    }
    const complete = Object.values(v).every((n) => typeof n === "number" && n > 0);
    if (complete) riasecVector = v;
  }

  // Big5: same idea — only set if present
  let big5Vector: Big5Profile | undefined;
  if (big5?.avg) {
    const { O, C, E, A, N } = big5.avg;
    const complete = [O, C, E, A, N].every((n) => typeof n === "number" && n > 0);
    if (complete) big5Vector = { O, C, E, A, N };
  }

  return {
    riasec: riasecVector,
    big5: big5Vector,
    macro,
    intake,
  };
}