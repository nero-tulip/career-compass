// src/app/types/big5.ts

export type Big5Trait = 'O' | 'C' | 'E' | 'A' | 'N';

export type Big5Item = {
  id: string;          // e.g., "E1", "N2R"
  text: string;
  trait: Big5Trait;    // O C E A N
  reverse: boolean;    // true if reverse-scored
};

export type Big5Answer = {
  itemId: string;      // matches Big5Item.id
  value: number;       // 1..5 (Likert)
};

// Raw + derived scores after scoring
export type Big5Scores = {
  // 20–100 raw sum per trait (each trait has 20 items scored 1..5 with reverse where needed)
  raw: Record<Big5Trait, number>;
  // Mean per trait (1..5)
  mean: Record<Big5Trait, number>;
  // 0..100 scale normalized from raw (20..100 → 0..100)
  pct: Record<Big5Trait, number>;
  // Sanity
  answered: number;    // number of answered items
  total: number;       // total items expected (100)
};