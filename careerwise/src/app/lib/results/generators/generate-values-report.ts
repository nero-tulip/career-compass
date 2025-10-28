import "server-only";

import { adminDb } from "@/app/lib/firebaseAdmin";
import {
  loadIntakeSummary,
  loadMacroSummary,
} from "@/app/lib/results/loaders/client-loaders";
import { loadRiasecSummary } from "@/app/lib/results/loaders/map-riasec";
import { loadBig5Summary } from "@/app/lib/results/loaders/map-big5";
import { computeMotivators } from "@/app/lib/results/motivators/computeMotivators";
import { MOTIVATION_TAXONOMY, type MotivationName } from "@/app/lib/results/values-taxonomy";
import type { ValuesReport } from "@/app/lib/results/types";

const MODEL = process.env.OPENAI_VALUES_MODEL ?? "gpt-4o-2024-08-06";

/** Cache helpers (Firestore under the user’s draft run) */
async function readCache(uid: string, rid: string): Promise<ValuesReport | undefined> {
  const ref = adminDb().doc(`users/${uid}/drafts/${rid}`);
  const snap = await ref.get();
  if (!snap.exists) return undefined;
  return snap.data()?.valuesReport as ValuesReport | undefined;
}

async function writeCache(uid: string, rid: string, report: ValuesReport) {
  const ref = adminDb().doc(`users/${uid}/drafts/${rid}`);
  await ref.set({ valuesReport: report, updatedAt: new Date() }, { merge: true });
}

/** JSON Schema for Structured Outputs */
const schema = {
  type: "object",
  additionalProperties: false,
  properties: {
    topMotivations: {
      type: "array",
      minItems: 3,
      maxItems: 3,
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          name: { type: "string", enum: [...MOTIVATION_TAXONOMY] },
          why: { type: "string", minLength: 20, maxLength: 400 },
        },
        required: ["name", "why"],
      },
    },
    lowMotivations: {
      type: "array",
      minItems: 3,
      maxItems: 3,
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          name: { type: "string", enum: [...MOTIVATION_TAXONOMY] },
          why: { type: "string", minLength: 20, maxLength: 400 },
        },
        required: ["name", "why"],
      },
    },
    summary: { type: "string", minLength: 60, maxLength: 600 },
  },
  required: ["topMotivations", "lowMotivations", "summary"],
} as const;

/** Call OpenAI *Responses* API with Structured Outputs (no SDK needed) */
async function callOpenAIResponses(rawSignals: unknown) {
  const res = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: MODEL,
      temperature: 0.3,
      response_format: {
        type: "json_schema",
        json_schema: { name: "ValuesReport", schema, strict: true },
      },
      input: [
        {
          role: "system",
          content: [
            {
              type: "text",
              text:
                "You are a certified career coach and organizational psychologist. " +
                "Be empathetic, precise, and practical. Ground every conclusion in RIASEC, Big-5, Macro, and Intake signals.",
            },
          ],
        },
        {
          role: "user",
          content: [
            {
              type: "input_text",
              text:
                "Map this user to the fixed motivation taxonomy and write an empathetic coach-style summary.\n\n" +
                "- Use only the taxonomy names.\n" +
                "- Pick exactly 3 top motivations and 3 low motivations.\n" +
                "- Ground each rationale in the signals.\n\n" +
                `Taxonomy:\n${MOTIVATION_TAXONOMY.join(", ")}\n\n` +
                "Signals (JSON):\n" +
                JSON.stringify(rawSignals, null, 2),
            },
          ],
        },
      ],
    }),
  });

  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(`OpenAI HTTP ${res.status}: ${txt}`);
  }

  const data = await res.json();
  const text =
    data?.output?.[0]?.content?.[0]?.text ??
    data?.output_text ??
    "";
  if (!text) throw new Error("OpenAI returned no structured text");
  return JSON.parse(text) as {
    topMotivations: Array<{ name: MotivationName; why: string }>;
    lowMotivations: Array<{ name: MotivationName; why: string }>;
    summary: string;
  };
}

/** Main server generator */
export async function generateValuesReport(uid: string, rid: string): Promise<ValuesReport> {
  // 1) Cache
  const cached = await readCache(uid, rid).catch(() => undefined);
  if (cached) return cached;

  // 2) Load signals (these “client-loaders” only read Firestore; they typically need the uid)
  const fakeUser = { uid } as any;
  const [intake, macro, riasec, big5] = await Promise.all([
    loadIntakeSummary(fakeUser, rid).catch(() => undefined),
    loadMacroSummary(fakeUser, rid).catch(() => undefined),
    loadRiasecSummary(fakeUser, rid).catch(() => undefined),
    loadBig5Summary(fakeUser, rid).catch(() => undefined),
  ]);

  // 3) Intake string (bounded)
  const intakeText = intake
    ? Object.values(intake)
        .map((v) => (typeof v === "string" ? v : JSON.stringify(v)))
        .join(" ")
        .slice(0, 4000)
    : "";

  // 4) Deterministic rails (features + fallback)
  const riasecMap = { R: 0, I: 0, A: 0, S: 0, E: 0, C: 0 };
  (riasec?.scores ?? []).forEach((s: any) => {
    const k = s.key as keyof typeof riasecMap;
    if (k in riasecMap) riasecMap[k] = s.avg ?? 0;
  });
  const big5Map = {
    O: big5?.avg?.O ?? 0,
    C: big5?.avg?.C ?? 0,
    E: big5?.avg?.E ?? 0,
    A: big5?.avg?.A ?? 0,
    N: big5?.avg?.N ?? 0,
  };
  const motivatorHints = await computeMotivators({
    big5: big5Map,
    riasec: riasecMap,
    intakeText,
  });

  const rawSignals = { intakeText, macro, riasec, big5, motivatorHints };

  // 5) LLM (with fallback)
  let llmJson:
    | { topMotivations: Array<{ name: MotivationName; why: string }>; lowMotivations: Array<{ name: MotivationName; why: string }>; summary: string }
    | null = null;

  try {
    llmJson = await callOpenAIResponses(rawSignals);
  } catch {
    // fallback to deterministic extremes if LLM fails
    const pickName = (label: string): MotivationName => {
      if (label.includes("Mastery")) return "Mastery";
      if (label.includes("Creativity")) return "Creativity";
      if (label.includes("Impact")) return "Impact";
      if (label.includes("Autonomy")) return "Autonomy";
      if (label.includes("Belonging")) return "Belonging";
      if (label.includes("Recognition")) return "Recognition";
      if (label.includes("Stability")) return "Stability";
      if (label.includes("Structure")) return "Structure/Clarity";
      if (label.includes("Service")) return "Service/Mentorship";
      if (label.includes("Adventure")) return "Variety/Challenge";
      if (label.includes("Growth")) return "Learning/Growth";
      if (label.includes("Prestige") || label.includes("Status")) return "Prestige/Status";
      if (label.includes("Purpose") || label.includes("Mission")) return "Purpose/Mission";
      if (label.includes("Harmony") || label.includes("Balance")) return "Work–Life Harmony";
      if (label.includes("Financial")) return "Financial Reward";
      if (label.includes("Leadership")) return "Leadership";
      return "Learning/Growth";
    };

    const top = motivatorHints.slice(0, 3).map((m) => ({
      name: pickName(m.label),
      why: `Strong signals for ${m.label.toLowerCase()} across your profile.`,
    }));
    const low = motivatorHints.slice(-3).map((m) => ({
      name: pickName(m.label),
      why: `Fewer signals for ${m.label.toLowerCase()} in your current data.`,
    }));
    llmJson = {
      topMotivations: top,
      lowMotivations: low,
      summary:
        "You’re motivated by growth and visible contribution more than predictability. Choose roles that let you improve your craft, share outcomes, and iterate with feedback; avoid environments that over-index on rigid process or narrow routine.",
    };
  }

  // 6) Copy for the page
  const title = "What Drives You at Work";
  const opening =
    "Work values are the conditions that make work feel meaningful—things like mastery, creativity, impact, or stability. They matter because they shape motivation, focus, and long-term fit. Use this page to shortlist roles and environments that align, and say “no” faster to paths that don’t.";

  // merge optional scores from deterministic hints (for UI)
  const topWithScores = llmJson.topMotivations.map((m) => {
    const hit = motivatorHints.find((h) =>
      m.name.toLowerCase().includes(h.label.toLowerCase().split(" ")[0])
    );
    return { ...m, score: hit?.score };
  });

  const report: ValuesReport = {
    title,
    opening,
    topMotivations: topWithScores,
    lowMotivations: llmJson.lowMotivations,
    summary: llmJson.summary,
    debug: { usedSignals: { macro, riasec, big5, motivatorHints } },
  };

  await writeCache(uid, rid, report).catch(() => {});
  return report;
}