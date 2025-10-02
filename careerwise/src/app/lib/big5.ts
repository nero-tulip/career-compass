// src/app/lib/big5.ts
import type { Big5Item, Big5Answer, Big5Scores, Big5Trait } from '@/app/types/big5';

/**
 * Score IPIP-100.
 * - Reverse-scored items are mapped: value' = 6 - value
 * - raw: sum of 20 items per trait → range 20..100
 * - mean: raw / 20 → range 1..5
 * - pct: (raw - 20) / 80 * 100 → range 0..100
 */
export function scoreBig5(items: Big5Item[], answers: Big5Answer[]): Big5Scores {
  const traits: Big5Trait[] = ['O', 'C', 'E', 'A', 'N'];
  const perTraitCount: Record<Big5Trait, number> = { O: 0, C: 0, E: 0, A: 0, N: 0 };
  const raw: Record<Big5Trait, number> = { O: 0, C: 0, E: 0, A: 0, N: 0 };

  // Build a quick map of answers for O(1) lookup
  const amap = new Map(answers.map(a => [a.itemId, a.value]));

  let answered = 0;
  for (const it of items) {
    const v = amap.get(it.id);
    if (!v) continue;
    answered += 1;

    const val = clampLikert(it.reverse ? 6 - v : v);
    raw[it.trait] += val;
    perTraitCount[it.trait] += 1;
  }

  const mean = { O: 0, C: 0, E: 0, A: 0, N: 0 } as Record<Big5Trait, number>;
  const pct  = { O: 0, C: 0, E: 0, A: 0, N: 0 } as Record<Big5Trait, number>;

  for (const t of traits) {
    const n = perTraitCount[t] || 1; // avoid div/0 if partially answered
    const r = raw[t];
    mean[t] = r / n;
    // Normalize to 0..100 using full-scale 20 items (if partially answered, this is rough)
    pct[t] = Math.max(0, Math.min(100, ((r - 20) / 80) * 100));
  }

  return {
    raw,
    mean,
    pct,
    answered,
    total: items.length,
  };
}

function clampLikert(n: number) {
  if (n < 1) return 1;
  if (n > 5) return 5;
  return n;
}