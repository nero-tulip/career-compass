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
  matches: Career[]
): string {
  return `Based on the following career profile and matched careers, provide a detailed analysis:

RIASEC Profile:
- Realistic: ${profile.R.toFixed(2)}
- Investigative: ${profile.I.toFixed(2)}
- Artistic: ${profile.A.toFixed(2)}
- Social: ${profile.S.toFixed(2)}
- Enterprising: ${profile.E.toFixed(2)}
- Conventional: ${profile.C.toFixed(2)}

Matched Careers:
${matches.map(career => `
${career.title} (${career.code})
- RIASEC Profile: R:${career.riasec.R.toFixed(2)}, I:${career.riasec.I.toFixed(2)}, A:${career.riasec.A.toFixed(2)}, S:${career.riasec.S.toFixed(2)}, E:${career.riasec.E.toFixed(2)}, C:${career.riasec.C.toFixed(2)}
`).join('\n')}

Please provide:
1. A personality analysis based on the RIASEC profile
2. Why these specific careers are good matches for this profile
3. Actionable next steps for exploring these careers
4. Potential areas for growth and development
5. How to leverage their dominant traits in these career paths

Format the response in a clear, engaging way that's easy to understand and act upon.`;
} 