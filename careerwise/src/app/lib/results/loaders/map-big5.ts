// src/app/lib/results/loaders/map-big5.ts
import type { User } from "firebase/auth";
import { loadSection } from "@/app/lib/drafts";
import { scoreBig5 } from "@/app/lib/big5";
import type { Big5Trait } from "@/app/types/big5";

// Your Big-5 item bank with { id, text, trait, reverse }
import questions from "@/app/data/big5Questions.json";

export type Big5Key = Big5Trait; // "O" | "C" | "E" | "A" | "N"

export type Big5Summary = {
  avg: Record<Big5Key, number>;   // Mean (1–5)
  sum: Record<Big5Key, number>;   // Raw sum
  count: Record<Big5Key, number>; // #answered per trait
  scores: Array<{ key: Big5Key; avg: number; sum: number; count: number }>;
  top3: Big5Key[];
};

export async function loadBig5Summary(user: User, rid: string): Promise<Big5Summary> {
  const raw = await loadSection(user, rid, "big5");
  if (!Array.isArray(raw)) throw new Error("Invalid or missing Big-5 data");

  // Normalize saved answers
  const answers = raw
    .map((a: any) => ({
      itemId: String(a?.questionId ?? a?.itemId ?? ""),
      value: Number(a?.score ?? a?.value ?? 0),
    }))
    .filter((a: any) => a.itemId && a.value);

  // Use official scorer (handles reverse-scored items correctly)
  const scored = scoreBig5(questions.items as unknown as any[], answers);

  // Count #answered items per trait
  const itemTrait = new Map<string, Big5Key>();
  for (const it of questions.items as unknown as any[]) {
    itemTrait.set(String(it.id), it.trait as Big5Key);
  }

  const count: Record<Big5Key, number> = { O: 0, C: 0, E: 0, A: 0, N: 0 };
  for (const a of answers) {
    const t = itemTrait.get(a.itemId);
    if (t) count[t] += 1;
  }

  // Build summary
  const avg = scored.mean as Record<Big5Key, number>;
  const sum = scored.raw as Record<Big5Key, number>;

  const scores = (Object.keys(avg) as Big5Key[]).map((k) => ({
    key: k,
    avg: avg[k],
    sum: sum[k],
    count: count[k],
  }));

  const top3 = [...scores].sort((a, b) => b.avg - a.avg).slice(0, 3).map((s) => s.key);

  return { avg, sum, count, scores, top3 };
}