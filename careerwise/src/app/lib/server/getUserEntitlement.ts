// src/app/lib/server/getUserEntitlement.ts
import { adminDb } from "@/app/lib/firebaseAdmin";

/**
 * Server-side entitlement lookup (bypasses Firestore security rules).
 * Returns "pro" | "free" | "unknown"
 */
export async function getUserEntitlement(uid: string): Promise<"pro" | "free" | "unknown"> {
  try {
    const snap = await adminDb().doc(`users/${uid}`).get();
    const ent = snap.data()?.entitlement;
    if (ent === "pro") return "pro";
    if (ent === "free") return "free";
    return "unknown";
  } catch (err) {
    console.error("🔥 getUserEntitlement failed:", err);
    return "unknown";
  }
}