// src/app/lib/results/clusters-taxonomy.ts

/* The Career Clusters page orients users to the worlds of work that fit their psychology.
 It explains why, surfaces tradeoffs, and stops short of prescribing specific jobs.
 */

export type ClusterId =
  // High-Structure / Low-Ambiguity Worlds
  | "operations_admin"
  | "accounting_financial_control"
  | "manufacturing_industrial"
  | "logistics_supply_chain"

  // Competitive / High-Upside Worlds
  | "entrepreneurship_startups"
  | "high_finance_investing"
  | "sales_revenue"

  // Analytical / Abstract Worlds
  | "law_legal_reasoning"
  | "policy_government_regulation"
  | "academic_theoretical_research"

  // Technical / Problem-Solving Worlds
  | "applied_engineering"
  | "software_technology"
  | "scientific_lab_research"

  // Human-Centric Care Worlds
  | "clinical_healthcare"
  | "mental_health_counseling"
  | "education_training"
  | "human_social_services"

  // Creative / Expressive Worlds
  | "creative_media"
  | "marketing_brand_design"

  // Action-Oriented / Physical Worlds
  | "public_safety_emergency"
  | "skilled_trades_construction"
  | "transportation_physical_operations";

// src/app/lib/results/clusters-taxonomy.ts

/* 
Career clusters describe psychologically coherent worlds of work.
They orient users toward environments that fit their interests,
temperament, and tolerance for tradeoffs — without prescribing jobs.
*/

export type RiasecVector = {
  R: number;
  I: number;
  A: number;
  S: number;
  E: number;
  C: number;
};

export type BigFiveVector = {
  openness: number;          // tolerance for abstraction, novelty
  conscientiousness: number; // structure, discipline, reliability
  extraversion: number;      // social energy, assertiveness
  agreeableness: number;     // cooperation vs competitiveness
  neuroticism: number;       // stress sensitivity, volatility
};

export type CareerClusterDef = {
  /** Stable identifier used by the algorithm */
  id: ClusterId;

  /** Human-readable name shown in UI */
  label: string;

  /** High-level explanation of what this world is */
  description: string;

  /* =========================
     PSYCHOLOGICAL FOUNDATIONS
     ========================= */

  /**
   * What kinds of interests this world actively rewards.
   * Used as the PRIMARY orientation gate.
   * Values are relative weights, not absolute scores.
   */
  riasecProfile: RiasecVector;

  /**
   * Temperamental demands of this environment.
   * Used to MODULATE fit within RIASEC-viable clusters.
   */
  bigFiveProfile: BigFiveVector;

  /**
   * Psychological traits that tend to clash with this world.
   * Used for explicit penalties or warnings — never hidden.
   */
  riasecConflicts?: Partial<RiasecVector>;

  /* =========================
     ENVIRONMENT & TRADEOFFS
     ========================= */

  /**
   * How this world feels to live in, day-to-day.
   * These do NOT drive ranking directly — they frame expectations.
   */
  environment: {
    structure: "low" | "medium" | "high";
    ambiguity: "low" | "medium" | "high";
    competitiveness: "low" | "medium" | "high";
    socialIntensity: "low" | "medium" | "high";
    pressure: "low" | "medium" | "high";
  };

  /**
   * Typical long-term rewards associated with this world.
   * Used for explanation, not prescription.
   */
  rewards: {
    incomePotential: "low" | "medium" | "high";
    statusPrestige: "low" | "medium" | "high";
    autonomy: "low" | "medium" | "high";
    impact: "low" | "medium" | "high";
    stability: "low" | "medium" | "high";
  };

  /**
   * Common psychological costs or risks.
   * These are surfaced explicitly to users.
   */
  stressors: {
    burnoutRisk: "low" | "medium" | "high";
    emotionalLoad: "low" | "medium" | "high";
    workLifeImbalance: "low" | "medium" | "high";
  };

  /* =========================
     ORIENTATION & EXPLORATION
     ========================= */

  /**
   * Broad, recognisable arenas within this world.
   * Used for exploratory nudges — never hard recommendations.
   */
  pathways: string[];

  /**
   * Plain-English explanation hooks used by the report generator
   * (e.g. “People like you often value…”)
   */
  narrativeHooks: {
    thrivesWhen: string[];
    strugglesWhen: string[];
    valuesOftenInclude: string[];
  };
};

export const CAREER_CLUSTERS: Record<ClusterId, CareerClusterDef> = {
  // High-Structure / Low-Ambiguity Worlds
  operations_admin: {
    id: "operations_admin",
    label: "Operations & Administration",
    description:
      "Careers focused on managing organizational processes, ensuring efficiency, and maintaining structured environments.",
  },
  accounting_financial_control: {
    id: "accounting_financial_control",
    label: "Accounting & Financial Control",
    description:
      "Careers centered around financial record-keeping, auditing, and ensuring regulatory compliance.",
  },
  manufacturing_industrial: {
    id: "manufacturing_industrial",
    label: "Manufacturing & Industrial",
    description:
      "Careers involving the production of goods, quality control, and industrial operations.",
  },
  logistics_supply_chain: {
    id: "logistics_supply_chain",
    label: "Logistics & Supply Chain",
    description:
      "Careers focused on the management of supply chains, transportation, and distribution of goods.",
  },

  // Competitive / High-Upside Worlds
  entrepreneurship_startups: {
    id: "entrepreneurship_startups",
    label: "Entrepreneurship & Startups",
    description:
      "Careers focused on innovation, business development, and creating new ventures.",
  },
  high_finance_investing: {
    id: "high_finance_investing",
    label: "High Finance & Investing",
    description:
      "Careers centered around financial markets, investment strategies, and wealth management.",
  },
  sales_revenue: {
    id: "sales_revenue",
    label: "Sales & Revenue",
    description:
      "Careers focused on driving sales, managing client relationships, and maximizing revenue.",
  },
  
  // Analytical / Abstract Worlds
  law_legal_reasoning: {
    id: "law_legal_reasoning",
    label: "Law & Legal Reasoning",
    description:
      "Careers centered around legal analysis, advocacy, and the interpretation of laws and regulations.",
  },
  policy_government_regulation: {
    id: "policy_government_regulation",
    label: "Policy, Government & Regulation",
    description:
      "Careers focused on public policy development, regulatory compliance, and governmental affairs.",
  },
  academic_theoretical_research: {
    id: "academic_theoretical_research",
    label: "Academic, Theoretical & Research",
    description:
      "Careers involving scholarly research, theoretical exploration, and academic pursuits.",
  },

  // Technical / Problem-Solving Worlds
  applied_engineering: {
    id: "applied_engineering",
    label: "Applied Engineering",
    description:
      "Careers focused on designing, building, and maintaining technological systems and structures.",
  },
  software_technology: {
    id: "software_technology",
    label: "Software & Technology",
    description:
      "Careers focused on the development, implementation, and management of software and technology solutions.",
  },
  scientific_lab_research: {
    id: "scientific_lab_research",
    label: "Scientific & Lab Research",
    description:
      "Careers centered around experimental research, data analysis, and scientific discovery.",
  },

  // Human-Centric Care Worlds
  clinical_healthcare: {
    id: "clinical_healthcare",
    label: "Clinical Healthcare",
    description:
      "Careers focused on medical treatment, patient care, and healthcare services.",
  },
  mental_health_counseling: {
    id: "mental_health_counseling",
    label: "Mental Health & Counseling",
    description:
      "Careers centered around psychological support, therapy, and mental wellness.",
  },
  education_training: {
    id: "education_training",
    label: "Education & Training",
    description:
      "Careers focused on teaching, curriculum development, and educational administration.",
  },
  human_social_services: {
    id: "human_social_services",
    label: "Human & Social Services",
    description:
      "Careers centered around community support, social work, and human services.",
  },

  // Creative / Expressive Worlds
  creative_media: {
    id: "creative_media",
    label: "Creative Media",
    description:
      "Careers focused on content creation, media production, and artistic expression.",
  },
  marketing_brand_design: {
    id: "marketing_brand_design",
    label: "Marketing, Brand & Design",
    description:
      "Careers centered around brand development, marketing strategies, and visual design.",
  },

  // Action-Oriented / Physical Worlds
  public_safety_emergency: {
    id: "public_safety_emergency",
    label: "Public Safety & Emergency",
    description:
      "Careers focused on law enforcement, emergency response, and public safety services.",
  },
  skilled_trades_construction: {
    id: "skilled_trades_construction",
    label: "Skilled Trades & Construction",
    description:
      "Careers centered around manual skills, construction, and skilled trades work.",
  },
  transportation_physical_operations: {
    id: "transportation_physical_operations",
    label: "Transportation & Physical Operations",
    description:
      "Careers focused on the movement of goods and people, logistics, and physical operations.",
  },
};