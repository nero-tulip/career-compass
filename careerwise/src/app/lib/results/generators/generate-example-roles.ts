import type { User } from "firebase/auth";
import { generateCareerClusters } from "@/app/lib/results/generators/generate-career-clusters";

export type RoleSuggestion = {
  title: string;
  summary: string;
  level: "entry" | "mid" | "senior";
};

export type ExampleRoleSet = {
  clusterKey: string;
  clusterLabel: string;
  rationale: string;
  roles: RoleSuggestion[];
};

export type ExampleRoleSummary = {
  topClusters: ExampleRoleSet[];
};

export async function generateExampleRoles(
  user: User,
  rid: string
): Promise<ExampleRoleSummary> {
  const clusters = await generateCareerClusters(user, rid);
  const top3 = clusters.clusters.slice(0, 3);

  const library: Record<string, RoleSuggestion[]> = {
    "tech_engineering": [
      { title: "Software Engineer", level: "entry", summary: "Write and test code for digital products and systems." },
      { title: "Product Engineer", level: "mid", summary: "Design and improve user-facing features with cross-functional teams." },
      { title: "Machine Learning Engineer", level: "senior", summary: "Build intelligent systems that learn from data." },
    ],
    "data_research": [
      { title: "Data Analyst", level: "entry", summary: "Collect and interpret data to uncover insights." },
      { title: "UX Researcher", level: "mid", summary: "Study user behavior to inform better product design." },
      { title: "Research Scientist", level: "senior", summary: "Lead advanced studies and experiments to push knowledge boundaries." },
    ],
    "design_creative": [
      { title: "Graphic Designer", level: "entry", summary: "Create visual assets for marketing and brand projects." },
      { title: "Product Designer", level: "mid", summary: "Design intuitive experiences balancing user needs and business goals." },
      { title: "Creative Director", level: "senior", summary: "Guide the visual direction and brand storytelling of an organization." },
    ],
    "business_leadership": [
      { title: "Operations Analyst", level: "entry", summary: "Support projects and business decisions with data and systems thinking." },
      { title: "Product Manager", level: "mid", summary: "Coordinate teams to deliver impactful features on time." },
      { title: "Strategy Director", level: "senior", summary: "Drive business growth through market insight and leadership." },
    ],
    "education_social": [
      { title: "Teaching Assistant", level: "entry", summary: "Support learners and educators in academic or community settings." },
      { title: "Program Coordinator", level: "mid", summary: "Organize and manage social or educational initiatives." },
      { title: "Learning Designer", level: "senior", summary: "Design scalable learning programs and digital curricula." },
    ],
    "healthcare_helping": [
      { title: "Medical Assistant", level: "entry", summary: "Support patient care and manage clinical documentation." },
      { title: "Health Coach", level: "mid", summary: "Help clients achieve wellness goals through education and support." },
      { title: "Clinical Specialist", level: "senior", summary: "Oversee care quality and develop patient-centered improvements." },
    ],
    "media_communications": [
      { title: "Content Creator", level: "entry", summary: "Produce short-form or long-form media for digital audiences." },
      { title: "Marketing Strategist", level: "mid", summary: "Plan and execute campaigns that connect brands to audiences." },
      { title: "Communications Director", level: "senior", summary: "Shape public narrative and oversee brand communications." },
    ],
    "ops_admin": [
      { title: "Administrative Assistant", level: "entry", summary: "Manage daily logistics and documentation for teams." },
      { title: "Operations Manager", level: "mid", summary: "Oversee workflow efficiency and internal systems." },
      { title: "Project Director", level: "senior", summary: "Lead complex operations and drive continuous improvement." },
    ],
    "hands_on_trades": [
      { title: "Apprentice Technician", level: "entry", summary: "Assist in physical installations or technical maintenance." },
      { title: "Field Engineer", level: "mid", summary: "Operate, inspect, and optimize physical systems and hardware." },
      { title: "Operations Supervisor", level: "senior", summary: "Lead technical teams ensuring quality and safety standards." },
    ],
  };

  const topClusters: ExampleRoleSet[] = top3.map((cluster) => ({
    clusterKey: cluster.key,
    clusterLabel: cluster.label,
    rationale: cluster.rationale,
    roles: library[cluster.key] ?? [],
  }));

  return { topClusters };
}