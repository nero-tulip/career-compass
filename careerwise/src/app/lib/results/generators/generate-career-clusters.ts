// src/app/lib/results/generators/generate-career-clusters.ts

import type { User } from "firebase/auth";
import { loadRiasecSummary } from "@/app/lib/results/loaders/client-loaders";
import { CAREER_CLUSTERS, type ClusterId } from "../clusters-taxonomy";

export type ClusterItem = {
  key: ClusterId;
  label: string;
  description: string;
  score: number;
  matchLevel: "High" | "Medium" | "Low";
  matchSignals: string[]; // RIASEC tags only (e.g., "Social Interest")
  pathways: string[];     // Broad generic roles (e.g., "Investment Banking")
};

export type ClusterResult = {
  clusters: ClusterItem[];
};

export async function generateCareerClusters(user: User, rid: string): Promise<ClusterResult> {
  // 1. Load ONLY Riasec
  const riasec = await loadRiasecSummary(user, rid).catch(() => undefined);

  // User's top 3 RIASEC letters (e.g. ["E", "S", "A"])
  const topLetters = riasec?.top3 || [];
  
  // 2. Iterate over the 16 Clusters
  const results = Object.values(CAREER_CLUSTERS).map((def) => {
    let score = 0;
    const signals: string[] = [];

    // --- Cluster Scoring (RIASEC Only) ---
    // Check intersection between Cluster's Focus and User's Top 3
    const intersection = def.riasecFocus.filter(value => topLetters.includes(value as any));
    
    if (intersection.length > 0) {
      // Base match score
      score += 50; 
      // Boost for matching multiple letters
      score += (intersection.length * 15); 
      
      // Generate clean tags for the "Why" section
      intersection.forEach(letter => {
        if (letter === "R") signals.push("Realistic Interest");
        if (letter === "I") signals.push("Investigative Interest");
        if (letter === "A") signals.push("Artistic Interest");
        if (letter === "S") signals.push("Social Interest");
        if (letter === "E") signals.push("Enterprising Interest");
        if (letter === "C") signals.push("Conventional Interest");
      });
    } else {
        // If no top 3 match, give a small base score if it matches the *primary* driver only
        // (Optional: keep score 0 if strictly no match)
    }

    // --- Finalize ---
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
      matchSignals: signals, 
      pathways: def.commonPathways, // Uses the broad list (e.g. "Investment Banking") 
    };
  });

  // 3. Sort by Score (Desc)
  return { clusters: results.sort((a, b) => b.score - a.score) };
}