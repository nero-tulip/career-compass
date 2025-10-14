import type { MacroChips, MacroLikert, MacroSelect, MacroSummary, MacroTextarea } from "./types";
import macroQuestions from "@/app/data/macroQuestions.json";

/**
 * Your macro section stores a heterogeneous answer array.
 * We normalize it into { likert, selects, chips, textareas } keyed by id.
 */

type MacroQuestion = {
  id: string;
  text: string;
  type?: "likert" | "select" | "chips" | "textarea" | "country-multi";
  scale?: string[];
  options?: Array<{ value: string; label: string }>;
};

const QUESTION_INDEX: Record<string, MacroQuestion> = Object.fromEntries(
  (macroQuestions as MacroQuestion[]).map((q) => [q.id, { ...q, type: q.type ?? (Array.isArray(q.scale) ? "likert" : "select") }])
);

export type MacroAnswer =
  | { questionId: string; type: "likert"; score: number }
  | { questionId: string; type: "select"; value: string }
  | { questionId: string; type: "chips"; value: string[] }
  | { questionId: string; type: "textarea"; value: string }
  | { questionId: string; type: "country-multi"; value: string[] };

export function mapMacro(raw: any): MacroSummary | undefined {
  if (!raw) return undefined;

  const answers: MacroAnswer[] = Array.isArray(raw) ? raw : [];

  const likert: Record<string, MacroLikert> = {};
  const selects: Record<string, MacroSelect> = {};
  const chips: Record<string, MacroChips> = {};
  const textareas: Record<string, MacroTextarea> = {};

  for (const a of answers) {
    const q = QUESTION_INDEX[a.questionId];
    if (!q) continue;

    if ((a as any).type === "likert") {
      const score = Number((a as any).score) || 0;
      const scale = q.scale ?? ["1", "2", "3", "4", "5"];
      const choiceIdx = Math.max(1, Math.min(scale.length, score));
      likert[q.id] = {
        id: q.id,
        prompt: q.text,
        score,
        choiceLabel: scale[choiceIdx - 1],
        scale,
      };
      continue;
    }

    if ((a as any).type === "select") {
      const value = String((a as any).value ?? "");
      const label = q.options?.find((o) => o.value === value)?.label ?? value;
      selects[q.id] = { id: q.id, prompt: q.text, value, label };
      continue;
    }

    if ((a as any).type === "chips") {
      const values = Array.isArray((a as any).value) ? (a as any).value : [];
      const labels = values.map(
        (v: string) => q.options?.find((o) => o.value === v)?.label ?? v
      );
      chips[q.id] = { id: q.id, prompt: q.text, values, labels };
      continue;
    }

    if ((a as any).type === "textarea") {
      const text = String((a as any).value ?? "");
      textareas[q.id] = { id: q.id, prompt: q.text, text };
      continue;
    }

    // ignore country-multi here (belongs to intake UX)
  }

  return { likert, selects, chips, textareas };
}