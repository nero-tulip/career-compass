
import macroQuestions from "@/app/data/macroQuestions.json";

export function interpretMacroAnswer(questionId: string, score: number | undefined): string | null {
  if (score === undefined || score === null) return null;
  
  const q = macroQuestions.find((mq) => mq.id === questionId);
  if (!q || !q.scale || !Array.isArray(q.scale)) return null;

  // Likert scale is 1-based index into scale array?
  // Usually score 1 = scale[0], score 5 = scale[4]
  const idx = Math.max(0, Math.min(score - 1, q.scale.length - 1));
  const label = q.scale[idx];

  return `${q.text}: ${label} (Score: ${score})`;
}
