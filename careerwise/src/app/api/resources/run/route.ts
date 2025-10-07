// src/app/api/resources/run/route.ts
import { NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/app/lib/firebaseAdmin";

export const runtime = "nodejs";

type PromptVars = {
  role: string;
  location: string;
  seniority?: string;
  timeline?: string;
  constraints?: string;
  budget?: string;
};

type ResourceItem = {
  title: string;
  type: "article" | "course" | "community" | "tool";
  url?: string;
  summary: string;
  why: string;
  difficulty?: "beginner" | "intermediate" | "advanced";
};
type RoadmapItem = { step: string; detail: string; estTime?: string; references?: string[] };
type RoadmapPhase = { phase: number; title: string; items: RoadmapItem[] };

type PackDoc = {
  prompt: PromptVars;
  usesProfile: boolean;
  inputs?: any;
  status: "ready" | "running" | "error";
  generated?: {
    explainer: string;
    roadmap: RoadmapPhase[];
    resources: ResourceItem[];
  };
  createdAt?: any;
  updatedAt?: any;
  version?: number;
};

async function requireUid(request: Request): Promise<string> {
  const authz = request.headers.get("authorization") || request.headers.get("Authorization");
  if (!authz?.startsWith("Bearer ")) throw new Error("unauthenticated");
  const token = authz.slice("Bearer ".length).trim();
  const decoded = await adminAuth().verifyIdToken(token);
  return decoded.uid;
}

// --- tiny helpers ---
function pickLatest<T = any>(arr: FirebaseFirestore.QuerySnapshot<FirebaseFirestore.DocumentData>): T | null {
  if (arr.empty) return null;
  return (arr.docs[0].data() as unknown) as T;
}

function buildSearchQuery(p: PromptVars) {
  // Bias to role + country, add qualifiers if present
  const bits = [
    `"${p.role}" career guide`,
    p.location,
    p.seniority ? p.seniority : "",
    p.constraints ? p.constraints : "",
    "how to become",
    "requirements",
  ].filter(Boolean);
  return bits.join(" ");
}

async function tavilySearch(query: string) {
  const key = process.env.TAVILY_API_KEY;
  if (!key) return { results: [] as Array<{ url: string; title: string; content: string }> };

  const res = await fetch("https://api.tavily.com/search", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      api_key: key,
      query,
      search_depth: "advanced",
      include_answer: false,
      include_images: false,
      include_domains: [], // allow all
      exclude_domains: [],
      max_results: 12,
    }),
  });

  const data = await res.json().catch(() => ({}));
  const results = Array.isArray(data?.results) ? data.results : [];
  return {
    results: results.map((r: any) => ({
      url: r.url,
      title: r.title,
      content: r.content || r.snippet || "",
    })),
  };
}

async function openaiJson<T = any>(messages: any[]): Promise<T> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("missing_openai_key");

  // Using Chat Completions w/ JSON mode for portability
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      response_format: { type: "json_object" },
      temperature: 0.4,
      messages,
    }),
  });

  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(`openai_error: ${res.status} ${txt}`);
  }
  const data = await res.json();
  const content = data?.choices?.[0]?.message?.content || "{}";
  return JSON.parse(content) as T;
}

export async function POST(request: Request) {
  try {
    const uid = await requireUid(request);
    const { prompt, usesProfile }: { prompt: PromptVars; usesProfile: boolean } = await request
      .json()
      .catch(() => ({}));

    if (!prompt?.role || !prompt?.location) {
      return NextResponse.json({ error: "missing_prompt" }, { status: 400 });
    }

    const db = adminDb();

    // Pull a lightweight slice of profile signals (best-effort)
    let profileInputs: any = {};
    if (usesProfile) {
      const draftsCol = db.collection("users").doc(uid).collection("drafts");
      const latest = await draftsCol.orderBy("updatedAt", "desc").limit(1).get();
      const d = pickLatest<any>(latest) || {};
      profileInputs.intake = d?.intake ?? null;
      profileInputs.macro = d?.macro ?? null;
      profileInputs.riasecTop3 = Array.isArray(d?.riasec)
        ? null // you stored raw answers; keep null for now
        : null;
      profileInputs.big5Summary = Array.isArray(d?.big5) ? null : null;
    }

    // Create a pack doc in "running" status
    const packRef = db.collection("users").doc(uid).collection("resources").doc();
    const packId = packRef.id;

    const baseDoc: PackDoc = {
      prompt,
      usesProfile,
      inputs: profileInputs,
      status: "running",
      version: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    await packRef.set(baseDoc, { merge: true });

    // 1) Web search (open web)
    const query = buildSearchQuery(prompt);
    const search = await tavilySearch(query);

    // 2) Advisor synthesis (LLM → JSON)
    const system = {
      role: "system",
      content:
        "You are a career guide. Create a concise, highly actionable learning and transition plan with concrete steps, short explanations, and curated resources. Output valid JSON matching the provided schema. Prefer clear, step-by-step guidance over generic advice.",
    };

    const userMsg = {
      role: "user",
      content: JSON.stringify({
        prompt,
        profileInputs,
        searchSnippets: search.results.slice(0, 12), // url, title, content
        schema: {
          explainer: "string",
          roadmap: [
            {
              phase: "number",
              title: "string",
              items: [{ step: "string", detail: "string", estTime: "string?", references: ["url?"] }],
            },
          ],
          resources: [
            {
              title: "string",
              type: "article|course|community|tool",
              url: "string?",
              summary: "string",
              why: "string",
              difficulty: "beginner|intermediate|advanced?",
            },
          ],
        },
      }),
    };

    type GenOut = {
      explainer: string;
      roadmap: RoadmapPhase[];
      resources: ResourceItem[];
    };

    let generated: GenOut | null = null;
    try {
      generated = await openaiJson<GenOut>([system, userMsg]);
    } catch (err) {
      // Fallback: minimal stub if LLM fails
      generated = {
        explainer: `Why ${prompt.role} in ${prompt.location} could fit you.`,
        roadmap: [
          {
            phase: 1,
            title: "Foundations",
            items: [
              { step: "Learn the basics", detail: "Take an intro course to cover fundamentals.", estTime: "2–3 weeks" },
              { step: "Talk to 2 practitioners", detail: "Short calls to validate day-to-day realities." },
            ],
          },
          { phase: 2, title: "Portfolio & Proof", items: [{ step: "Build project", detail: "Small scoped project." }] },
        ],
        resources: (search.results || []).slice(0, 6).map((r: { url: string; title: string; content: string }) => ({
          title: r.title || "Article",
          type: "article",
          url: r.url,
          summary: r.content?.slice(0, 200) || "Relevant resource.",
          why: "Contextual reference for your path.",
        })),
      };
    }

    // 3) Save result
    await packRef.set(
      {
        status: "ready",
        generated,
        updatedAt: new Date(),
      },
      { merge: true }
    );

    return NextResponse.json({ success: true, id: packId });
  } catch (e: any) {
    console.error("POST /api/resources/run", e);
    const msg = e?.message === "unauthenticated" ? "unauthenticated" : "internal_error";
    const status = msg === "unauthenticated" ? 401 : 500;
    return NextResponse.json({ error: msg }, { status });
  }
}