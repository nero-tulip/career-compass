import type { IntakeSummary, LabeledValue } from "./types";

/**
 * Your intake section is saved as a loose object keyed by question ids
 * (e.g., name, age_band, country, status, etc.). We normalize that here.
 *
 * NOTE: We resolve labels for selects/chips using small maps that mirror your JSON.
 * Keep these maps in sync with /app/data/intakeQuestions.json when you change options.
 */

const SELECT_LABELS: Record<string, Record<string, string>> = {
  education_level: {
    secondary: "High school or equivalent",
    some_college: "Some college/undergrad",
    bachelors: "Bachelor’s",
    masters: "Master’s",
    doctorate: "Doctorate",
    other: "Other / trade / bootcamp",
  },
  stage_of_career: {
    choosing_college: "Ready to choose a college/uni course",
    choosing_career_with_degree: "What can I do with my degree?",
    career_change: "Want to change careers",
    career_exploration: "Just exploring career options",
    career_growth: "Want to grow in my current career",
    entrepreneurship: "Interested in entrepreneurship",
  },
  work_env: {
    startup: "Startup / Fast-paced",
    corporate: "Corporate / Structured",
    nonprofit: "Non-profit / Mission-driven",
    freelance: "Freelance / Self-employed",
    academic: "Academic / Research-focused",
    creative: "Creative / Artistic",
    small_business: "Small business / Family-owned",
    remote: "Remote-first / Distributed",
    other: "Other / Not sure yet",
  },
  travel_appetite: {
    love_frequent: "Love frequent travel",
    occasional: "Occasional is fine",
    anchored: "Prefer an anchored role",
  },
  where_to_work: {
    home_country: "In my current country",
    open_relocate: "Open to relocate if the role fits",
    specific: "Specific country/countries",
    remote: "Remote / Work from anywhere",
  },
};

const CHIPS_LABELS: Record<string, Record<string, string>> = {
  status: {
    high_school: "High school student",
    university: "College / University student",
    work_part_time: "Working part-time",
    work_full_time: "Working full-time",
    self_employed: "Self-employed / Freelancer",
    unemployed: "Unemployed / Looking",
    finished_high_school: "Finished High School",
  },
  platform_goals: {
    clarity_direction: "Clarity on career direction",
    selfawareness: "Increased self-awareness",
    career_matches: "Find matching careers",
    action_plan: "A concrete action plan",
    mentor_support: "Mentor guidance",
    explore_fields: "Explore new fields",
    skills_development: "Skills development",
  },
  industry: {
    tech: "Technology / Software",
    finance: "Finance / Banking",
    healthcare: "Healthcare / Medicine",
    engineering: "Engineering / Manufacturing",
    education: "Education",
    arts_entertainment: "Arts / Entertainment",
    entrepreneur: "Entrepreneurship / Business",
    government: "Government / Public Sector",
    nonprofit: "Non-profit / Social Impact",
    science: "Science / Research",
    media: "Media / Communications",
    hr: "Human Resources / Recruiting",
    design: "Design / UX",
    writing: "Writing / Content Creation",
    consulting: "Consulting",
    real_estate: "Real Estate",
    retail: "Retail / E-commerce",
    logistics: "Logistics / Supply Chain",
    project_mgmt: "Project Management",
    customer_svc: "Customer Service",
    admin: "Administrative / Office Support",
    construction: "Construction / Skilled Trades",
    environment: "Environment / Sustainability",
    sports: "Sports / Fitness",
    travel: "Travel / Hospitality",
    beauty: "Beauty / Fashion",
    agriculture: "Agriculture / Farming",
    security: "Security / Defense",
    hospitality: "Hospitality / Food Service",
    law: "Law / Legal Services",
    marketing: "Marketing / Advertising",
    sales: "Sales / Business Development",
    other: "Other / Not sure yet",
  },
};

function labelSelect(id: string, value?: string): LabeledValue<string> | undefined {
  if (!value) return undefined;
  const label = SELECT_LABELS[id]?.[value] ?? value;
  return { value, label };
}
function labelChips(id: string, values?: string[]): LabeledValue<string>[] | undefined {
  if (!values || !Array.isArray(values)) return undefined;
  const map = CHIPS_LABELS[id] ?? {};
  return values.map((v) => ({ value: v, label: map[v] ?? v }));
}

/**
 * mapIntake takes the raw saved intake object and returns a normalized IntakeSummary.
 * It supports both:
 *  - keys by question id (preferred)
 *  - or nested fields if you ever saved mapTo paths directly
 */
export function mapIntake(raw: any): IntakeSummary | undefined {
  if (!raw || typeof raw !== "object") return undefined;

  const get = (k: string) => raw[k];

  const name = get("name") ?? raw?.profile?.name;
  const ageBand = typeof get("age_band") === "number" ? get("age_band") : raw?.profile?.ageBand;

  // country: may be string code, or an object (depending on your country UI)
  const countryVal = get("country") ?? raw?.profile?.country;
  const country: LabeledValue<string> | undefined =
    typeof countryVal === "string"
      ? { value: countryVal, label: countryVal }
      : countryVal && typeof countryVal === "object"
      ? { value: countryVal.code ?? countryVal.value ?? "", label: countryVal.label ?? countryVal.name ?? "" }
      : undefined;

  const educationLevel = labelSelect("education_level", get("education_level") ?? raw?.profile?.educationLevel);
  const status = labelChips("status", get("status") ?? raw?.profile?.status);
  const stageOfCareer = labelSelect("stage_of_career", get("stage_of_career") ?? raw?.profile?.stageOfCareer);
  const goals = labelChips("platform_goals", get("platform_goals") ?? raw?.prefs?.goals);

  const workEnvironment = labelSelect("work_env", get("work_env") ?? raw?.prefs?.workEnvironment);
  const travelAppetite = labelSelect("travel_appetite", get("travel_appetite") ?? raw?.prefs?.travel);
  const workLocationIntent = labelSelect("where_to_work", get("where_to_work") ?? raw?.prefs?.workLocationIntent);

  const preferredCountriesRaw =
    get("preferred_countries") ?? raw?.prefs?.preferredCountries;
  const preferredCountries =
    Array.isArray(preferredCountriesRaw)
      ? preferredCountriesRaw.map((c: string) => ({ value: c, label: c }))
      : undefined;

  const interestedIndustries = labelChips("industry", get("industry") ?? raw?.prefs?.industry);

  return {
    name,
    ageBand: typeof ageBand === "number" ? ageBand : undefined,
    country,
    educationLevel,
    status,
    stageOfCareer,
    goals,
    workEnvironment,
    travelAppetite,
    workLocationIntent,
    preferredCountries,
    interestedIndustries,
  };
}