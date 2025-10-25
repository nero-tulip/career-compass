// src/app/lib/server/actions.ts
"use server";

import { adminAuth } from "@/app/lib/firebaseAdmin";
import { getUserEntitlement } from "./getUserEntitlement";

/**
 * Server action to verify user token and return entitlement securely.
 */
export async function fetchUserEntitlementServer(idToken: string) {
  try {
    // 1. Verify the user's ID token
    const decoded = await adminAuth().verifyIdToken(idToken);
    const uid = decoded.uid;

    // 2. Read entitlement via Admin SDK
    return await getUserEntitlement(uid);
  } catch (err) {
    console.error("❌ fetchUserEntitlementServer failed:", err);
    return "unknown";
  }
}