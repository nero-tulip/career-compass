import type { RIASECProfile } from '../types/career';
import careersData from '../data/careers.json';

interface Career {
  code: string;
  title: string;
  riasec: RIASECProfile;
}

export function findMatchingCareers(profile: RIASECProfile, limit: number = 3): Career[] {
  // Calculate similarity score for each career
  const scoredCareers = careersData.map(career => {
    const score = calculateSimilarityScore(profile, career.riasec);
    return { career, score };
  });

  // Sort by similarity score and return top matches
  return scoredCareers
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(({ career }) => career);
}

function calculateSimilarityScore(profile: RIASECProfile, careerProfile: RIASECProfile): number {
  // Calculate Euclidean distance between profiles
  const differences = Object.keys(profile).map(key => {
    const k = key as keyof RIASECProfile;
    return Math.pow(profile[k] - careerProfile[k], 2);
  });
  
  const distance = Math.sqrt(differences.reduce((a, b) => a + b, 0));
  
  // Convert distance to similarity score (0 to 1)
  return 1 / (1 + distance);
}

export function prepareCareerAnalysisPrompt(
  profile: RIASECProfile,
  macroSummary?: string
): string {
  return `
  When communicating with the user, please use a tone that's conversational, 
  engaging, wise, intelligent and understanding. 

  Based on the following RIASEC profile, provide a detailed, insightful analysis:

RIASEC Profile:
- Realistic: ${profile.R.toFixed(2)}
- Investigative: ${profile.I.toFixed(2)}
- Artistic: ${profile.A.toFixed(2)}
- Social: ${profile.S.toFixed(2)}
- Enterprising: ${profile.E.toFixed(2)}
- Conventional: ${profile.C.toFixed(2)}

${macroSummary ? `Additional user context:\n${macroSummary}\n` : ''}
Please provide:
1. A personality analysis based on the RIASEC profile and macro preferences, 
explaining what the user's dominant traits mean in a career context
2. The types of work environments, roles, or activities that might suit someone 
with this profile (without naming specific careers)
3. General strengths and potential challenges for this profile
4. Suggestions for personal and professional growth based on the RIASEC results

Format the response in a clear, engaging way that's easy to understand and act upon.`;
} 

// Detailed, nuanced mapping from macro answers to interpretive sentences
const macroInterpretations: Record<string, string[]> = {
  m1: [
    // Income importance
    "The user places little to no importance on earning a high income, prioritizing happiness and fulfillment over financial gain.",
    "The user sees income as a nice bonus, but not a central focus in their career decisions.",
    "The user values financial comfort, aiming for a stable and sufficient income without seeking extravagance.",
    "The user considers earning a high income to be an important long-term goal, factoring it significantly into their career planning.",
    "The user is highly motivated by financial success, viewing the pursuit of a high income as a major driving force in their career."
  ],
  m2: [
    // Entrepreneurial drive
    "The user strongly prefers stability and predictability in their work, showing little interest in entrepreneurship or running a business.",
    "The user is open to entrepreneurship only if necessary, but generally prefers more secure and structured roles.",
    "The user is cautiously open to entrepreneurship, willing to consider it if the timing and idea are right.",
    "The user is enthusiastic about the idea of starting or running a business at some point, seeing it as an appealing opportunity.",
    "The user is deeply entrepreneurial, aspiring to start or run their own business as a core career ambition."
  ],
  m3: [
    // Job security
    "Job security is the user's top priority; they need to feel safe and stable in their work environment.",
    "The user values job security highly, but is willing to tolerate some risk for the right opportunity.",
    "The user seeks a balance between security and purpose, wanting both stability and meaningful work.",
    "The user is willing to trade some job security for greater meaning or freedom in their career.",
    "The user is comfortable with uncertainty and risk, prioritizing other factors over job security."
  ],
  m4: [
    // Leadership
    "The user prefers to follow directions and does not enjoy taking on leadership roles.",
    "The user will lead only when necessary, but does not actively seek out leadership opportunities.",
    "The user is comfortable stepping up to lead occasionally, but does not require it to feel fulfilled.",
    "The user enjoys leading others when the opportunity arises, finding satisfaction in guiding teams or projects.",
    "The user thrives in leadership roles, feeling most energized and effective when in charge."
  ],
  m5: [
    // Prestige
    "Professional status or prestige is unimportant to the user; titles and image do not influence their career choices.",
    "The user does not focus on prestige, but appreciates recognition when it comes.",
    "The user values being respected and likes the idea of earning professional recognition.",
    "The user is motivated by accomplishment and admiration, seeking to feel accomplished and admired in their field.",
    "The user is highly driven by prestige and professional status, actively pursuing recognition and high standing."
  ],
  m6: [
    // Social interaction
    "The user prefers minimal social interaction at work, thriving in independent or solitary roles.",
    "The user is comfortable with limited social interaction, preferring to work alone most of the time.",
    "The user seeks a balanced mix of solo and social work, enjoying both independent and collaborative tasks.",
    "The user enjoys regular social interaction at work, feeling energized by being around others.",
    "The user needs constant social engagement to feel energized and fulfilled in their work."
  ],
  m7: [
    // Impact
    "The user does not require their work to have a meaningful impact, focusing more on practical or personal goals.",
    "The user appreciates making a difference if possible, but does not see it as essential.",
    "The user would like to contribute positively in small ways, valuing incremental impact.",
    "The user finds it important that their work improves something, seeking roles with clear positive outcomes.",
    "The user is deeply purpose-driven, needing their work to feel profoundly meaningful and impactful."
  ],
  m8: [
    // Flexibility
    "The user is comfortable with a strict, routine schedule and does not require flexibility in their work hours.",
    "The user appreciates some routine to stay grounded, but is open to minor flexibility.",
    "The user prefers a balanced schedule, valuing both structure and flexibility.",
    "The user would rather have flexibility in their daily schedule whenever possible.",
    "The user highly values autonomy and control over their time, seeking maximum flexibility in their work life."
  ]
};

export function interpretMacroAnswer(questionId: string, score: number): string {
  const arr = macroInterpretations[questionId];
  if (!arr) return '';
  // Clamp score to 0-4 (assuming 1-5 scale mapped to 0-4 index)
  const idx = Math.max(0, Math.min(4, score - 1));
  return arr[idx];
} 