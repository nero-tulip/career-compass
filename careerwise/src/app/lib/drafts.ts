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
/** Remove any undefined values recursively so Firestore never sees them */
function stripUndefined<T>(input: T): T {
  if (Array.isArray(input)) {
    return input
      .map(stripUndefined)
      .filter((v) => v !== undefined) as unknown as T;
  }
  if (input && typeof input === "object") {
    const out: any = {};
    for (const [k, v] of Object.entries(input as any)) {
      const cleaned = stripUndefined(v as any);
      if (cleaned !== undefined) out[k] = cleaned;
    }
    return out;
  }
  return (input === undefined ? (undefined as any) : input) as T;
}

/** Conservative “answered” counter that works for arrays or objects */
function countAnswered(data: unknown): number {
  if (Array.isArray(data)) {
    // Handles mixed answer shapes: {score}, {value: string}, {value: string[]}
    return data.filter((x) => {
      if (!x || typeof x !== "object") return false;
      const o = x as any;
      if (typeof o.score === "number") return true;
      if (typeof o.value === "string") return o.value.trim().length > 0;
      if (Array.isArray(o.value)) return o.value.length > 0;
      return false;
    }).length;
  }
  if (data && typeof data === "object") {
    // If you ever send an object map, count non-empty values
    return Object.values(data).filter((v) => {
      if (v === null || v === undefined) return false;
      if (typeof v === "string") return v.trim().length > 0;
      if (Array.isArray(v)) return v.length > 0;
      if (typeof v === "object") return Object.keys(v as any).length > 0;
      return true;
    }).length;
  }
  return 0;
}

/**
 * Save a quiz section to the user's draft.
 * Ensures no `undefined` goes to Firestore and `answered` is always a number.
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
  const answered = countAnswered(data); // ← always a number

  const payload: Record<string, unknown> = {
    [section]: data,
    updatedAt: now,
    ...(status ? { status } : {}),
    ...(extra || {}),
    [`sections.${section}`]: {
      status: status?.includes("done")
        ? "done"
        : status?.includes("progress")
        ? "in_progress"
        : "in_progress",
      answered,     // ← never undefined now
      updatedAt: now,
    },
  };

  // strip any undefined nested values before send
  const cleaned = stripUndefined(payload);

  await updateDoc(ref, cleaned as any);
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