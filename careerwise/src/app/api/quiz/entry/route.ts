import { NextResponse } from "next/server";
import { getAuth } from "firebase-admin/auth";
import { adminAuth, adminDb } from "@/app/lib/firebaseAdmin";

// Sections we support
const VALID_SECTIONS = new Set(["intake", "macro", "riasec"] as const);
type Section = "intake" | "macro" | "riasec";

export const runtime = 'nodejs';

export async function POST(request: Request) {
  try {
    // ---- Auth
    const authz = request.headers.get("authorization") || request.headers.get("Authorization");
    if (!authz?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
    }
    const idToken = authz.slice("Bearer ".length).trim();
    const decoded = await adminAuth().verifyIdToken(idToken);
    const uid = decoded.uid;

    const { section }: { section?: Section } = await request.json().catch(() => ({}));
    const targetSection: Section = VALID_SECTIONS.has(section as any) ? (section as Section) : "intake";

    const db = adminDb();
    const userRef = db.collection("users").doc(uid);

    // ---- Get or create active draft
    const userSnap = await userRef.get();
    const userData = userSnap.exists ? userSnap.data() || {} : {};
    let rid: string | null = userData?.activeRid || null;

    // Helper to seed a new draft from latest results if present
    async function seedFromLatestResults(newRid: string) {
      // Pull latest result (ordered by completedAt desc)
      const resCol = userRef.collection("results").orderBy("completedAt", "desc").limit(1);
      const latestResSnap = await resCol.get();

      if (!latestResSnap.empty) {
        const latest = latestResSnap.docs[0].data();
        // Copy any fields we care about into the draft
        const payload: any = {
          status: "in_progress",
          entitlement: userData?.entitlement === "premium" ? "premium" : "free",
          updatedAt: new Date(),
        };
        // If previous run stored source answers in result.profile or on draft (your app: results store the computed riasec only).
        // We defensively copy what we can:
        if (latest?.profile?.riasec) payload.riasec = payload.riasec ?? []; // keep array structure on draft if you store answers there later
        // If you saved prior intake/macro in results (you likely didn't), copy them here; else leave blank.
        // payload.intake = latest?.intake ?? null;
        // payload.macro  = latest?.macro  ?? [];

        await userRef.collection("drafts").doc(newRid).set(payload, { merge: true });
      } else {
        // No results yet → blank draft
        await userRef.collection("drafts").doc(newRid).set(
          {
            status: "in_progress",
            entitlement: userData?.entitlement === "premium" ? "premium" : "free",
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          { merge: true }
        );
      }
    }

    if (!rid) {
      // Create a new draft id (Firestore doc id)
      const draftRef = userRef.collection("drafts").doc();
      rid = draftRef.id;
      // Seed from latest results if possible (or blank)
      await seedFromLatestResults(rid);
      // Save activeRid on user
      await userRef.set({ activeRid: rid }, { merge: true });
    } else {
      // Ensure draft exists
      const draftRef = userRef.collection("drafts").doc(rid);
      const draftSnap = await draftRef.get();
      if (!draftSnap.exists) {
        // If user.activeRid points to a non-existent draft, reseed a new one
        const newRef = userRef.collection("drafts").doc();
        rid = newRef.id;
        await seedFromLatestResults(rid);
        await userRef.set({ activeRid: rid }, { merge: true });
      }
    }

    const destination = `/app/quiz/${targetSection}?rid=${encodeURIComponent(rid)}`;
    return NextResponse.json({ success: true, rid, destination });
  } catch (e: any) {
    console.error("POST /api/quiz/entry error:", e);
    return NextResponse.json({ error: e?.message || "internal_error" }, { status: 500 });
  }
}