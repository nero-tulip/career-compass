"use client";

import { doc, setDoc, updateDoc, serverTimestamp, getDoc } from "firebase/firestore";
import { db } from "@/app/lib/firebase";
import type { User } from "firebase/auth";

export type SectionId = "intake" | "macro" | "riasec" | "big5";

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
 * @param section "intake" | "macro" | "riasec" | "big5"
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

  const now = serverTimestamp();

  const payload: Record<string, unknown> = {
    [section]: data,
    updatedAt: now,
  };

  // Legacy coarse status (still written so nothing breaks)
  if (status) payload.status = status;
  if (extra) Object.assign(payload, extra);

  // New per-section checklist map
  payload[`sections.${section}`] = {
    status: status?.includes("done")
      ? "done"
      : status?.includes("progress")
      ? "in_progress"
      : "in_progress",
    answered: Array.isArray(data) ? data.length : undefined,
    updatedAt: now,
  };

  await updateDoc(ref, payload);
}

/**
 * Load a section's saved answers via the API (auth required).
 * Returns the raw data you stored (array/object), or null if none.
 */
export async function loadSection(
  user: { getIdToken?: () => Promise<string> } | null | undefined,
  rid: string,
  section: SectionId
): Promise<any | null> {
  if (!user) throw new Error("unauthenticated");
  const token = await user.getIdToken?.();
  const res = await fetch(
    `/api/quiz/section?rid=${encodeURIComponent(rid)}&section=${encodeURIComponent(section)}`,
    { headers: { Authorization: "Bearer " + token } }
  );
  if (!res.ok) return null;
  const data = await res.json().catch(() => null);
  return data?.data ?? null;
}