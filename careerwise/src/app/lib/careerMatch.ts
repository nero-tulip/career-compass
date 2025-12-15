import type { RIASECProfile, ExtendedCareer, CareerMatchResult } from '@/app/lib/results/types';

/**
 * Helper: Convert O*NET Interest array (e.g. [{name: "Realistic", score: 5}]) 
 * into our standard RIASECProfile object { R: 5, ... }
 */
export function mapInterestsToProfile(interests: { name: string; score: number }[]): RIASECProfile {
  const profile: RIASECProfile = { R: 0, I: 0, A: 0, S: 0, E: 0, C: 0 };
  
  if (!Array.isArray(interests)) return profile;

  interests.forEach(i => {
    // O*NET usually calls them "Realistic", "Investigative", etc.
    const n = i.name.toLowerCase();
    if (n.startsWith('r')) profile.R = i.score;
    else if (n.startsWith('i')) profile.I = i.score;
    else if (n.startsWith('a')) profile.A = i.score;
    else if (n.startsWith('s')) profile.S = i.score;
    else if (n.startsWith('e')) profile.E = i.score;
    else if (n.startsWith('c')) profile.C = i.score;
  });
  
  return profile;
}

/**
 * Cosine Similarity Math
 */
function cosineSim(user: RIASECProfile, career: RIASECProfile): number {
  const keys: (keyof RIASECProfile)[] = ['R', 'I', 'A', 'S', 'E', 'C'];
  let dot = 0, uSum = 0, cSum = 0;
  
  for (const k of keys) {
    const u = user[k] || 0;
    const c = career[k] || 0;
    dot += u * c;
    uSum += u * u;
    cSum += c * c;
  }
  
  const denom = Math.sqrt(uSum) * Math.sqrt(cSum);
  return denom === 0 ? 0 : dot / denom;
}

/**
 * The Main Search Function
 */
export function getCandidateCareers(
  userProfile: RIASECProfile,
  allCareers: ExtendedCareer[],
  limit: number = 20
): CareerMatchResult[] {
  return allCareers
    .map(career => {
      // 1. Extract RIASEC from the O*NET data structure
      // Note: your data uses 'Interest' (capitalized) based on your snippet
      const careerProfile = mapInterestsToProfile(career.attributes.Interest || []);
      
      // 2. Calculate the math
      const score = cosineSim(userProfile, careerProfile);
      
      // 3. Attach score
      return { ...career, matchScore: score };
    })
    .sort((a, b) => b.matchScore - a.matchScore) // Sort highest score first
    .slice(0, limit); // Take top N
}