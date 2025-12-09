export type ClusterId =
  | "agriculture"
  | "architecture"
  | "arts_av_tech"
  | "business"
  | "education"
  | "finance"
  | "government"
  | "health"
  | "hospitality"
  | "human_services"
  | "it"
  | "law_public_safety"
  | "manufacturing"
  | "marketing"
  | "stem"
  | "transportation";

export type CareerClusterDef = {
  id: ClusterId;
  label: string;
  description: string;
  socPrefixes: string[]; // O*NET SOC Major Groups
  riasecFocus: string[]; // Primary RIASEC drivers for high-level matching
};

export const CAREER_CLUSTERS: Record<ClusterId, CareerClusterDef> = {
  agriculture: {
    id: "agriculture",
    label: "Agriculture, Food & Natural Resources",
    description: "Producing, processing, and distributing food, fiber, wood products, and natural resources.",
    socPrefixes: ["45", "19-1"], // Farming (45), Life Scientists (19-1 partial)
    riasecFocus: ["R", "I"],
  },
  architecture: {
    id: "architecture",
    label: "Architecture & Construction",
    description: "Designing, planning, managing, building, and maintaining the built environment.",
    socPrefixes: ["47", "17-1", "17-3"], // Construction (47), Architects (17-1), Drafters (17-3)
    riasecFocus: ["R", "A", "E"],
  },
  arts_av_tech: {
    id: "arts_av_tech",
    label: "Arts, A/V Technology & Communications",
    description: "Designing, producing, exhibiting, performing, writing, and publishing multimedia content.",
    socPrefixes: ["27"], // Arts, Design, Entertainment, Sports, and Media
    riasecFocus: ["A", "E"],
  },
  business: {
    id: "business",
    label: "Business Management & Administration",
    description: "Planning, organizing, directing, and evaluating business functions.",
    socPrefixes: ["11", "13-1"], // Management (11), Business Ops (13-1)
    riasecFocus: ["E", "C"],
  },
  education: {
    id: "education",
    label: "Education & Training",
    description: "Planning, managing, and providing education and training services.",
    socPrefixes: ["25"], // Educational Instruction and Library
    riasecFocus: ["S", "A"],
  },
  finance: {
    id: "finance",
    label: "Finance",
    description: "Services for financial and investment planning, banking, insurance, and business financial management.",
    socPrefixes: ["13-2"], // Financial Specialists
    riasecFocus: ["C", "E"],
  },
  government: {
    id: "government",
    label: "Government & Public Administration",
    description: "Executing governmental functions including national security, foreign service, and regulation.",
    socPrefixes: ["55", "11-103"], // Military (55), Legislators (11-103)
    riasecFocus: ["E", "S", "C"],
  },
  health: {
    id: "health",
    label: "Health Science",
    description: "Planning, managing, and providing therapeutic, diagnostic, and support health services.",
    socPrefixes: ["29", "31"], // Healthcare Practitioners (29), Healthcare Support (31)
    riasecFocus: ["S", "I", "R"],
  },
  hospitality: {
    id: "hospitality",
    label: "Hospitality & Tourism",
    description: "Management and operations of restaurants, lodging, attractions, and recreation events.",
    socPrefixes: ["35", "37", "39-6", "39-7"], // Food (35), Building Cleaning (37), Guides (39)
    riasecFocus: ["E", "S", "R"],
  },
  human_services: {
    id: "human_services",
    label: "Human Services",
    description: "Preparing individuals for employment in pathways that relate to families and human needs.",
    socPrefixes: ["21", "39-1", "39-2", "39-3", "39-4", "39-5", "39-9"], // Community Service (21), Personal Care (39)
    riasecFocus: ["S", "E"],
  },
  it: {
    id: "it",
    label: "Information Technology",
    description: "Building, testing, and maintaining hardware, software, multimedia, and systems.",
    socPrefixes: ["15"], // Computer and Mathematical
    riasecFocus: ["I", "C", "R"],
  },
  law_public_safety: {
    id: "law_public_safety",
    label: "Law, Public Safety, Corrections & Security",
    description: "Planning, managing, and providing legal, public safety, protective services and homeland security.",
    socPrefixes: ["23", "33"], // Legal (23), Protective Service (33)
    riasecFocus: ["R", "E", "S"],
  },
  manufacturing: {
    id: "manufacturing",
    label: "Manufacturing",
    description: "Planning, managing, and performing the processing of materials into intermediate or final products.",
    socPrefixes: ["51"], // Production
    riasecFocus: ["R", "C"],
  },
  marketing: {
    id: "marketing",
    label: "Marketing",
    description: "Planning, managing, and performing marketing activities to reach organizational objectives.",
    socPrefixes: ["41", "13-116"], // Sales (41), Market Research (13-116)
    riasecFocus: ["E", "A", "C"],
  },
  stem: {
    id: "stem",
    label: "Science, Technology, Engineering & Mathematics",
    description: "Planning, managing, and providing scientific research and professional and technical services.",
    socPrefixes: ["17-2", "19-2", "19-3", "19-4"], // Engineers (17-2), Physical/Social Scientists (19)
    riasecFocus: ["I", "R"],
  },
  transportation: {
    id: "transportation",
    label: "Transportation, Distribution & Logistics",
    description: "Planning, management, and movement of people, materials, and goods.",
    socPrefixes: ["53"], // Transportation and Material Moving
    riasecFocus: ["R", "C", "E"],
  },
};