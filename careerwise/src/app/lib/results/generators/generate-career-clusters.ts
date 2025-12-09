import type { User } from "firebase/auth";
import {
  loadIntakeSummary,
  loadMacroSummary,
  loadRiasecSummary,
  loadBig5Summary,
} from "@/app/lib/results/loaders/client-loaders";
import careersRaw from "@/app/data/careers.json";
import { CAREER_CLUSTERS, type ClusterId } from "../clusters-taxonomy";

type CareerRow = {
  code: string;
  title: string;
  riasec: { R: number; I: number; A: number; S: number; E: number; C: number };
};

export type ClusterItem = {
  key: ClusterId;
  label: string;
  description: string;
  score: number;
  rationale: string;
  matchLevel: "High" | "Medium" | "Low";
  exampleRoles: string[]; 
};

export type ClusterResult = {
  clusters: ClusterItem[];
};

// --- Helpers ---

// Check if a career code starts with any of the valid prefixes
function matchesSoc(code: string, prefixes: string[]) {
  return prefixes.some((p) => code.startsWith(p));
}

// Cosine Similarity for Role Ranking
function cosineSim(userProfile: any, careerProfile: any): number {
  const keys = ['R', 'I', 'A', 'S', 'E', 'C'];
  let dot = 0, magA = 0, magB = 0;
  for (const k of keys) {
    const a = userProfile[k] || 0;
    const b = careerProfile[k] || 0;
    dot += a * b;
    magA += a * a;
    magB += b * b;
  }
  return dot / (Math.sqrt(magA) * Math.sqrt(magB) || 1);
}

// --- Main Generator ---

export async function generateCareerClusters(user: User, rid: string): Promise<ClusterResult> {
  const [intake, macro, riasec, big5] = await Promise.all([
    loadIntakeSummary(user, rid).catch(() => undefined),
    loadMacroSummary(user, rid).catch(() => undefined),
    loadRiasecSummary(user, rid).catch(() => undefined),
    loadBig5Summary(user, rid).catch(() => undefined),
  ]);

  // 1. Prepare User Data
  // User's top 3 RIASEC letters (e.g. ["E", "S", "A"])
  const topLetters = riasec?.top3 || [];
  
  // User's full RIASEC profile for role ranking
  const userProfile: any = { R:0, I:0, A:0, S:0, E:0, C:0 };
  riasec?.scores.forEach((s: any) => userProfile[s.key] = s.avg);

  const careers = careersRaw as CareerRow[];

  // 2. Iterate over the 16 Clusters
  const results = Object.values(CAREER_CLUSTERS).map((def) => {
    let score = 0;
    const signals: string[] = [];

    // --- A. Cluster Scoring (RIASEC Focus) ---
    // If the cluster's primary focus matches the user's top traits, boost score.
    // Weighting: Primary matches are huge, secondary are good.
    
    // Check intersection between Cluster's Focus and User's Top 3
    const intersection = def.riasecFocus.filter(value => topLetters.includes(value as any));
    
    if (intersection.length > 0) {
      score += 50; // Base baseline for any match
      score += (intersection.length * 15); // +15 per matching letter
      signals.push(`Matches your ${intersection.join("/")} interest`);
    }

    // --- B. Cluster Scoring (Intake/Macro Nudges) ---
    // Example: If they explicitly selected "Technology" in Intake, boost IT.
    const interested = intake?.interestedIndustries?.map(x => x.value) ?? [];
    
    // Simple heuristic map (expand as needed)
    if (def.id === 'it' && (interested.includes('tech') || interested.includes('engineering'))) score += 20;
    if (def.id === 'health' && interested.includes('healthcare')) score += 20;
    if (def.id === 'business' && (interested.includes('business') || interested.includes('finance'))) score += 20;
    if (def.id === 'arts_av_tech' && (interested.includes('design') || interested.includes('arts'))) score += 20;

    // --- C. Find Roles (The "Nuance") ---
    // Filter careers by SOC prefixes defined in our taxonomy
    const relevantCareers = careers.filter(c => matchesSoc(c.code, def.socPrefixes));
    
    // Rank roles by cosine similarity (Specific fit vs Broad fit)
    const scoredRoles = relevantCareers.map(c => ({
        title: c.title,
        sim: cosineSim(userProfile, c.riasec)
    })).sort((a, b) => b.sim - a.sim);

    // Pick top 4
    const exampleRoles = scoredRoles.slice(0, 4).map(c => c.title);

    // Fallback if no roles found in DB
    if (exampleRoles.length === 0) {
        exampleRoles.push("Various Opportunities");
    }

    // --- D. Finalize ---
    const finalScore = Math.min(100, Math.round(score));
    let matchLevel: ClusterItem["matchLevel"] = "Low";
    if (finalScore >= 80) matchLevel = "High";
    else if (finalScore >= 50) matchLevel = "Medium";

    return {
      key: def.id,
      label: def.label,
      description: def.description,
      score: finalScore,
      matchLevel,
      rationale: signals.length > 0 ? `Good fit based on your ${signals[0]}.` : "Based on your overall profile.",
      exampleRoles,
    };
  });

  // 3. Sort by Score (Desc)
  return { clusters: results.sort((a, b) => b.score - a.score) };
}