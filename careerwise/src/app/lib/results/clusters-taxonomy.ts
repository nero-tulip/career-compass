// src/app/lib/results/clusters-taxonomy.ts

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
  socPrefixes: string[];
  riasecFocus: string[];
  commonPathways: string[]; // <--- NEW: Broad, recognizable fields
};

export const CAREER_CLUSTERS: Record<ClusterId, CareerClusterDef> = {
  agriculture: {
    id: "agriculture",
    label: "Agriculture, Food & Natural Resources",
    description: "Producing, processing, and distributing food, fiber, wood products, and natural resources.",
    socPrefixes: ["45", "19-1"],
    riasecFocus: ["R", "I"],
    commonPathways: ["Environmental Science", "Farming & Ranching", "Veterinary Services", "Forestry & Conservation", "Food Science"],
  },
  architecture: {
    id: "architecture",
    label: "Architecture & Construction",
    description: "Designing, planning, managing, building, and maintaining the built environment.",
    socPrefixes: ["47", "17-1", "17-3"],
    riasecFocus: ["R", "A", "E"],
    commonPathways: ["Architecture", "Civil Engineering", "Construction Management", "Skilled Trades", "Urban Planning"],
  },
  arts_av_tech: {
    id: "arts_av_tech",
    label: "Arts, A/V Technology & Communications",
    description: "Designing, producing, exhibiting, performing, writing, and publishing multimedia content.",
    socPrefixes: ["27"],
    riasecFocus: ["A", "E"],
    commonPathways: ["Graphic Design", "Journalism & Writing", "Film & Video Production", "Performing Arts", "Media Technology"],
  },
  business: {
    id: "business",
    label: "Business Management & Administration",
    description: "Planning, organizing, directing, and evaluating business functions.",
    socPrefixes: ["11", "13-1"],
    riasecFocus: ["E", "C"],
    commonPathways: ["Human Resources", "Project Management", "Business Analytics", "Operations", "Entrepreneurship"],
  },
  education: {
    id: "education",
    label: "Education & Training",
    description: "Planning, managing, and providing education and training services.",
    socPrefixes: ["25"],
    riasecFocus: ["S", "A"],
    commonPathways: ["K-12 Teaching", "Higher Education", "Corporate Training", "Counseling", "Library Science"],
  },
  finance: {
    id: "finance",
    label: "Finance",
    description: "Services for financial and investment planning, banking, insurance, and business financial management.",
    socPrefixes: ["13-2"],
    riasecFocus: ["C", "E"],
    commonPathways: ["Investment Banking", "Financial Planning", "Accounting", "Insurance", "Corporate Finance"],
  },
  government: {
    id: "government",
    label: "Government & Public Administration",
    description: "Executing governmental functions including national security, foreign service, and regulation.",
    socPrefixes: ["55", "11-103"],
    riasecFocus: ["E", "S", "C"],
    commonPathways: ["Public Policy", "Diplomacy", "City Planning", "Regulatory Affairs", "National Security"],
  },
  health: {
    id: "health",
    label: "Health Science",
    description: "Planning, managing, and providing therapeutic, diagnostic, and support health services.",
    socPrefixes: ["29", "31"],
    riasecFocus: ["S", "I", "R"],
    commonPathways: ["Medicine & Nursing", "Allied Health", "Mental Health", "Medical Research", "Public Health"],
  },
  hospitality: {
    id: "hospitality",
    label: "Hospitality & Tourism",
    description: "Management and operations of restaurants, lodging, attractions, and recreation events.",
    socPrefixes: ["35", "37", "39-6", "39-7"],
    riasecFocus: ["E", "S", "R"],
    commonPathways: ["Event Planning", "Hotel Management", "Culinary Arts", "Travel & Tourism", "Recreation"],
  },
  human_services: {
    id: "human_services",
    label: "Human Services",
    description: "Preparing individuals for employment in pathways that relate to families and human needs.",
    socPrefixes: ["21", "39-1", "39-2", "39-3", "39-4", "39-5", "39-9"],
    riasecFocus: ["S", "E"],
    commonPathways: ["Social Work", "Family Services", "Non-Profit Management", "Personal Care", "Community Advocacy"],
  },
  it: {
    id: "it",
    label: "Information Technology",
    description: "Building, testing, and maintaining hardware, software, multimedia, and systems.",
    socPrefixes: ["15"],
    riasecFocus: ["I", "C", "R"],
    commonPathways: ["Software Development", "Cybersecurity", "Data Science", "Network Engineering", "IT Support"],
  },
  law_public_safety: {
    id: "law_public_safety",
    label: "Law, Public Safety, Corrections & Security",
    description: "Planning, managing, and providing legal, public safety, protective services and homeland security.",
    socPrefixes: ["23", "33"],
    riasecFocus: ["R", "E", "S"],
    commonPathways: ["Legal Services", "Law Enforcement", "Emergency Services", "Forensics", "Security"],
  },
  manufacturing: {
    id: "manufacturing",
    label: "Manufacturing",
    description: "Planning, managing, and performing the processing of materials into intermediate or final products.",
    socPrefixes: ["51"],
    riasecFocus: ["R", "C"],
    commonPathways: ["Production Management", "Process Engineering", "Quality Assurance", "Logistics", "Machine Operations"],
  },
  marketing: {
    id: "marketing",
    label: "Marketing",
    description: "Planning, managing, and performing marketing activities to reach organizational objectives.",
    socPrefixes: ["41", "13-116"],
    riasecFocus: ["E", "A", "C"],
    commonPathways: ["Digital Marketing", "Sales Management", "Market Research", "Public Relations", "Brand Management"],
  },
  stem: {
    id: "stem",
    label: "Science, Technology, Engineering & Mathematics",
    description: "Planning, managing, and providing scientific research and professional and technical services.",
    socPrefixes: ["17-2", "19-2", "19-3", "19-4"],
    riasecFocus: ["I", "R"],
    commonPathways: ["Engineering", "Laboratory Science", "Research & Development", "Mathematics", "Biotechnology"],
  },
  transportation: {
    id: "transportation",
    label: "Transportation, Distribution & Logistics",
    description: "Planning, management, and movement of people, materials, and goods.",
    socPrefixes: ["53"],
    riasecFocus: ["R", "C", "E"],
    commonPathways: ["Aviation", "Logistics Management", "Supply Chain", "Automotive Technology", "Freight & Distribution"],
  },
};