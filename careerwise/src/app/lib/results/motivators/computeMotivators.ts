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

export async function computeMotivators(inputs: MotivatorInputs): Promise<Motivator[]> {
  const { big5, riasec, macro } = inputs;

  // Normalize Inputs (0.0 - 1.0)
  const [O, C, Ex, Ag, N] = [nz(big5.O), nz(big5.C), nz(big5.E), nz(big5.A), nz(big5.N)];
  const [R, I, Ar, S, En, Co] = [nz(riasec.R), nz(riasec.I), nz(riasec.A), nz(riasec.S), nz(riasec.E), nz(riasec.C)];

  // Macro Likert Values
  // IDs must match src/app/data/macroQuestions.json
  const mIncome = getLikert("m1", macro);     
  const mSecurity = getLikert("m3", macro);   
  const mLeadership = getLikert("m4", macro); 
  const mImpact = getLikert("m7", macro);     
  const mFlex = getLikert("m8", macro);       

  const out: Motivator[] = [];

  const push = (name: MotivationName, raw: number, rationaleParts: string[]) => {
    // Clamp to 0-1 then convert to %
    const score = Math.round(Math.max(0, Math.min(1, raw)) * 100);
    
    let confidence: "low" | "medium" | "high" = "low";
    if (score > 75) confidence = "high";
    else if (score > 50) confidence = "medium";

    // Combine specific reasons or default if empty
    const rationale = rationaleParts.length > 0
      ? rationaleParts.join(" ")
      : "Based on your overall profile patterns.";

    out.push({
      key: name as unknown as MotivatorKey, 
      label: name,
      score,
      confidence,
      rationale,
      sources: [] 
    });
  };

  /** --- 1. INNOVATION --- **/
  {
    const parts = [];
    if (O > 0.6) parts.push("Your high Openness suggests a strong need for novelty and original ideas.");
    if (I > 0.6 || R > 0.6) parts.push("Your technical interests point to a drive to build or engineer new solutions.");
    if (En > 0.6) parts.push("You show an entrepreneurial streak that favors disrupting the status quo.");
    push("Innovation", (0.4 * O) + (0.3 * En) + (0.3 * Math.max(I, R)), parts);
  }

  /** --- 2. COMPETITION --- **/
  {
    const parts = [];
    if (mIncome > 0.7) parts.push("You explicitly prioritized financial growth, which often aligns with competitive environments.");
    if (En > 0.6) parts.push("Your Enterprising score reflects a drive for achievement and winning market share.");
    if (Ag < 0.4) parts.push("Your independent nature suggests you are comfortable with rivalry and individual metrics.");
    push("Competition", (0.4 * En) + (0.3 * mIncome) + (0.2 * (1 - Ag)) + (0.1 * Ex), parts);
  }

  /** --- 3. COLLABORATION --- **/
  {
    const parts = [];
    if (S > 0.6) parts.push("Your high Social interest means working with others is a primary energizer.");
    if (Ex > 0.6) parts.push("High Extraversion indicates you think best when bouncing ideas off a team.");
    if (Ag > 0.6) parts.push("You value harmony and consensus over working in isolation.");
    push("Collaboration", (0.4 * S) + (0.3 * Ex) + (0.3 * Ag), parts);
  }

  /** --- 4. FINANCIAL REWARD --- **/
  {
    const parts = [];
    if (mIncome > 0.7) parts.push("You marked income as a major priority in your lifestyle preferences.");
    if (En > 0.6) parts.push("This aligns with your Enterprising interest, which correlates with valuing commercial success.");
    push("Financial Reward", (0.6 * mIncome) + (0.4 * En), parts);
  }

  /** --- 5. LEADERSHIP --- **/
  {
    const parts = [];
    if (mLeadership > 0.6) parts.push("You stated a clear preference for stepping into management roles.");
    if (En > 0.6) parts.push("Your Enterprising nature suggests you enjoy persuading and guiding others.");
    if (Ex > 0.6) parts.push("High Extraversion suggests you are comfortable claiming the spotlight.");
    push("Leadership", (0.5 * mLeadership) + (0.3 * En) + (0.2 * Ex), parts);
  }

  /** --- 6. MASTERY --- **/
  {
    const parts = [];
    if (C > 0.6) parts.push("High Conscientiousness points to a desire for doing things thoroughly.");
    if (I > 0.6 || R > 0.6) parts.push("Your technical interests suggest you enjoy deep-diving into complex skills.");
    if (O > 0.6) parts.push("You are intellectually curious, driving you to refine your craft.");
    push("Mastery", (0.4 * C) + (0.4 * Math.max(I, R)) + (0.2 * O), parts);
  }

  /** --- 7. AUTONOMY --- **/
  {
    const parts = [];
    if (mFlex > 0.7) parts.push("You explicitly requested flexibility and control over your schedule.");
    if (O > 0.6) parts.push("High Openness often signals a resistance to rigid micromanagement.");
    if (En > 0.6) parts.push("Your Enterprising side likely prefers setting your own direction.");
    push("Autonomy", (0.5 * mFlex) + (0.3 * O) + (0.2 * En), parts);
  }

  /** --- 8. STABILITY --- **/
  {
    const parts = [];
    if (mSecurity > 0.7) parts.push("You identified job security as a non-negotiable factor.");
    if (Co > 0.6) parts.push("Your Conventional score suggests you thrive in organized, predictable environments.");
    if (C > 0.6) parts.push("You appreciate structure and clear expectations.");
    push("Stability", (0.5 * mSecurity) + (0.3 * Co) + (0.2 * C), parts);
  }

  /** --- 9. IMPACT --- **/
  {
    const parts = [];
    if (mImpact > 0.7) parts.push("You indicated that working on a meaningful mission is critical to you.");
    if (S > 0.6) parts.push("Your Social score reflects a deep motivation to improve the lives of others.");
    push("Impact", (0.5 * mImpact) + (0.3 * S) + (0.2 * En), parts);
  }

  /** --- 10. CREATIVITY --- **/
  {
    const parts = [];
    if (Ar > 0.6) parts.push("Your Artistic score is a strong signal that self-expression is a core need.");
    if (O > 0.6) parts.push("High Openness suggests a constant flow of new ideas and a dislike for routine.");
    push("Creativity", (0.6 * Ar) + (0.4 * O), parts);
  }

  /** --- 11. RECOGNITION --- **/
  {
    const parts = [];
    if (Ex > 0.6) parts.push("Your high Extraversion suggests you appreciate visibility and public acknowledgement.");
    if (En > 0.6) parts.push("You likely value status and external validation of your achievements.");
    if (mLeadership > 0.6) parts.push("Your desire for leadership often comes with a need for recognition.");
    push("Recognition", (0.4 * Ex) + (0.3 * En) + (0.3 * mLeadership), parts);
  }

  /** --- 12. LEARNING/GROWTH --- **/
  {
    const parts = [];
    if (O > 0.6) parts.push("Your Openness drives a constant need for new information and experiences.");
    if (I > 0.6) parts.push("Your Investigative score highlights a love of research and knowledge gathering.");
    if (C > 0.6) parts.push("You likely approach your career with a mindset of continuous improvement.");
    push("Learning/Growth", (0.4 * O) + (0.3 * I) + (0.3 * C), parts);
  }

  /** --- 13. VARIETY/CHALLENGE --- **/
  {
    const parts = [];
    if (O > 0.6) parts.push("You crave novelty and may find repetitive tasks draining.");
    if (En > 0.6) parts.push("You are drawn to ambitious challenges rather than maintenance work.");
    if (Co < 0.4) parts.push("Your low Conventional score suggests a dislike for strict routine.");
    push("Variety/Challenge", (0.5 * O) + (0.3 * En) + (0.2 * (1 - Co)), parts);
  }

  /** --- 14. STRUCTURE/CLARITY --- **/
  {
    const parts = [];
    if (Co > 0.6) parts.push("You excel when there are clear rules, data, and processes to follow.");
    if (C > 0.6) parts.push("Your high Conscientiousness means you value organization and definition.");
    if (O < 0.4) parts.push("You generally prefer proven methods over ambiguity.");
    push("Structure/Clarity", (0.5 * Co) + (0.3 * C) + (0.2 * (1 - O)), parts);
  }

  /** --- 15. WORK-LIFE HARMONY --- **/
  {
    const parts = [];
    if (mFlex > 0.7) parts.push("You explicitly prioritized a flexible lifestyle.");
    if (En < 0.5) parts.push("You seem less driven by aggressive career climbing, making space for personal life.");
    if (Ag > 0.6) parts.push("Your Agreeableness suggests you value peace of mind and relationships over the grind.");
    push("Work–Life Harmony", (0.4 * (1 - En)) + (0.3 * mFlex) + (0.3 * Ag), parts);
  }

  /** --- 16. PURPOSE/MISSION --- **/
  {
    const parts = [];
    if (mImpact > 0.7) parts.push("You have a strong desire for your work to contribute to a larger cause.");
    if (S > 0.6) parts.push("Your Social orientation drives you to serve others.");
    if (O > 0.6) parts.push("You are likely idealistic, wanting your career to reflect your personal values.");
    push("Purpose/Mission", (0.4 * mImpact) + (0.3 * S) + (0.3 * O), parts);
  }

  /** --- 17. PRESTIGE/STATUS --- **/
  {
    const parts = [];
    if (En > 0.6) parts.push("Your Enterprising score suggests you value reputation and influence.");
    if (mIncome > 0.7) parts.push("You prioritize the tangible markers of success.");
    if (mLeadership > 0.6) parts.push("You are drawn to roles that command respect.");
    push("Prestige/Status", (0.4 * En) + (0.3 * mIncome) + (0.3 * mLeadership), parts);
  }

  /** --- 18. RISK-TAKING --- **/
  {
    const parts = [];
    if (En > 0.6) parts.push("You are comfortable making high-stakes decisions to get results.");
    if (O > 0.6) parts.push("Your Openness makes you willing to try unproven paths.");
    if (C < 0.5) parts.push("You are likely less risk-averse than the average person.");
    push("Risk-Taking", (0.4 * En) + (0.4 * O) + (0.2 * (1 - C)), parts);
  }

  /** --- 19. BELONGING --- **/
  {
    const parts = [];
    if (S > 0.6) parts.push("You deeply value connection and being part of a 'tribe' at work.");
    if (Ag > 0.6) parts.push("Psychological safety and group acceptance are critical for you.");
    if (mImpact > 0.5) parts.push("You want to feel connected to the people you are helping.");
    push("Belonging", (0.5 * S) + (0.3 * Ag) + (0.2 * mImpact), parts);
  }

  /** --- 20. SUPPORT/MENTORSHIP --- **/
  {
    const parts = [];
    if (S > 0.6) parts.push("Your primary motivation involves helping others grow and succeed.");
    if (Ag > 0.6) parts.push("Your supportive nature makes you a natural mentor.");
    if (mLeadership > 0.5) parts.push("You view leadership as a way to serve your team.");
    push("Support/Mentorship", (0.5 * S) + (0.3 * Ag) + (0.2 * mLeadership), parts);
  }

  return out.sort((a, b) => (b.score ?? 0) - (a.score ?? 0));
}