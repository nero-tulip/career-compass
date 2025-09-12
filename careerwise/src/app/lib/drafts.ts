"use client";

import { doc, setDoc, updateDoc, serverTimestamp, getDoc } from "firebase/firestore";
import { db } from "@/app/lib/firebase";
import { User } from "firebase/auth";
import { v4 as uuid } from "uuid";

export type SectionId = "intake" | "macro" | "riasec";

export async function ensureDraft(user: User, rid?: string) {
  const id = rid || uuid();
  const ref = doc(db, "users", user.uid, "drafts", id);
  if (!rid) {
    await setDoc(ref, {
      status: "started",
      entitlement: "free",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    }, { merge: true });
  } else {
    const snap = await getDoc(ref);
    if (!snap.exists()) {
      await setDoc(ref, {
        status: "started",
        entitlement: "free",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      }, { merge: true });
    }
  }
  return { id, ref };
}

export async function saveSection(user: User, rid: string, section: SectionId, data: any, status?: string) {
  const ref = doc(db, "users", user.uid, "drafts", rid);
  await updateDoc(ref, {
    [section]: data,
    status: status || `${section}_done`,
    updatedAt: serverTimestamp(),
  });
}
