import type { User } from "firebase/auth";
import { loadRiasecSummary } from "@/app/lib/results/loaders/client-loaders"; // Keep your existing import
import { getCandidateCareers } from "@/app/lib/careerMatch";
import type { CareerMatchResult, ExtendedCareer } from "@/app/lib/results/types";
import careersDataRaw from "@/app/data/career_compass_data.json";

const allCareers = careersDataRaw as unknown as ExtendedCareer[];

export type ExampleRolesOutput = {
  matches: CareerMatchResult[];
  userProfile?: any;
};

export async function generateExampleRoles(
  user: User,
  rid: string
): Promise<ExampleRolesOutput> {
  // 1. Get the data from your existing, working loader
  // This returns { scores: [{key:'R', avg:4}...], top3: [...] }
  const summary = await loadRiasecSummary(user, rid);

  if (!summary || !summary.scores) {
    console.error("Loader returned empty summary for rid:", rid);
    return { matches: [] };
  }

  // 2. Convert the Loader's ARRAY into the OBJECT the matcher needs
  // We map [{key:'R', avg:4}] -> {R: 4}
  const profile: any = { R:0, I:0, A:0, S:0, E:0, C:0 };
  
  summary.scores.forEach((item) => {
    if (item.key) {
      profile[item.key] = item.avg;
    }
  });

  // 3. Validate we actually have numbers now
  if (typeof profile.R !== 'number') {
     console.error("Failed to convert RIASEC Array to Object", profile);
     return { matches: [] };
  }

  // 4. Run the match
  const matches = getCandidateCareers(profile, allCareers, 20);

  return { matches, userProfile: profile };
}