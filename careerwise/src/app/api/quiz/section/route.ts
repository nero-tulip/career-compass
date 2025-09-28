import { NextResponse } from "next/server";
import { getAuth } from "firebase-admin/auth";
import { adminDb } from "@/app/lib/firebaseAdmin";

type Section = "intake" | "macro" | "riasec";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const rid = url.searchParams.get("rid");
    const section = url.searchParams.get("section") as Section | null;

    if (!rid || !section) {
      return NextResponse.json({ error: "missing_params" }, { status: 400 });
    }

    const authz = request.headers.get("authorization") || request.headers.get("Authorization");
    if (!authz?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
    }
    const idToken = authz.slice("Bearer ".length).trim();
    const decoded = await getAuth().verifyIdToken(idToken);
    const uid = decoded.uid;

    const db = adminDb();
    const draftRef = db.collection("users").doc(uid).collection("drafts").doc(rid);
    const snap = await draftRef.get();
    if (!snap.exists) {
      return NextResponse.json({ error: "draft_not_found" }, { status: 404 });
    }
    const data = snap.data() || {};

    // Return only the section slice
    const sectionData =
      section === "intake" ? data.intake ?? null
      : section === "macro"  ? data.macro  ?? []
      : section === "riasec" ? data.riasec ?? []
      : null;

    return NextResponse.json({ success: true, rid, section, data: sectionData });
  } catch (e: any) {
    console.error("GET /api/quiz/section error:", e);
    return NextResponse.json({ error: e?.message || "internal_error" }, { status: 500 });
  }
}