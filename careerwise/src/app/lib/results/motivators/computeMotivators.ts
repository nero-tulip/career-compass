// src/app/lib/results/generators/compute-motivators.ts
import type { Motivator, MotivatorKey } from "@/app/lib/results/types";

export type MotivatorInputs = {
  big5: { O: number; C: number; E: number; A: number; N: number };
  riasec: { R: number; I: number; A: number; S: number; E: number; C: number };
  intakeText?: string;
};

const nz = (v: number) => Math.max(0, Math.min(1, (v - 1) / 4));
const has = (txt: string | undefined, ...phrases: string[]) =>
  !!txt && phrases.some((p) => txt.toLowerCase().includes(p.toLowerCase()));

function conf(score: number, nSignals: number): Motivator["confidence"] {
  if (score >= 65 && nSignals >= 3) return "high";
  if (score >= 45 && nSignals >= 2) return "medium";
  return "low";
}

function buildRationale(m: Motivator) {
  const mentioned = m.sources.some((s) => s.from === "intake");
  return `Signals suggest ${m.label.toLowerCase()} matters to you${
    mentioned ? " — you mentioned it in your answers." : "."
  }`;
}

export async function computeMotivators(
  inputs: MotivatorInputs
): Promise<Motivator[]> {
  // Big Five (normalized 0..1 from 1..5)
  const O = nz(inputs.big5.O);
  const C = nz(inputs.big5.C);
  const Ex = nz(inputs.big5.E);
  const Ag = nz(inputs.big5.A);
  const N  = nz(inputs.big5.N);

  // RIASEC (normalized 0..1 from 1..5)
  const R  = nz(inputs.riasec.R);
  const I  = nz(inputs.riasec.I);
  const Ar = nz(inputs.riasec.A);
  const S  = nz(inputs.riasec.S);
  const En = nz(inputs.riasec.E);
  const Co = nz(inputs.riasec.C);

  const t = inputs.intakeText || "";

  const out: Motivator[] = [];

  // helper to add one motivator
  const push = (
    key: MotivatorKey,
    label: string,
    raw: number,
    srcs: Motivator["sources"]
  ) => {
    const score = Math.round(Math.max(0, Math.min(1, raw)) * 100);
    out.push({
      key,
      label,
      score,
      confidence: conf(score, srcs.length),
      rationale: "", // filled after all pushes
      sources: srcs,
    });
  };

  // --- Autonomy ---
  {
    const raw =
      0.35 * O +
      0.25 * En -
      0.15 * C +
      (has(t, "autonomy", "freedom", "ownership", "remote", "flexible") ? 0.2 : 0);

    const src: Motivator["sources"] = [
      { from: "big5",  signal: `Openness ${O.toFixed(2)}` },
      { from: "riasec", signal: `Enterprising ${En.toFixed(2)}` },
    ];
    if (has(t, "autonomy", "freedom", "ownership", "remote", "flexible")) {
      src.push({ from: "intake", signal: "mentions autonomy/flexibility" });
    }
    push("autonomy", "Autonomy", raw, src);
  }

  // --- Mastery ---
  {
    const tech = Math.max(I, R);
    const raw =
      0.35 * C +
      0.30 * tech +
      0.15 * O +
      (has(t, "learning", "mastery", "craft", "improve") ? 0.2 : 0);

    const src: Motivator["sources"] = [
      { from: "big5",  signal: `Conscientiousness ${C.toFixed(2)}` },
      { from: "riasec", signal: `I/R blend ${tech.toFixed(2)}` },
    ];
    if (has(t, "learning", "mastery", "craft", "improve")) {
      src.push({ from: "intake", signal: "mentions learning/growth" });
    }
    push("mastery", "Mastery", raw, src);
  }

  // --- Impact ---
  {
    const raw =
      0.35 * S +
      0.20 * Ag +
      0.20 * En +
      (has(t, "impact", "mission", "help people", "community") ? 0.25 : 0);

    const src: Motivator["sources"] = [
      { from: "riasec", signal: `Social ${S.toFixed(2)}` },
      { from: "big5",  signal: `Agreeableness ${Ag.toFixed(2)}` },
    ];
    if (has(t, "impact", "mission", "help people", "community")) {
      src.push({ from: "intake", signal: "mentions impact/mission" });
    }
    push("impact", "Impact", raw, src);
  }

  // --- Creativity ---
  {
    const raw =
      0.40 * O +
      0.30 * Ar +
      0.10 * Ex +
      (has(t, "design", "create", "art", "novel") ? 0.2 : 0);

    const src: Motivator["sources"] = [
      { from: "big5",  signal: `Openness ${O.toFixed(2)}` },
      { from: "riasec", signal: `Artistic ${Ar.toFixed(2)}` },
    ];
    if (has(t, "design", "create", "art", "novel")) {
      src.push({ from: "intake", signal: "mentions creative work" });
    }
    push("creativity", "Creativity", raw, src);
  }

  // --- Recognition ---
  {
    const raw =
      0.35 * Ex +
      0.25 * En +
      0.15 * C +
      (has(t, "promotion", "recognition", "awards", "visibility") ? 0.25 : 0);

    const src: Motivator["sources"] = [
      { from: "big5",  signal: `Extraversion ${Ex.toFixed(2)}` },
      { from: "riasec", signal: `Enterprising ${En.toFixed(2)}` },
    ];
    if (has(t, "promotion", "recognition", "awards", "visibility")) {
      src.push({ from: "intake", signal: "mentions recognition/status" });
    }
    push("recognition", "Recognition", raw, src);
  }

  // --- Stability ---
  {
    const raw =
      0.35 * C -
      0.25 * O +
      0.25 * Co +
      (has(t, "security", "predictable", "stability") ? 0.2 : 0) +
      (N > 0.7 ? 0.05 : 0);

    const src: Motivator["sources"] = [
      { from: "big5",  signal: `Conscientiousness ${C.toFixed(2)}` },
      { from: "riasec", signal: `Conventional ${Co.toFixed(2)}` },
    ];
    if (has(t, "security", "predictable", "stability")) {
      src.push({ from: "intake", signal: "mentions stability/security" });
    }
    push("stability", "Stability", raw, src);
  }

  // --- Belonging (new) ---
  {
    const raw =
      0.35 * Ag +
      0.25 * S +
      (has(t, "team", "supportive", "collaborative", "culture") ? 0.25 : 0);

    const src: Motivator["sources"] = [
      { from: "big5",  signal: `Agreeableness ${Ag.toFixed(2)}` },
      { from: "riasec", signal: `Social ${S.toFixed(2)}` },
    ];
    if (has(t, "team", "supportive", "collaborative", "culture")) {
      src.push({ from: "intake", signal: "mentions belonging/team" });
    }
    push("belonging", "Belonging", raw, src);
  }

  // fill rationales
  for (const m of out) m.rationale = buildRationale(m);

  // sort by score (desc)
  return out.sort((a, b) => (b.score ?? 0) - (a.score ?? 0));
}