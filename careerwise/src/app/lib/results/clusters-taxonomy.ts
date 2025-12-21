// src/app/lib/results/clusters-taxonomy.ts

/* The Career Clusters page orients users to the worlds of work that fit their psychology.
 It explains why, surfaces tradeoffs, and stops short of prescribing specific jobs.
 */

export type ClusterId =
  // High-Structure / Low-Ambiguity Worlds
  | "operations_admin"
  | "accounting_financial_control"
  | "corporate_strategy_leadership"
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


  export type Scale =
  | "very_low"
  | "low"
  | "low_medium"
  | "medium"
  | "medium_high"
  | "high"
  | "very_high"
  | "variable";

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
  O: number; // tolerance for abstraction, novelty
  C: number; // structure, discipline, reliability
  E: number; // social energy, assertiveness
  A: number; // cooperation vs competitiveness
  N: number; // stress sensitivity, volatility
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
    structure: Scale;
    ambiguity: Scale;
    competitiveness: Scale;
    socialIntensity: Scale;
    pressure: Scale;
  };

  /**
   * Typical long-term rewards associated with this world.
   * Used for explanation, not prescription.
   */
  rewards: {
    incomePotential: Scale;
    statusPrestige: Scale;
    autonomy: Scale;
    impact: Scale;
    stability: Scale;
  };

  /**
   * Common psychological costs or risks.
   * These are surfaced explicitly to users.
   */
  stressors: {
    burnoutRisk: Scale;
    emotionalLoad: Scale;
    workLifeImbalance: Scale;
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
      "Careers centered on maintaining order inside complex organizations. This world prioritizes structure, reliability, and process discipline—ensuring that systems run smoothly, responsibilities are clear, and outcomes are predictable over time.",

    /* =========================
     PSYCHOLOGICAL FOUNDATIONS
     ========================= */

    riasecProfile: {
      R: 1.0,
      I: 1.5,
      A: 0.5,
      S: 1.0,
      E: 1.5,
      C: 4.5,
    },

    bigFiveProfile: {
      O: 2.0,
      C: 4.5,
      E: 2.5,
      A: 3.0,
      N: 2.0,
    },

    riasecConflicts: {
      A: 2.0,
      E: 1.5,
    },

    /* =========================
     ENVIRONMENT & TRADEOFFS
     ========================= */

    environment: {
      structure: "high",
      ambiguity: "low",
      competitiveness: "low",
      socialIntensity: "medium",
      pressure: "medium",
    },

    rewards: {
      incomePotential: "medium",
      statusPrestige: "low",
      autonomy: "medium",
      impact: "medium",
      stability: "high",
    },

    stressors: {
      burnoutRisk: "medium",
      emotionalLoad: "low",
      workLifeImbalance: "low",
    },

    /* =========================
     ORIENTATION & EXPLORATION
     ========================= */

    pathways: [
      "Operations Management",
      "Office & Business Administration",
      "Process Improvement",
      "Compliance & Internal Controls",
      "Program Coordination",
    ],

    narrativeHooks: {
      thrivesWhen: [
        "expectations and responsibilities are clearly defined",
        "systems can be improved incrementally over time",
        "competence and reliability are valued more than visibility",
      ],
      strugglesWhen: [
        "goals are vague or constantly shifting",
        "success depends on aggressive self-promotion or risk-taking",
        "rules and structure are weak or inconsistently enforced",
      ],
      valuesOftenInclude: [
        "stability",
        "clarity of responsibility",
        "predictable outcomes",
        "being depended upon",
      ],
    },
  },
  accounting_financial_control: {
    id: "accounting_financial_control",
    label: "Accounting & Financial Control",
    description:
      "Careers centered on precision, compliance, and financial truth. This world exists to measure reality accurately, enforce rules consistently, and reduce uncertainty through disciplined financial oversight.",

    /* =========================
     PSYCHOLOGICAL FOUNDATIONS
     ========================= */

    // This world strongly rewards order, accuracy, and rule-following
    riasecProfile: {
      R: 0.5, // Minimal hands-on physical engagement
      I: 2.0, // Analytical reasoning and verification
      A: 0.2, // Very low tolerance for creative deviation
      S: 0.8, // Limited social emphasis
      E: 1.0, // Little persuasion or risk appetite
      C: 4.8, // Extremely strong preference for structure and rules
    },

    // Temperamentally demanding: discipline, emotional stability, attention to detail
    bigFiveProfile: {
      O: 1.5, // Novelty-seeking actively hurts performance
      C: 4.8, // Absolute requirement
      E: 2.0, // Mostly solitary, task-focused work
      A: 3.0, // Professional cooperation, not warmth-driven
      N: 1.8, // High stress tolerance required
    },

    // Psychological tensions with this world
    riasecConflicts: {
      A: 2.5, // Creative personalities feel suffocated
      E: 2.0, // Risk-seekers clash with conservative mandates
    },

    /* =========================
     ENVIRONMENT & TRADEOFFS
     ========================= */

    environment: {
      structure: "very_high",
      ambiguity: "very_low",
      competitiveness: "low",
      socialIntensity: "low",
      pressure: "medium_high",
    },

    rewards: {
      incomePotential: "medium",
      statusPrestige: "medium",
      autonomy: "low_medium",
      impact: "high", // Quiet but real organizational impact
      stability: "very_high",
    },

    stressors: {
      burnoutRisk: "medium",
      emotionalLoad: "low",
      workLifeImbalance: "medium",
    },

    /* =========================
     ORIENTATION & EXPLORATION
     ========================= */

    pathways: [
      "Financial Accounting",
      "Audit & Assurance",
      "Tax & Compliance",
      "Internal Controls",
      "Risk & Governance",
    ],

    narrativeHooks: {
      thrivesWhen: [
        "rules and standards are clearly defined and enforced",
        "accuracy matters more than speed or charisma",
        "responsibility is individual and clearly scoped",
      ],
      strugglesWhen: [
        "expectations change frequently or informally",
        "creative interpretation is rewarded over correctness",
        "financial risk-taking is encouraged",
      ],
      valuesOftenInclude: [
        "certainty",
        "correctness",
        "predictability",
        "professional integrity",
      ],
    },
  },

  corporate_strategy_leadership: {
  id: "corporate_strategy_leadership",
  label: "Corporate Strategy & Leadership",
  description:
    "Careers centered on steering large organizations through complex decisions under uncertainty. This world rewards analytical synthesis, influence without chaos, and the ability to balance structure, competition, and long-term outcomes across multiple stakeholders.",

  /* =========================
     PSYCHOLOGICAL FOUNDATIONS
     ========================= */

  // Analysis + influence + structured power
  riasecProfile: {
    R: 0.6, // Minimal hands-on or mechanical engagement
    I: 4.0, // Core driver: strategic analysis and systems thinking
    A: 1.4, // Creativity is instrumental, not expressive
    S: 3.0, // Stakeholder navigation, alignment, leadership presence
    E: 4.2, // Dominant driver: influence, competition, decision authority
    C: 3.6, // Strong need for structure, frameworks, governance
  },

  // Temperament favors ambition, composure, and strategic patience
  bigFiveProfile: {
    O: 3.6,          // Conceptual thinking and synthesis matter
    C: 4.2, // Execution, reliability, and follow-through
    E: 3.4,      // Comfort leading discussions and decisions
    A: 2.8,     // Cooperation without excessive deference
    N: 2.2,       // Emotional control under pressure
  },

  // Psychological mismatches
  riasecConflicts: {
    R: 2.5, // Strongly hands-on personalities feel abstracted
    A: 2.2, // Pure creatives resent instrumental constraints
  },

  /* =========================
     ENVIRONMENT & TRADEOFFS
     ========================= */

  environment: {
    structure: "medium_high",
    ambiguity: "medium_high",
    competitiveness: "high",
    socialIntensity: "medium_high",
    pressure: "high",
  },

  rewards: {
    incomePotential: "high",
    statusPrestige: "high",
    autonomy: "medium_high",
    impact: "very_high",
    stability: "medium_high",
  },

  stressors: {
    burnoutRisk: "medium_high",
    emotionalLoad: "medium",
    workLifeImbalance: "medium_high",
  },

  /* =========================
     ORIENTATION & EXPLORATION
     ========================= */

  pathways: [
    "Corporate Strategy",
    "Management Consulting",
    "Product & General Management",
    "Business Operations & Strategy",
    "Executive Leadership & Governance",
  ],

  narrativeHooks: {
    thrivesWhen: [
      "decisions require balancing competing priorities and incentives",
      "influence is exercised through reasoning, alignment, and authority",
      "structure exists, but judgment matters more than rules",
    ],
    strugglesWhen: [
      "work is purely operational or clerical",
      "authority exists without accountability or consequence",
      "chaos replaces strategy or outcomes lack ownership",
    ],
    valuesOftenInclude: [
      "leverage",
      "decision-making authority",
      "long-term impact",
      "status through responsibility",
      "strategic clarity",
    ],
  },
},

  manufacturing_industrial: {
    id: "manufacturing_industrial",
    label: "Manufacturing & Industrial Operations",
    description:
      "Careers centered on producing physical goods at scale through repeatable, disciplined processes. This world values reliability, efficiency, and incremental optimization within tightly constrained physical and operational systems.",

    /* =========================
     PSYCHOLOGICAL FOUNDATIONS
     ========================= */

    // This world rewards practicality, consistency, and process adherence
    riasecProfile: {
      R: 3.8, // Strong hands-on, practical engagement with systems and machinery
      I: 1.8, // Applied problem-solving and troubleshooting
      A: 0.4, // Little room for creative deviation
      S: 0.8, // Limited interpersonal emphasis
      E: 0.8, // Low persuasion, low risk-taking
      C: 3.5, // Strong emphasis on procedure and standardization
    },

    // Temperament favors steadiness, discipline, and tolerance for repetition
    bigFiveProfile: {
      O: 2.0, // Novelty-seeking is not rewarded
      C: 4.2, // Critical for safety, quality, and consistency
      E: 2.2, // Task-focused, not socially driven
      A: 3.0, // Cooperative but not emotionally oriented
      N: 2.2, // Emotional steadiness under routine pressure
    },

    // Psychological mismatches
    riasecConflicts: {
      A: 2.0, // Artistic personalities feel constrained
      E: 2.0, // Competitive, upside-seeking personalities feel capped
    },

    /* =========================
     ENVIRONMENT & TRADEOFFS
     ========================= */

    environment: {
      structure: "high",
      ambiguity: "low",
      competitiveness: "low",
      socialIntensity: "low",
      pressure: "medium",
    },

    rewards: {
      incomePotential: "medium",
      statusPrestige: "low",
      autonomy: "low_medium",
      impact: "medium_high", // Tangible, real-world output
      stability: "high",
    },

    stressors: {
      burnoutRisk: "medium",
      emotionalLoad: "low",
      workLifeImbalance: "medium",
    },

    /* =========================
     ORIENTATION & EXPLORATION
     ========================= */

    pathways: [
      "Manufacturing Operations",
      "Production Management",
      "Quality Control & Assurance",
      "Industrial Supervision",
      "Process Optimization",
    ],

    narrativeHooks: {
      thrivesWhen: [
        "work is tangible and outcomes are physically observable",
        "processes are standardized and repeatable",
        "improvements are incremental and measurable",
      ],
      strugglesWhen: [
        "work lacks physical or concrete output",
        "rules and safety procedures are loosely enforced",
        "success depends on persuasion or creativity rather than execution",
      ],
      valuesOftenInclude: [
        "reliability",
        "consistency",
        "practical competence",
        "producing something real",
      ],
    },
  },

  logistics_supply_chain: {
    id: "logistics_supply_chain",
    label: "Logistics & Supply Chain",
    description:
      "Careers centered on coordinating the movement of goods, information, and resources across complex systems. This world rewards foresight, prioritization, and the ability to manage uncertainty across time, distance, and multiple stakeholders.",

    /* =========================
     PSYCHOLOGICAL FOUNDATIONS
     ========================= */

    // This world blends structure with situational problem-solving
    riasecProfile: {
      R: 2.5, // Practical engagement with real-world constraints
      I: 2.2, // Planning, forecasting, and problem-solving
      A: 0.5, // Little emphasis on creativity
      S: 1.8, // Coordination across teams and vendors
      E: 1.2, // Some negotiation, low dominance
      C: 3.5, // Strong reliance on systems, schedules, and rules
    },

    // Temperament favors composure, planning, and tolerance for disruption
    bigFiveProfile: {
      O: 2.5, // Some adaptability required, but not novelty-seeking
      C: 4.2, // Critical for reliability and follow-through
      E: 2.8, // Functional communication, not performative
      A: 3.2, // Cooperation across parties matters
      N: 2.5, // Must remain calm under time pressure
    },

    // Common psychological mismatches
    riasecConflicts: {
      A: 2.0, // Artistic personalities feel constrained
      E: 1.8, // Highly competitive personalities feel bottlenecked
    },

    /* =========================
     ENVIRONMENT & TRADEOFFS
     ========================= */

    environment: {
      structure: "high",
      ambiguity: "medium",
      competitiveness: "low_medium",
      socialIntensity: "medium",
      pressure: "medium_high",
    },

    rewards: {
      incomePotential: "medium",
      statusPrestige: "low",
      autonomy: "medium",
      impact: "high", // Disruptions have real downstream effects
      stability: "medium_high",
    },

    stressors: {
      burnoutRisk: "medium_high",
      emotionalLoad: "low",
      workLifeImbalance: "medium",
    },

    /* =========================
     ORIENTATION & EXPLORATION
     ========================= */

    pathways: [
      "Supply Chain Planning",
      "Logistics Coordination",
      "Procurement & Sourcing",
      "Inventory Management",
      "Distribution Operations",
    ],

    narrativeHooks: {
      thrivesWhen: [
        "multiple moving parts must be coordinated efficiently",
        "problems are time-sensitive and practical",
        "systems thinking matters more than individual brilliance",
      ],
      strugglesWhen: [
        "work is slow-moving or overly abstract",
        "there is little consequence for delays or errors",
        "roles lack real-world urgency or accountability",
      ],
      valuesOftenInclude: [
        "reliability under pressure",
        "keeping systems flowing",
        "anticipating problems before they occur",
        "practical problem-solving",
      ],
    },
  },

  // Competitive / High-Upside Worlds
  entrepreneurship_startups: {
    id: "entrepreneurship_startups",
    label: "Entrepreneurship & Startups",
    description:
      "Careers centered on creating and scaling value under extreme uncertainty. This world rewards initiative, risk tolerance, persuasion, and the ability to operate without clear rules, guarantees, or stable structures.",

    /* =========================
     PSYCHOLOGICAL FOUNDATIONS
     ========================= */

    // This world rewards agency, persuasion, and comfort with ambiguity
    riasecProfile: {
      R: 1.2, // Some practical engagement, but not hands-on craft
      I: 2.5, // Strategic problem-solving and hypothesis testing
      A: 2.0, // Creativity in framing problems and solutions
      S: 2.2, // Relationship-building and influence
      E: 4.5, // Dominant driver: initiative, persuasion, risk
      C: 0.8, // Low tolerance for rigid rules and procedures
    },

    // Temperamentally demanding: energy, resilience, and emotional volatility tolerance
    bigFiveProfile: {
      O: 4.2, // Strong appetite for novelty and experimentation
      C: 3.5, // Necessary, but flexible rather than rigid
      E: 3.8, // Comfort asserting ideas and selling visions
      A: 2.5, // Willingness to push, disagree, and negotiate
      N: 2.8, // Must tolerate stress, rejection, and uncertainty
    },

    // Psychological mismatches
    riasecConflicts: {
      C: 3.0, // Strongly conventional personalities feel lost
      R: 2.0, // Hands-on, routine-oriented individuals feel ungrounded
    },

    /* =========================
     ENVIRONMENT & TRADEOFFS
     ========================= */

    environment: {
      structure: "very_low",
      ambiguity: "very_high",
      competitiveness: "high",
      socialIntensity: "high",
      pressure: "high",
    },

    rewards: {
      incomePotential: "very_high",
      statusPrestige: "high",
      autonomy: "very_high",
      impact: "very_high",
      stability: "very_low",
    },

    stressors: {
      burnoutRisk: "high",
      emotionalLoad: "high",
      workLifeImbalance: "high",
    },

    /* =========================
     ORIENTATION & EXPLORATION
     ========================= */

    pathways: [
      "Startup Founding",
      "Early-Stage Venture Building",
      "Small Business Ownership",
      "Venture Creation",
      "Independent Commercial Ventures",
    ],

    narrativeHooks: {
      thrivesWhen: [
        "rules are minimal and initiative is rewarded",
        "outcomes depend on personal drive and judgment",
        "risk, uncertainty, and rapid change are constant",
      ],
      strugglesWhen: [
        "roles are tightly defined and authority is rigid",
        "failure is punished rather than learned from",
        "progress depends on approval rather than action",
      ],
      valuesOftenInclude: [
        "autonomy",
        "upside asymmetry",
        "ownership",
        "building something from nothing",
      ],
    },
  },
  high_finance_investing: {
    id: "high_finance_investing",
    label: "High Finance & Investing",
    description:
      "Careers centered on allocating capital, pricing risk, and competing in high-stakes financial environments. This world rewards analytical rigor, performance under pressure, and disciplined decision-making within competitive, rule-bound systems.",

    /* =========================
     PSYCHOLOGICAL FOUNDATIONS
     ========================= */

    // This world blends competitiveness with analytical discipline
    riasecProfile: {
      R: 0.6, // Minimal physical or hands-on engagement
      I: 3.8, // Core driver: analysis, modeling, probabilistic thinking
      A: 0.6, // Creativity is constrained and instrumental
      S: 1.2, // Limited interpersonal emphasis
      E: 3.8, // Strong competition, persuasion, ambition
      C: 2.8, // Rules matter, but are navigated strategically
    },

    // Temperament favors intensity, focus, and emotional containment
    bigFiveProfile: {
      O: 3.0, // Abstract thinking helps, novelty-seeking does not
      C: 4.2, // Precision and discipline are mandatory
      E: 2.8, // Can perform socially, not socially driven
      A: 2.3, // Competitive environments reward assertiveness
      N: 2.5, // Must tolerate volatility and pressure
    },

    // Psychological mismatches
    riasecConflicts: {
      S: 2.0, // Care-oriented personalities feel alienated
      R: 2.0, // Hands-on, concrete workers feel abstracted
    },

    /* =========================
     ENVIRONMENT & TRADEOFFS
     ========================= */

    environment: {
      structure: "medium_high",
      ambiguity: "medium_high",
      competitiveness: "very_high",
      socialIntensity: "low_medium",
      pressure: "very_high",
    },

    rewards: {
      incomePotential: "very_high",
      statusPrestige: "high",
      autonomy: "medium",
      impact: "high",
      stability: "low_medium",
    },

    stressors: {
      burnoutRisk: "high",
      emotionalLoad: "medium_high",
      workLifeImbalance: "high",
    },

    /* =========================
     ORIENTATION & EXPLORATION
     ========================= */

    pathways: [
      "Investment Banking",
      "Asset Management",
      "Hedge Funds",
      "Private Equity",
      "Institutional Investing",
    ],

    narrativeHooks: {
      thrivesWhen: [
        "performance is measured objectively and frequently",
        "competition is explicit and intense",
        "decisions have asymmetric upside and downside",
      ],
      strugglesWhen: [
        "outcomes are slow or loosely measured",
        "work emphasizes care, service, or consensus",
        "rules are either rigidly bureaucratic or entirely absent",
      ],
      valuesOftenInclude: [
        "meritocratic competition",
        "financial upside",
        "status through performance",
        "intellectual dominance under pressure",
      ],
    },
  },
  sales_revenue: {
    id: "sales_revenue",
    label: "Sales & Revenue",
    description:
      "Careers centered on persuading others, building trust quickly, and converting relationships into measurable outcomes. This world rewards social intuition, resilience to rejection, and the ability to influence decisions under pressure.",

    /* =========================
     PSYCHOLOGICAL FOUNDATIONS
     ========================= */

    // This world is driven by influence, persuasion, and momentum
    riasecProfile: {
      R: 0.8, // Minimal hands-on or mechanical engagement
      I: 1.5, // Some strategic thinking, but not deeply analytical
      A: 1.5, // Creativity in messaging and framing
      S: 3.8, // Core driver: social interaction and relationship-building
      E: 4.5, // Dominant: persuasion, initiative, competition
      C: 1.2, // Low tolerance for rigid rules
    },

    // Temperament favors energy, optimism, and emotional resilience
    bigFiveProfile: {
      O: 3.2, // Adaptable in messaging and approach
      C: 3.5, // Important, but flexible
      E: 4.2, // Strong comfort initiating interaction
      A: 3.2, // Warmth helps, but assertiveness matters
      N: 3.0, // Must tolerate rejection and volatility
    },

    // Psychological mismatches
    riasecConflicts: {
      C: 2.5, // Highly conventional personalities feel constrained
      I: 2.0, // Deeply analytical personalities feel underutilized
    },

    /* =========================
     ENVIRONMENT & TRADEOFFS
     ========================= */

    environment: {
      structure: "low",
      ambiguity: "high",
      competitiveness: "high",
      socialIntensity: "very_high",
      pressure: "high",
    },

    rewards: {
      incomePotential: "high",
      statusPrestige: "medium",
      autonomy: "medium_high",
      impact: "high",
      stability: "low_medium",
    },

    stressors: {
      burnoutRisk: "high",
      emotionalLoad: "medium_high",
      workLifeImbalance: "medium_high",
    },

    /* =========================
     ORIENTATION & EXPLORATION
     ========================= */

    pathways: [
      "Business Development",
      "Enterprise Sales",
      "Account Management",
      "Client Partnerships",
      "Revenue Operations",
    ],

    narrativeHooks: {
      thrivesWhen: [
        "success depends on personal influence and energy",
        "goals are clear but paths to them are flexible",
        "competition is visible and rewards are immediate",
      ],
      strugglesWhen: [
        "work is solitary or purely analytical",
        "outcomes are slow or detached from effort",
        "rules and scripts remove personal agency",
      ],
      valuesOftenInclude: [
        "momentum",
        "recognition",
        "winning",
        "relationship-driven success",
      ],
    },
  },

  // Analytical / Abstract Worlds
  law_legal_reasoning: {
    id: "law_legal_reasoning",
    label: "Law & Legal Reasoning",
    description:
      "Careers centered on interpreting, applying, and arguing within formal rule systems. This world rewards precision in reasoning, comfort with adversarial conflict, and the ability to operate under strict procedural constraints.",

    /* =========================
     PSYCHOLOGICAL FOUNDATIONS
     ========================= */

    // This world rewards abstract reasoning, verbal precision, and rule mastery
    riasecProfile: {
      R: 0.4, // Little physical or hands-on engagement
      I: 4.2, // Core driver: analytical and logical reasoning
      A: 0.6, // Creativity is tightly constrained by precedent
      S: 1.6, // Social interaction exists, but is instrumental
      E: 3.4, // Advocacy, persuasion, and competitive positioning
      C: 3.8, // Strong reliance on formal rules and procedures
    },

    // Temperament favors discipline, resilience, and tolerance for conflict
    bigFiveProfile: {
      O: 3.2, // Abstract thinking helps, novelty-seeking does not
      C: 4.3, // Precision, preparation, and follow-through are critical
      E: 2.8, // Can argue forcefully without being socially driven
      A: 2.2, // Low agreeableness helps in adversarial contexts
      N: 2.5, // Must tolerate pressure, conflict, and scrutiny
    },

    // Psychological mismatches
    riasecConflicts: {
      S: 2.0, // Care-oriented personalities struggle with adversarial dynamics
      R: 2.0, // Hands-on, concrete workers feel abstracted
    },

    /* =========================
     ENVIRONMENT & TRADEOFFS
     ========================= */

    environment: {
      structure: "very_high",
      ambiguity: "medium",
      competitiveness: "high",
      socialIntensity: "medium",
      pressure: "high",
    },

    rewards: {
      incomePotential: "high",
      statusPrestige: "high",
      autonomy: "medium",
      impact: "medium_high",
      stability: "medium_high",
    },

    stressors: {
      burnoutRisk: "high",
      emotionalLoad: "medium",
      workLifeImbalance: "high",
    },

    /* =========================
     ORIENTATION & EXPLORATION
     ========================= */

    pathways: [
      "Legal Practice",
      "Litigation & Advocacy",
      "Corporate Law",
      "Regulatory Law",
      "Judicial & Advisory Roles",
    ],

    narrativeHooks: {
      thrivesWhen: [
        "arguments must be precise and defensible",
        "rules and precedent govern outcomes",
        "intellectual conflict is explicit and structured",
      ],
      strugglesWhen: [
        "outcomes depend on emotional consensus",
        "rules are vague or inconsistently applied",
        "work lacks intellectual rigor or adversarial edge",
      ],
      valuesOftenInclude: [
        "intellectual precision",
        "fairness through procedure",
        "status through expertise",
        "winning arguments on their merits",
      ],
    },
  },
  policy_government_regulation: {
    id: "policy_government_regulation",
    label: "Policy, Government & Regulation",
    description:
      "Careers centered on designing, evaluating, and implementing rules that govern large systems over long time horizons. This world rewards systems thinking, procedural legitimacy, and the ability to balance competing interests under public accountability.",

    /* =========================
     PSYCHOLOGICAL FOUNDATIONS
     ========================= */

    // This world blends analysis with coordination and procedural discipline
    riasecProfile: {
      R: 0.4, // Minimal physical engagement
      I: 3.8, // Core driver: analysis, evaluation, systems reasoning
      A: 0.8, // Limited creativity within institutional constraints
      S: 3.0, // Stakeholder coordination and public-facing interaction
      E: 1.8, // Influence exists, but is consensus-oriented, not dominant
      C: 3.8, // Strong emphasis on process, legitimacy, and rules
    },

    // Temperament favors patience, steadiness, and tolerance for slow progress
    bigFiveProfile: {
      O: 3.2, // Abstract and systemic thinking helps
      C: 4.2, // Procedure, documentation, and follow-through matter
      E: 2.8, // Functional communication, not performative
      A: 3.8, // Cooperation and compromise are essential
      N: 2.2, // Emotional steadiness under public scrutiny
    },

    // Psychological mismatches
    riasecConflicts: {
      E: 2.2, // High dominance / urgency clashes with slow processes
      A: 1.8, // Strong creative drive feels constrained
    },

    /* =========================
     ENVIRONMENT & TRADEOFFS
     ========================= */

    environment: {
      structure: "very_high",
      ambiguity: "medium",
      competitiveness: "low_medium",
      socialIntensity: "medium_high",
      pressure: "medium",
    },

    rewards: {
      incomePotential: "medium",
      statusPrestige: "medium",
      autonomy: "low_medium",
      impact: "high", // Broad, societal impact over time
      stability: "very_high",
    },

    stressors: {
      burnoutRisk: "medium",
      emotionalLoad: "medium",
      workLifeImbalance: "low_medium",
    },

    /* =========================
     ORIENTATION & EXPLORATION
     ========================= */

    pathways: [
      "Public Policy Analysis",
      "Regulatory Affairs",
      "Government Administration",
      "International Relations",
      "Public Sector Strategy",
    ],

    narrativeHooks: {
      thrivesWhen: [
        "decisions require balancing competing interests",
        "legitimacy and process matter as much as outcomes",
        "work operates on long time horizons with public accountability",
      ],
      strugglesWhen: [
        "progress must be fast or individually controlled",
        "success depends on aggressive persuasion or risk-taking",
        "rules are informal or weakly enforced",
      ],
      valuesOftenInclude: [
        "institutional legitimacy",
        "fairness through process",
        "long-term societal impact",
        "stability and continuity",
      ],
    },
  },
  academic_theoretical_research: {
    id: "academic_theoretical_research",
    label: "Academic, Theoretical & Research",
    description:
      "Careers centered on advancing knowledge through deep analysis, abstraction, and long-horizon inquiry. This world rewards intellectual rigor, curiosity-driven exploration, and comfort working without immediate practical or commercial outcomes.",

    /* =========================
     PSYCHOLOGICAL FOUNDATIONS
     ========================= */

    // This world maximizes abstraction and minimizes persuasion
    riasecProfile: {
      R: 0.3, // Minimal physical engagement
      I: 4.8, // Dominant driver: abstract reasoning and inquiry
      A: 2.2, // Creativity expressed through ideas and frameworks
      S: 1.0, // Limited social emphasis
      E: 0.6, // Very low persuasion, competition, or dominance
      C: 2.2, // Some structure, but flexible and self-directed
    },

    // Temperament favors curiosity, autonomy, and tolerance for ambiguity
    bigFiveProfile: {
      O: 4.8, // Essential: curiosity and abstraction
      C: 3.8, // Required for sustained independent work
      E: 1.8, // Comfort with solitude
      A: 3.0, // Collegial but not consensus-driven
      N: 2.5, // Must tolerate uncertainty and slow feedback
    },

    // Psychological mismatches
    riasecConflicts: {
      E: 2.5, // Competitive, outcome-driven personalities feel stalled
      S: 2.0, // Care-oriented personalities feel disconnected
    },

    /* =========================
     ENVIRONMENT & TRADEOFFS
     ========================= */

    environment: {
      structure: "medium",
      ambiguity: "high",
      competitiveness: "medium",
      socialIntensity: "low",
      pressure: "medium",
    },

    rewards: {
      incomePotential: "low_medium",
      statusPrestige: "medium",
      autonomy: "high",
      impact: "medium_high", // Long-term, knowledge-driven impact
      stability: "medium",
    },

    stressors: {
      burnoutRisk: "medium",
      emotionalLoad: "low",
      workLifeImbalance: "medium",
    },

    /* =========================
     ORIENTATION & EXPLORATION
     ========================= */

    pathways: [
      "Academic Research",
      "Theoretical Science",
      "Scholarly Publishing",
      "Think Tanks",
      "Advanced Study & Fellowship",
    ],

    narrativeHooks: {
      thrivesWhen: [
        "questions are open-ended and intellectually demanding",
        "progress is measured in insight rather than output",
        "work allows long periods of independent thought",
      ],
      strugglesWhen: [
        "success is tied to short-term metrics or revenue",
        "work requires frequent persuasion or selling",
        "outcomes must be immediately practical",
      ],
      valuesOftenInclude: [
        "truth-seeking",
        "intellectual freedom",
        "depth over speed",
        "conceptual clarity",
      ],
    },
  },

  // Technical / Problem-Solving Worlds
  applied_engineering: {
    id: "applied_engineering",
    label: "Applied Engineering",
    description:
      "Careers centered on designing, building, and improving practical systems under real-world constraints. This world rewards technical problem-solving, precision, and responsibility for outcomes that must function reliably in physical or operational environments.",

    /* =========================
     PSYCHOLOGICAL FOUNDATIONS
     ========================= */

    // This world blends analysis with concrete implementation
    riasecProfile: {
      R: 3.2, // Strong engagement with physical or operational systems
      I: 3.8, // Core driver: analytical problem-solving
      A: 0.8, // Limited creativity, tightly constrained by requirements
      S: 0.8, // Low social emphasis
      E: 0.6, // Minimal persuasion or risk-seeking
      C: 3.2, // Strong need for standards, specs, and reliability
    },

    // Temperament favors focus, discipline, and tolerance for responsibility
    bigFiveProfile: {
      O: 3.0, // Conceptual thinking helps, novelty-seeking does not
      C: 4.3, // Precision and follow-through are critical
      E: 2.0, // Comfortable working independently
      A: 3.0, // Cooperative but not people-driven
      N: 2.2, // Emotional steadiness under technical pressure
    },

    // Psychological mismatches
    riasecConflicts: {
      E: 2.5, // High dominance / persuasion drives feel wasted
      A: 1.8, // Strong artistic personalities feel constrained
    },

    /* =========================
     ENVIRONMENT & TRADEOFFS
     ========================= */

    environment: {
      structure: "high",
      ambiguity: "medium",
      competitiveness: "low_medium",
      socialIntensity: "low",
      pressure: "medium_high",
    },

    rewards: {
      incomePotential: "high",
      statusPrestige: "medium",
      autonomy: "medium",
      impact: "high", // Failures and successes are concrete
      stability: "medium_high",
    },

    stressors: {
      burnoutRisk: "medium",
      emotionalLoad: "low",
      workLifeImbalance: "medium",
    },

    /* =========================
     ORIENTATION & EXPLORATION
     ========================= */

    pathways: [
      "Mechanical Engineering",
      "Electrical Engineering",
      "Civil & Structural Engineering",
      "Systems Engineering",
      "Industrial Engineering",
    ],

    narrativeHooks: {
      thrivesWhen: [
        "problems are technical, concrete, and solvable",
        "constraints are clear and meaningful",
        "responsibility for outcomes is explicit",
      ],
      strugglesWhen: [
        "work is purely theoretical or abstract",
        "success depends on persuasion rather than correctness",
        "standards and specifications are weak or ignored",
      ],
      valuesOftenInclude: [
        "technical competence",
        "reliability",
        "precision",
        "making things work",
      ],
    },
  },
  software_technology: {
  id: "software_technology",
  label: "Software & Technology",
  description:
    "Careers centered on designing, building, and evolving digital systems through abstract problem-solving and rapid iteration. This world rewards logical thinking, autonomy, and the ability to work productively in fast-changing, loosely structured environments.",

  /* =========================
     PSYCHOLOGICAL FOUNDATIONS
     ========================= */

  // This world prioritizes abstraction, logic, and iterative problem-solving
  riasecProfile: {
    R: 0.6, // Minimal physical engagement
    I: 4.2, // Core driver: analytical and systems thinking
    A: 1.6, // Creativity expressed through design and architecture
    S: 1.0, // Limited social emphasis
    E: 1.2, // Low persuasion, moderate ownership
    C: 2.2, // Some structure, but flexible and evolving
  },

  // Temperament favors autonomy, focus, and tolerance for ambiguity
  bigFiveProfile: {
    O: 4.0,          // Curiosity and abstract thinking are major advantages
    C: 3.8, // Needed to ship and maintain systems
    E: 2.0,      // Comfort working independently
    A: 3.0,     // Cooperative, but not people-driven
    N: 2.5,       // Emotional steadiness amid rapid feedback
  },

  // Psychological mismatches
  riasecConflicts: {
    S: 2.0, // Highly people-oriented personalities feel isolated
    C: 1.8, // Rigid rule-followers feel frustrated by fluid standards
  },

  /* =========================
     ENVIRONMENT & TRADEOFFS
     ========================= */

  environment: {
    structure: "medium",
    ambiguity: "high",
    competitiveness: "medium",
    socialIntensity: "low_medium",
    pressure: "medium",
  },

  rewards: {
    incomePotential: "high",
    statusPrestige: "medium",
    autonomy: "high",
    impact: "high",
    stability: "medium",
  },

  stressors: {
    burnoutRisk: "medium",
    emotionalLoad: "low_medium",
    workLifeImbalance: "medium",
  },

  /* =========================
     ORIENTATION & EXPLORATION
     ========================= */

  pathways: [
    "Software Engineering",
    "Backend & Systems Development",
    "Product Engineering",
    "Platform & Infrastructure",
    "Technical Architecture",
  ],

  narrativeHooks: {
    thrivesWhen: [
      "problems are abstract and logically decomposable",
      "feedback loops are fast and measurable",
      "autonomy and mastery are rewarded over hierarchy",
    ],
    strugglesWhen: [
      "work is heavily bureaucratic or rule-bound",
      "success depends on constant social engagement",
      "progress is slow or obscured by politics",
    ],
    valuesOftenInclude: [
      "autonomy",
      "mastery",
      "elegant solutions",
      "continuous improvement",
    ],
  },
},
  scientific_lab_research: {
  id: "scientific_lab_research",
  label: "Scientific & Lab Research",
  description:
    "Careers centered on empirical investigation through controlled experimentation and measurement. This world rewards methodological rigor, patience, and the ability to work carefully with uncertainty, incomplete information, and slow feedback loops.",

  /* =========================
     PSYCHOLOGICAL FOUNDATIONS
     ========================= */

  // This world balances abstraction with hands-on experimentation
  riasecProfile: {
    R: 2.8, // Hands-on interaction with instruments, samples, and protocols
    I: 4.2, // Core driver: hypothesis testing and analysis
    A: 1.2, // Creativity expressed in experimental design
    S: 1.0, // Limited social emphasis
    E: 0.6, // Very low persuasion or dominance
    C: 3.2, // Strong adherence to protocols and standards
  },

  // Temperament favors patience, precision, and tolerance for uncertainty
  bigFiveProfile: {
    O: 4.0,          // Curiosity and exploratory thinking are essential
    C: 4.2, // Precision, documentation, and repeatability matter
    E: 1.8,      // Comfort with solitary, focused work
    A: 3.0,     // Cooperative, but not socially driven
    N: 2.4,       // Must tolerate ambiguity and delayed results
  },

  // Psychological mismatches
  riasecConflicts: {
    E: 2.5, // Competitive, outcome-driven personalities feel stalled
    S: 2.0, // Care-oriented personalities feel underutilized
  },

  /* =========================
     ENVIRONMENT & TRADEOFFS
     ========================= */

  environment: {
    structure: "high",
    ambiguity: "high",
    competitiveness: "medium",
    socialIntensity: "low",
    pressure: "medium",
  },

  rewards: {
    incomePotential: "low_medium",
    statusPrestige: "medium",
    autonomy: "medium",
    impact: "medium_high",
    stability: "medium",
  },

  stressors: {
    burnoutRisk: "medium",
    emotionalLoad: "low",
    workLifeImbalance: "medium",
  },

  /* =========================
     ORIENTATION & EXPLORATION
     ========================= */

  pathways: [
    "Laboratory Research",
    "Experimental Science",
    "Applied Scientific Research",
    "Research & Development",
    "Clinical & Translational Research",
  ],

  narrativeHooks: {
    thrivesWhen: [
      "questions must be tested empirically rather than debated abstractly",
      "precision and repeatability matter more than speed",
      "progress is slow but intellectually meaningful",
    ],
    strugglesWhen: [
      "results must be immediate or commercially driven",
      "work lacks methodological rigor",
      "success depends on persuasion rather than evidence",
    ],
    valuesOftenInclude: [
      "empirical truth",
      "methodological rigor",
      "careful experimentation",
      "evidence over opinion",
    ],
  },
},

  // Human-Centric Care Worlds
  clinical_healthcare: {
  id: "clinical_healthcare",
  label: "Clinical Healthcare",
  description:
    "Careers centered on diagnosing, treating, and caring for patients in high-responsibility environments. This world rewards emotional steadiness, procedural discipline, and the ability to make accurate decisions under pressure with direct human consequences.",

  /* =========================
     PSYCHOLOGICAL FOUNDATIONS
     ========================= */

  // This world blends human care with technical precision
  riasecProfile: {
    R: 2.0, // Hands-on interaction with patients and equipment
    I: 3.2, // Diagnostic reasoning and applied knowledge
    A: 0.6, // Minimal creative expression
    S: 4.2, // Core driver: patient interaction and care
    E: 1.2, // Limited persuasion, low dominance
    C: 3.8, // Strong adherence to protocols and standards
  },

  // Temperament favors steadiness, responsibility, and emotional regulation
  bigFiveProfile: {
    O: 2.8,          // Adaptability helps, novelty-seeking does not
    C: 4.6, // Non-negotiable: precision and reliability
    E: 2.8,      // Functional interpersonal engagement
    A: 4.0,     // Empathy and cooperation are essential
    N: 2.0,       // Emotional stability under stress is critical
  },

  // Psychological mismatches
  riasecConflicts: {
    E: 2.2, // Competitive, dominance-driven personalities struggle
    A: 1.8, // Strong creative drive feels constrained
  },

  /* =========================
     ENVIRONMENT & TRADEOFFS
     ========================= */

  environment: {
    structure: "very_high",
    ambiguity: "medium",
    competitiveness: "low_medium",
    socialIntensity: "very_high",
    pressure: "very_high",
  },

  rewards: {
    incomePotential: "high",
    statusPrestige: "high",
    autonomy: "medium",
    impact: "very_high",
    stability: "high",
  },

  stressors: {
    burnoutRisk: "high",
    emotionalLoad: "very_high",
    workLifeImbalance: "high",
  },

  /* =========================
     ORIENTATION & EXPLORATION
     ========================= */

  pathways: [
    "Medicine",
    "Nursing",
    "Allied Health",
    "Clinical Specialties",
    "Patient Care Services",
  ],

  narrativeHooks: {
    thrivesWhen: [
      "decisions carry real human responsibility",
      "protocols provide clarity under pressure",
      "helping individuals produces tangible outcomes",
    ],
    strugglesWhen: [
      "emotional labor is constant and unavoidable",
      "mistakes carry serious consequences",
      "work lacks clear procedural guidance",
    ],
    valuesOftenInclude: [
      "responsibility",
      "service",
      "competence under pressure",
      "helping people directly",
    ],
  },
},
  mental_health_counseling: {
  id: "mental_health_counseling",
  label: "Mental Health & Counseling",
  description:
    "Careers centered on supporting psychological well-being through sustained interpersonal engagement. This world rewards empathy, emotional attunement, patience, and the ability to hold space for others without immediate resolution.",

  /* =========================
     PSYCHOLOGICAL FOUNDATIONS
     ========================= */

  // This world is driven by relational depth and emotional understanding
  riasecProfile: {
    R: 0.6, // Minimal physical or technical engagement
    I: 2.2, // Some analytical framing, but not diagnostic-heavy
    A: 1.6, // Interpretive and reflective thinking
    S: 4.8, // Dominant driver: sustained social and emotional interaction
    E: 0.8, // Very low dominance or persuasion
    C: 2.2, // Some structure, but flexibility is essential
  },

  // Temperament demands emotional intelligence and self-regulation
  bigFiveProfile: {
    O: 3.8,          // Openness to inner experience and nuance
    C: 3.8, // Professional boundaries and consistency matter
    E: 2.5,      // Comfort with one-on-one interaction
    A: 4.6,     // Empathy and warmth are core
    N: 2.8,       // Must manage emotional exposure without collapse
  },

  // Psychological mismatches
  riasecConflicts: {
    E: 2.5, // Competitive, outcome-driven personalities feel constrained
    R: 2.0, // Hands-on, task-oriented personalities feel disengaged
  },

  /* =========================
     ENVIRONMENT & TRADEOFFS
     ========================= */

  environment: {
    structure: "medium",
    ambiguity: "high",
    competitiveness: "very_low",
    socialIntensity: "very_high",
    pressure: "medium",
  },

  rewards: {
    incomePotential: "low_medium",
    statusPrestige: "medium",
    autonomy: "medium",
    impact: "high",
    stability: "medium",
  },

  stressors: {
    burnoutRisk: "high",
    emotionalLoad: "very_high",
    workLifeImbalance: "medium",
  },

  /* =========================
     ORIENTATION & EXPLORATION
     ========================= */

  pathways: [
    "Counseling & Therapy",
    "Psychological Services",
    "Mental Health Support",
    "Clinical Counseling",
    "Behavioral Health",
  ],

  narrativeHooks: {
    thrivesWhen: [
      "progress unfolds slowly through trust and reflection",
      "emotional depth is valued over speed or certainty",
      "work involves sustained one-on-one engagement",
    ],
    strugglesWhen: [
      "outcomes must be fast or measurable",
      "work requires emotional detachment",
      "success depends on competition or persuasion",
    ],
    valuesOftenInclude: [
      "empathy",
      "presence",
      "healing over fixing",
      "supporting inner change",
    ],
  },
},
  education_training: {
  id: "education_training",
  label: "Education & Training",
  description:
    "Careers centered on teaching, explaining, and developing others through structured learning environments. This world rewards clarity of thought, patience, and the ability to translate complex ideas into accessible understanding over time.",

  /* =========================
     PSYCHOLOGICAL FOUNDATIONS
     ========================= */

  // Education blends social engagement with structure and explanation
  riasecProfile: {
    R: 0.8, // Minimal hands-on or mechanical work
    I: 3.4, // Strong intellectual engagement and explanation
    A: 1.8, // Some creativity in communication and teaching style
    S: 4.2, // Core driver: working with and developing people
    E: 1.6, // Limited authority, low persuasion
    C: 3.2, // Structure, curriculum, and consistency matter
  },

  // Temperament favors patience, clarity, and emotional steadiness
  bigFiveProfile: {
    O: 3.6,          // Comfort with ideas and abstract concepts
    C: 4.2, // Reliability and preparation are essential
    E: 3.2,      // Sustained group interaction
    A: 4.0,     // Cooperation and encouragement matter
    N: 2.6,       // Emotional regulation under repetition and friction
  },

  // Psychological mismatches
  riasecConflicts: {
    E: 2.2, // Highly competitive or dominance-driven personalities struggle
    R: 1.8, // Hands-on, action-first personalities feel constrained
  },

  /* =========================
     ENVIRONMENT & TRADEOFFS
     ========================= */

  environment: {
    structure: "high",
    ambiguity: "medium",
    competitiveness: "low",
    socialIntensity: "high",
    pressure: "medium",
  },

  rewards: {
    incomePotential: "low_medium",
    statusPrestige: "medium",
    autonomy: "medium",
    impact: "high",
    stability: "high",
  },

  stressors: {
    burnoutRisk: "medium_high",
    emotionalLoad: "medium",
    workLifeImbalance: "medium",
  },

  /* =========================
     ORIENTATION & EXPLORATION
     ========================= */

  pathways: [
    "Primary & Secondary Education",
    "Higher Education",
    "Corporate Training",
    "Instructional Design",
    "Educational Administration",
  ],

  narrativeHooks: {
    thrivesWhen: [
      "explaining ideas brings satisfaction",
      "progress is measured over months or years",
      "work follows predictable rhythms and structures",
    ],
    strugglesWhen: [
      "outcomes must be immediate",
      "authority is constantly challenged without support",
      "work lacks intellectual engagement",
    ],
    valuesOftenInclude: [
      "clarity",
      "development",
      "fairness",
      "long-term influence",
    ],
  },
},
  human_social_services: {
  id: "human_social_services",
  label: "Human & Social Services",
  description:
    "Careers centered on supporting individuals and communities through social systems, advocacy, and practical assistance. This world rewards empathy, resilience, and the ability to operate within imperfect institutions to help people meet basic needs.",

  /* =========================
     PSYCHOLOGICAL FOUNDATIONS
     ========================= */

  // This world is service-oriented, pragmatic, and system-facing
  riasecProfile: {
    R: 1.2, // Some hands-on, real-world interaction
    I: 1.8, // Limited abstract analysis
    A: 0.8, // Minimal creative expression
    S: 4.6, // Dominant driver: helping and supporting people
    E: 1.0, // Very low persuasion or dominance
    C: 3.6, // Heavy interaction with rules, forms, and systems
  },

  // Temperament favors empathy, endurance, and emotional regulation
  bigFiveProfile: {
    O: 2.8,          // Practical focus over abstraction
    C: 4.2, // Reliability and follow-through are critical
    E: 2.8,      // Sustained interpersonal engagement
    A: 4.8,     // Compassion and patience are essential
    N: 3.0,       // Must tolerate chronic stress without burnout
  },

  // Psychological mismatches
  riasecConflicts: {
    E: 2.6, // Competitive, status-driven personalities burn out quickly
    A: 2.0, // Creativity-seeking personalities feel constrained
  },

  /* =========================
     ENVIRONMENT & TRADEOFFS
     ========================= */

  environment: {
    structure: "high",
    ambiguity: "high",
    competitiveness: "very_low",
    socialIntensity: "very_high",
    pressure: "medium_high",
  },

  rewards: {
    incomePotential: "low",
    statusPrestige: "low_medium",
    autonomy: "low_medium",
    impact: "high",
    stability: "medium",
  },

  stressors: {
    burnoutRisk: "very_high",
    emotionalLoad: "high",
    workLifeImbalance: "medium_high",
  },

  /* =========================
     ORIENTATION & EXPLORATION
     ========================= */

  pathways: [
    "Social Work",
    "Community Services",
    "Case Management",
    "Non-Profit Support",
    "Public Assistance Programs",
  ],

  narrativeHooks: {
    thrivesWhen: [
      "helping people navigate difficult systems feels meaningful",
      "work involves advocacy and practical problem-solving",
      "success is measured in stability rather than transformation",
    ],
    strugglesWhen: [
      "bureaucracy feels suffocating",
      "resources are limited and progress is slow",
      "emotional boundaries are hard to maintain",
    ],
    valuesOftenInclude: [
      "service",
      "justice",
      "compassion",
      "responsibility to community",
    ],
  },
},

  // Creative / Expressive Worlds
  creative_media: {
  id: "creative_media",
  label: "Creative Media",
  description:
    "Careers centered on producing original ideas, narratives, visuals, or experiences for an audience. This world rewards imagination, originality, and tolerance for ambiguity, while demanding emotional resilience in the face of subjective evaluation.",

  /* =========================
     PSYCHOLOGICAL FOUNDATIONS
     ========================= */

  // Creativity + exposure + uncertainty
  riasecProfile: {
    R: 0.6, // Minimal physical or mechanical work
    I: 2.2, // Conceptual thinking and idea development
    A: 4.8, // Core driver: creative expression
    S: 2.8, // Audience awareness and collaboration
    E: 1.4, // Limited persuasion; influence is indirect
    C: 1.2, // Low tolerance for rigid structure
  },

  // Temperament favors openness, identity strength, and emotional resilience
  bigFiveProfile: {
    O: 4.8,          // Non-negotiable: curiosity and imagination
    C: 3.0, // Discipline helps but varies widely
    E: 2.8,      // Comfort with visibility, not dominance
    A: 3.2,     // Too high can dilute creative voice
    N: 3.2,       // Must withstand rejection and uncertainty
  },

  // Psychological mismatches
  riasecConflicts: {
    C: 2.8, // Structure-seeking personalities feel lost
    E: 2.2, // Outcome-driven, status-focused personalities get frustrated
  },

  /* =========================
     ENVIRONMENT & TRADEOFFS
     ========================= */

  environment: {
    structure: "low",
    ambiguity: "very_high",
    competitiveness: "medium",
    socialIntensity: "medium",
    pressure: "high",
  },

  rewards: {
    incomePotential: "variable",
    statusPrestige: "medium",
    autonomy: "high",
    impact: "medium_high",
    stability: "low",
  },

  stressors: {
    burnoutRisk: "high",
    emotionalLoad: "medium_high",
    workLifeImbalance: "high",
  },

  /* =========================
     ORIENTATION & EXPLORATION
     ========================= */

  pathways: [
    "Film & Video Production",
    "Writing & Journalism",
    "Photography",
    "Music & Audio",
    "Digital Content Creation",
  ],

  narrativeHooks: {
    thrivesWhen: [
      "self-expression feels intrinsically rewarding",
      "feedback and criticism are tolerated without collapse",
      "identity is not fully dependent on external validation",
    ],
    strugglesWhen: [
      "structure and predictability are required",
      "success must be linear or guaranteed",
      "work is evaluated purely on objective metrics",
    ],
    valuesOftenInclude: [
      "expression",
      "authenticity",
      "originality",
      "creative autonomy",
    ],
  },
},
  marketing_brand_design: {
  id: "marketing_brand_design",
  label: "Marketing, Brand & Growth",
  description:
    "Careers focused on influencing attention, perception, and behavior at scale. This world blends creativity with commercial accountability, rewarding people who can translate ideas into measurable outcomes.",

  /* =========================
     PSYCHOLOGICAL FOUNDATIONS
     ========================= */

  // Persuasion + structure + creativity-with-purpose
  riasecProfile: {
    R: 0.6, // Minimal hands-on or mechanical work
    I: 2.6, // Analysis of markets, audiences, and performance data
    A: 3.4, // Creativity exists, but is constrained by goals
    S: 2.8, // Understanding people and group behavior
    E: 4.4, // Core driver: persuasion, influence, growth
    C: 3.6, // Metrics, funnels, systems, and repeatability
  },

  // Marketing rewards strategic thinking, adaptability, and execution
  bigFiveProfile: {
    O: 4.0,          // Needed for messaging and creative synthesis
    C: 4.0, // Campaign execution, testing, iteration
    E: 3.4,      // Comfort influencing others
    A: 3.2,     // Too high weakens persuasion
    N: 2.8,       // Must tolerate performance pressure
  },

  // Psychological friction points
  riasecConflicts: {
    R: 2.6, // Purely hands-on or physical workers feel misaligned
    A: 2.4, // Pure artists resent constraints and metrics
  },

  /* =========================
     ENVIRONMENT & TRADEOFFS
     ========================= */

  environment: {
    structure: "medium_high",
    ambiguity: "medium",
    competitiveness: "high",
    socialIntensity: "medium_high",
    pressure: "high",
  },

  rewards: {
    incomePotential: "medium_high",
    statusPrestige: "medium",
    autonomy: "medium",
    impact: "high",
    stability: "medium",
  },

  stressors: {
    burnoutRisk: "medium_high",
    emotionalLoad: "medium",
    workLifeImbalance: "medium",
  },

  /* =========================
     ORIENTATION & EXPLORATION
     ========================= */

  pathways: [
    "Digital Marketing",
    "Brand Strategy",
    "Growth & Performance Marketing",
    "Product Marketing",
    "Market Research & Consumer Insights",
  ],

  narrativeHooks: {
    thrivesWhen: [
      "creative ideas can be tied to measurable outcomes",
      "competition and performance tracking are motivating",
      "influence feels energizing rather than draining",
    ],
    strugglesWhen: [
      "creative freedom is the primary need",
      "feedback loops feel stressful rather than clarifying",
      "long-term ambiguity without metrics is required",
    ],
    valuesOftenInclude: [
      "impact",
      "growth",
      "persuasion",
      "results",
      "visibility",
    ],
  },
},

  // Action-Oriented / Physical Worlds
  public_safety_emergency: {
  id: "public_safety_emergency",
  label: "Public Safety & Emergency Services",
  description:
    "Careers centered on protecting life, maintaining public order, and responding decisively in high-stakes situations. This world rewards composure under pressure, rule-following, and service-oriented responsibility.",

  /* =========================
     PSYCHOLOGICAL FOUNDATIONS
     ========================= */

  // Action + service + protocol
  riasecProfile: {
    R: 4.2, // Physical action, hands-on response
    I: 1.8, // Situational assessment, not abstract analysis
    A: 0.8, // Little tolerance for subjective expression
    S: 3.8, // Public service, teamwork, duty to others
    E: 2.4, // Authority exists, persuasion is secondary
    C: 4.4, // Procedures, rules, and command structures
  },

  // Temperament favors emotional control and reliability
  bigFiveProfile: {
    O: 2.2,          // Novelty-seeking can be dangerous here
    C: 4.6, // Discipline, reliability, follow-through
    E: 3.0,      // Team coordination over social dominance
    A: 3.6,     // Cooperation and trust
    N: 2.0,       // Low reactivity under stress is essential
  },

  // Psychological mismatches
  riasecConflicts: {
    A: 3.8, // Highly creative personalities feel suffocated
    I: 2.8, // Pure analysts struggle with rapid action
  },

  /* =========================
     ENVIRONMENT & TRADEOFFS
     ========================= */

  environment: {
    structure: "very_high",
    ambiguity: "low",
    competitiveness: "low",
    socialIntensity: "high",
    pressure: "very_high",
  },

  rewards: {
    incomePotential: "low_medium",
    statusPrestige: "medium",
    autonomy: "low",
    impact: "very_high",
    stability: "high",
  },

  stressors: {
    burnoutRisk: "high",
    emotionalLoad: "very_high",
    workLifeImbalance: "high",
  },

  /* =========================
     ORIENTATION & EXPLORATION
     ========================= */

  pathways: [
    "Fire & Rescue Services",
    "Law Enforcement",
    "Emergency Medical Services (EMS)",
    "Disaster Response",
    "Public Safety Coordination",
  ],

  narrativeHooks: {
    thrivesWhen: [
      "clear rules and command structures provide certainty",
      "helping others in crisis feels meaningful",
      "pressure sharpens focus rather than causing panic",
    ],
    strugglesWhen: [
      "creative freedom is required",
      "authority or protocol is questioned frequently",
      "long-term emotional recovery is neglected",
    ],
    valuesOftenInclude: [
      "duty",
      "service",
      "order",
      "reliability",
      "community protection",
    ],
  },
},
  skilled_trades_construction: {
  id: "skilled_trades_construction",
  label: "Skilled Trades & Construction",
  description:
    "Careers centered on building, repairing, and maintaining physical structures and systems. This world rewards hands-on competence, reliability, and mastery of tangible skills with visible real-world impact.",

  /* =========================
     PSYCHOLOGICAL FOUNDATIONS
     ========================= */

  // Physical competence + structure + applied problem-solving
  riasecProfile: {
    R: 4.6, // Core driver: hands-on, mechanical, physical work
    I: 2.4, // Diagnosing problems, applied reasoning
    A: 1.2, // Limited abstract or expressive creativity
    S: 2.2, // Team coordination, not emotional labor
    E: 1.8, // Leadership exists but persuasion is secondary
    C: 3.8, // Safety rules, codes, procedures, standards
  },

  // Temperament favors reliability and practical focus
  bigFiveProfile: {
    O: 2.4,          // Preference for concrete reality over abstraction
    C: 4.6, // Precision, safety, follow-through
    E: 2.6,      // Comfortable working independently or in small teams
    A: 3.2,     // Cooperation without excessive emotionality
    N: 2.2,       // Emotional steadiness under physical and time pressure
  },

  // Psychological friction points
  riasecConflicts: {
    A: 3.4, // Highly expressive personalities feel constrained
    I: 2.6, // Pure theorists struggle without abstraction
  },

  /* =========================
     ENVIRONMENT & TRADEOFFS
     ========================= */

  environment: {
    structure: "high",
    ambiguity: "low",
    competitiveness: "medium",
    socialIntensity: "low_medium",
    pressure: "medium_high",
  },

  rewards: {
    incomePotential: "medium_high",
    statusPrestige: "low_medium",
    autonomy: "medium",
    impact: "high",
    stability: "high",
  },

  stressors: {
    burnoutRisk: "medium",
    emotionalLoad: "low",
    workLifeImbalance: "medium",
  },

  /* =========================
     ORIENTATION & EXPLORATION
     ========================= */

  pathways: [
    "Electrician",
    "Plumbing & Mechanical Trades",
    "Carpentry & Construction",
    "HVAC & Systems Maintenance",
    "Heavy Equipment & Industrial Trades",
  ],

  narrativeHooks: {
    thrivesWhen: [
      "progress is visible and tangible",
      "mastery of a skill brings pride",
      "rules and safety standards are respected",
    ],
    strugglesWhen: [
      "work is abstract or ambiguous",
      "emotional labor dominates the role",
      "status depends on persuasion rather than competence",
    ],
    valuesOftenInclude: [
      "craftsmanship",
      "reliability",
      "practical competence",
      "self-sufficiency",
      "visible impact",
    ],
  },
},
  transportation_physical_operations: {
  id: "transportation_physical_operations",
  label: "Transportation & Physical Operations",
  description:
    "Careers centered on the reliable movement of people, vehicles, or goods in real-world environments. This world rewards situational awareness, discipline, and consistent execution under physical and time-based constraints.",

  /* =========================
     PSYCHOLOGICAL FOUNDATIONS
     ========================= */

  // Physical execution + vigilance + procedural discipline
  riasecProfile: {
    R: 4.4, // Core driver: hands-on operation and physical engagement
    I: 1.6, // Situational assessment, not abstract analysis
    A: 0.6, // Little tolerance for expressive or subjective work
    S: 2.0, // Limited social interaction, functional teamwork only
    E: 1.6, // Authority exists but persuasion is minimal
    C: 4.2, // Rules, routes, schedules, safety procedures
  },

  // Temperament favors steadiness, focus, and reliability
  bigFiveProfile: {
    O: 2.0,          // Novelty-seeking can reduce safety
    C: 4.6, // Precision, reliability, attention to detail
    E: 2.2,      // Comfort with solitude or limited interaction
    A: 3.0,     // Cooperation without emotional labor
    N: 2.0,       // Emotional stability under fatigue and pressure
  },

  // Psychological friction points
  riasecConflicts: {
    A: 3.6, // Creative, expressive personalities feel constrained
    I: 2.8, // Pure analysts struggle with repetitive execution
  },

  /* =========================
     ENVIRONMENT & TRADEOFFS
     ========================= */

  environment: {
    structure: "very_high",
    ambiguity: "very_low",
    competitiveness: "low",
    socialIntensity: "low",
    pressure: "medium_high",
  },

  rewards: {
    incomePotential: "medium",
    statusPrestige: "low",
    autonomy: "low_medium",
    impact: "high",
    stability: "high",
  },

  stressors: {
    burnoutRisk: "medium",
    emotionalLoad: "low",
    workLifeImbalance: "medium_high",
  },

  /* =========================
     ORIENTATION & EXPLORATION
     ========================= */

  pathways: [
    "Commercial & Long-Haul Driving",
    "Aviation Operations (Pilot, Ground Crew)",
    "Public Transit Operations",
    "Maritime Operations",
    "Heavy Vehicle & Fleet Operations",
  ],

  narrativeHooks: {
    thrivesWhen: [
      "rules and procedures create safety and clarity",
      "work involves sustained focus rather than persuasion",
      "reliability and consistency are valued over innovation",
    ],
    strugglesWhen: [
      "creative autonomy is required",
      "social influence defines success",
      "work lacks clear structure or boundaries",
    ],
    valuesOftenInclude: [
      "reliability",
      "discipline",
      "safety",
      "consistency",
      "practical responsibility",
    ],
  },
},
};
