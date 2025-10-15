// src/app/api/quiz/section/route.ts
import { NextResponse } from "next/server";
import { adminAuth } from "@/app/lib/firebaseAdmin";
import { adminDb } from "@/app/lib/firebaseAdmin";

export const runtime = "nodejs";

type Section = "intake" | "macro" | "riasec" | "big5";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const rid = url.searchParams.get("rid");
    const section = url.searchParams.get("section") as Section | null;

    if (!rid || !section) {
      return NextResponse.json({ error: "missing_params" }, { status: 400 });
    }

    // ---- Auth
    const authz =
      request.headers.get("authorization") ||
      request.headers.get("Authorization");
    if (!authz?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
    }
    const idToken = authz.slice("Bearer ".length).trim();
    const decoded = await adminAuth().verifyIdToken(idToken);
    const uid = decoded.uid;

    // ---- Load draft
    const db = adminDb();
    const draftRef = db
      .collection("users")
      .doc(uid)
      .collection("drafts")
      .doc(rid);
    const snap = await draftRef.get();
    if (!snap.exists) {
      return NextResponse.json({ error: "draft_not_found" }, { status: 404 });
    }
    const data = snap.data() || {};

    // ---- Return only the requested section slice
    const sectionData =
      section === "intake"
        ? (data as any).intake ?? null
        : section === "macro"
        ? (data as any).macro ?? []
        : section === "riasec"
        ? (data as any).riasec ?? []
        : section === "big5"
        ? (data as any).big5 ?? []
        : null;

    return NextResponse.json({ success: true, rid, section, data: sectionData });
  } catch (e: any) {
    console.error("GET /api/quiz/section error:", e);
    return NextResponse.json(
      { error: e?.message || "internal_error" },
      { status: 500 }
    );
  }
}