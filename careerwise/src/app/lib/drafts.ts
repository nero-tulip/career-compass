"use client";

import { doc, setDoc, updateDoc, serverTimestamp, getDoc } from "firebase/firestore";
import { db } from "@/app/lib/firebase";
import type { User } from "firebase/auth";

export type SectionId = "intake" | "macro" | "riasec" | "big5" ;

// Add any new coarse statuses you use here:
export type DraftStatus =
  | "started"
  | "intake_done"
  | "macro_done"
  | "riasec_in_progress"
  | "riasec_done"
  | "big5_in_progress"
  | "big5_done"
  | "free_done"
  | "premium_done";

export async function ensureDraft(user: User, rid?: string) {
  const id = rid || crypto.randomUUID();
  const ref = doc(db, "users", user.uid, "drafts", id);

  if (!rid) {
    await setDoc(
      ref,
      {
        status: "started",
        entitlement: "free",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
  } else {
    // touch updatedAt if it already exists
    const snap = await getDoc(ref);
    if (!snap.exists()) {
      await setDoc(
        ref,
        {
          status: "started",
          entitlement: "free",
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );
    } else {
      await updateDoc(ref, { updatedAt: serverTimestamp() });
    }
  }

  return { id };
}

/**
 * Save a quiz section to the user's draft.
 * @param user    Firebase user
 * @param rid     draft id
 * @param section "intake" | "macro" | "riasec"
 * @param data    section payload (answers, etc.)
 * @param status  optional coarse status to set (e.g., "riasec_in_progress", "riasec_done")
 * @param extra   optional extra fields to merge (e.g., { progress: { section: "riasec", page: 3 } })
 */
export async function saveSection(
  user: User,
  rid: string,
  section: SectionId,
  data: unknown,
  status?: DraftStatus,
  extra?: Record<string, unknown>
) {
  const ref = doc(db, "users", user.uid, "drafts", rid);

  const payload: Record<string, unknown> = {
    [section]: data,
    updatedAt: serverTimestamp(),
  };

  if (status) payload.status = status;
  if (extra) Object.assign(payload, extra);

  await updateDoc(ref, payload);
}