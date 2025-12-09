import type { Motivator, MotivatorKey, MacroSummary } from "@/app/lib/results/types";
import type { MotivationName } from "@/app/lib/results/values-taxonomy";

export type MotivatorInputs = {
  big5: { O: number; C: number; E: number; A: number; N: number };
  riasec: { R: number; I: number; A: number; S: number; E: number; C: number };
  intakeText?: string;
  macro?: MacroSummary;
};

// Normalize 1-5 scale to 0-1
const nz = (v: number) => Math.max(0, Math.min(1, (v - 1) / 4));

// Safe accessor for Macro Likert scores
const getLikert = (id: string, macro?: MacroSummary): number => {
  const score = macro?.likert?.[id]?.score;
  return score ? nz(score) : 0; 
};

// Simple text search helper
const has = (txt: string | undefined, ...phrases: string[]) =>
  !!txt && phrases.some((p) => txt.toLowerCase().includes(p.toLowerCase()));

export async function computeMotivators(inputs: MotivatorInputs): Promise<Motivator[]> {
  const { big5, riasec, intakeText: t, macro } = inputs;

  // Normalize Inputs (0.0 - 1.0)
  const [O, C, Ex, Ag, N] = [nz(big5.O), nz(big5.C), nz(big5.E), nz(big5.A), nz(big5.N)];
  const [R, I, Ar, S, En, Co] = [nz(riasec.R), nz(riasec.I), nz(riasec.A), nz(riasec.S), nz(riasec.E), nz(riasec.C)];

  // Extract Macro Likert Values
  // NOTE: Verify these IDs match your src/app/data/macroQuestions.json IDs!
  const mIncome = getLikert("m1", macro);     
  const mSecurity = getLikert("m3", macro);   
  const mLeadership = getLikert("m4", macro); 
  const mImpact = getLikert("m7", macro);     
  const mFlex = getLikert("m8", macro);       

  const out: Motivator[] = [];

  const push = (name: MotivationName, raw: number, rationale: string) => {
    const score = Math.round(Math.max(0, Math.min(1, raw)) * 100);
    
    let confidence: "low" | "medium" | "high" = "low";
    if (score > 75) confidence = "high";
    else if (score > 50) confidence = "medium";

    out.push({
      key: name as unknown as MotivatorKey, 
      label: name,
      score,
      confidence,
      rationale, // Deterministic rationale
      sources: [] 
    });
  };

  /** --- CALCULATIONS --- **/

  // 1. INNOVATION
  push("Innovation", 
    (0.4 * O) + (0.3 * En) + (0.3 * Math.max(I, R)),
    "Driven by openness to new ideas and enterprising energy."
  );

  // 2. COMPETITION
  push("Competition",
    (0.4 * En) + (0.3 * mIncome) + (0.2 * (1 - Ag)) + (0.1 * Ex),
    "Driven by commercial goals and a desire to win."
  );

  // 3. COLLABORATION
  push("Collaboration",
    (0.4 * S) + (0.3 * Ex) + (0.3 * Ag),
    "Prefers teamwork and social interaction over isolation."
  );

  // 4. FINANCIAL REWARD
  push("Financial Reward",
    (0.6 * mIncome) + (0.4 * En),
    "Explicitly values income potential and financial growth."
  );

  // 5. LEADERSHIP
  push("Leadership",
    (0.5 * mLeadership) + (0.3 * En) + (0.2 * Ex),
    "Comfortable taking charge and guiding others."
  );

  // 6. MASTERY
  push("Mastery",
    (0.4 * C) + (0.4 * Math.max(I, R)) + (0.2 * O),
    "Focuses on craft, detail, and technical competence."
  );

  // 7. AUTONOMY
  push("Autonomy",
    (0.5 * mFlex) + (0.3 * O) + (0.2 * En),
    "Values freedom, flexibility, and independence."
  );

  // 8. STABILITY
  push("Stability",
    (0.5 * mSecurity) + (0.3 * Co) + (0.2 * C),
    "Prefers secure, predictable, and structured environments."
  );

  // 9. IMPACT
  push("Impact",
    (0.5 * mImpact) + (0.3 * S) + (0.2 * En),
    "Motivated by making a difference for others."
  );
  
  // 10. CREATIVITY
  push("Creativity",
    (0.6 * Ar) + (0.4 * O),
    "Strong artistic interests and imagination."
  );

  // 11. RECOGNITION (Fallback calculation if not covered by Fin/Comp)
  push("Recognition",
    (0.4 * Ex) + (0.3 * En) + (0.3 * mLeadership),
    "Motivated by visibility and public acknowledgement."
  );
  
  // 12. LEARNING/GROWTH
  push("Learning/Growth",
    (0.4 * O) + (0.3 * I) + (0.3 * C),
    "Driven by curiosity and continuous improvement."
  );

  // 13. VARIETY/CHALLENGE
  push("Variety/Challenge",
    (0.5 * O) + (0.3 * En) + (0.2 * (1 - Co)),
    "Prefers novelty and change over routine."
  );

  // 14. STRUCTURE/CLARITY
  push("Structure/Clarity",
    (0.5 * Co) + (0.3 * C) + (0.2 * (1 - O)),
    "Prefers clear rules and well-defined processes."
  );
  
  // 15. WORK-LIFE HARMONY
  // Often correlates with lower Ambition (En) and higher Agreeableness/Stability
  push("Work–Life Harmony",
    (0.4 * (1 - En)) + (0.3 * mFlex) + (0.3 * Ag),
    "Prioritizes balance and personal time over career climbing."
  );

  // 16. PURPOSE/MISSION
  push("Purpose/Mission",
    (0.4 * mImpact) + (0.3 * S) + (0.3 * O),
    "Driven by a cause greater than the self."
  );
  
  // 17. PRESTIGE/STATUS
  push("Prestige/Status",
    (0.4 * En) + (0.3 * mIncome) + (0.3 * mLeadership),
    "Values reputation and social standing."
  );

  // 18. RISK-TAKING
  push("Risk-Taking",
     (0.4 * En) + (0.4 * O) + (0.2 * (1 - C)),
     "Comfortable with uncertainty and high stakes."
  );
  
  // 19. BELONGING
  push("Belonging",
     (0.5 * S) + (0.3 * Ag) + (0.2 * mImpact),
     "Values being part of a supportive community."
  );

  // 20. SUPPORT/MENTORSHIP
  push("Support/Mentorship",
      (0.5 * S) + (0.3 * Ag) + (0.2 * mLeadership),
      "Motivated by helping others develop."
  );

  return out.sort((a, b) => (b.score ?? 0) - (a.score ?? 0));
}