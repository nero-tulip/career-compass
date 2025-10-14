import { NextResponse } from "next/server";
import { adminDb, AdminFieldValue } from "@/app/lib/firebaseAdmin";

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email);
}

export async function POST(req: Request) {
  try {
    const db = adminDb();
    const body = await req.json().catch(() => ({} as any));
    const { name, age, email, country } = body || {};

    if (!email || !isValidEmail(email)) {
      return NextResponse.json({ error: "invalid_email" }, { status: 400 });
    }
    if (!name || !age || !country) {
      return NextResponse.json({ error: "missing_fields" }, { status: 400 });
    }

    // Deduplicate by email (case-insensitive)
    const existing = await db
      .collection("waitlist_submissions")
      .where("email", "==", String(email).toLowerCase())
      .limit(1)
      .get();

    if (!existing.empty) {
      return NextResponse.json({ ok: true, duplicate: true });
    }

    await db.collection("waitlist_submissions").add({
      name: name.trim(),
      age: Number(age),
      email: String(email).toLowerCase(),
      country: country.trim(),
      createdAt: AdminFieldValue.serverTimestamp(),
    });

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    console.error("[waitlist] error:", e);
    return NextResponse.json({ error: "internal" }, { status: 500 });
  }
}
