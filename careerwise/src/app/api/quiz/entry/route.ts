import { NextResponse } from "next/server";
import { v4 as uuid } from "uuid";
import { destinationForStatus } from "@/app/lib/quizEntry";
import type { DraftDoc } from "@/app/types/drafts";
import { adminDb, adminAuth, AdminFieldValue } from "@/app/lib/firebaseAdmin";

export const runtime = "nodejs";

async function getUidFromAuthHeader(req: Request): Promise<string | null> {
  const h = req.headers.get("authorization") || "";
  const m = h.match(/^Bearer\s+(.+)$/i);
  if (!m) return null;
  try {
    const decoded = await adminAuth().verifyIdToken(m[1]);
    return decoded.uid ?? null;
  } catch {
    return null;
  }
}

export async function POST(req: Request) {
  const db = adminDb();
  try {
    const uid = await getUidFromAuthHeader(req);
    if (!uid) {
      return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
    }

    const userRef = db.collection("users").doc(uid);

    const destination = await db.runTransaction(async (tx) => {
      const userSnap = await tx.get(userRef);
      const userData = userSnap.exists ? (userSnap.data() as any) : {};

      if (userData.activeRid) {
        const rid = String(userData.activeRid);
        const draftRef = userRef.collection("drafts").doc(rid);
        const draftSnap = await tx.get(draftRef);

        if (draftSnap.exists) {
          const draft = draftSnap.data() as DraftDoc;
          return destinationForStatus(draft.status, rid);
        } else {
          const newRid = uuid();
          const newDraftRef = userRef.collection("drafts").doc(newRid);
          tx.set(newDraftRef, {
            status: "started",
            entitlement: "free",
            createdAt: AdminFieldValue.serverTimestamp(),
            updatedAt: AdminFieldValue.serverTimestamp(),
          } as DraftDoc);
          tx.set(userRef, { activeRid: newRid }, { merge: true });
          return `/intake?rid=${newRid}`;
        }
      }

      const rid = uuid();
      const draftRef = userRef.collection("drafts").doc(rid);
      tx.set(draftRef, {
        status: "started",
        entitlement: "free",
        createdAt: AdminFieldValue.serverTimestamp(),
        updatedAt: AdminFieldValue.serverTimestamp(),
      } as DraftDoc);
      tx.set(userRef, { activeRid: rid }, { merge: true });
      return `/intake?rid=${rid}`;
    });

    console.log("[/api/quiz/entry] uid:", uid, "→", destination);
    return NextResponse.json({ destination }, { status: 200 });
  } catch (e: any) {
    console.error("[/api/quiz/entry] error:", e);
    return NextResponse.json({ error: "internal" }, { status: 500 });
  }
}
