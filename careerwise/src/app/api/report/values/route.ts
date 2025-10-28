import "server-only";
import { NextResponse } from "next/server";
import { adminAuth } from "@/app/lib/firebaseAdmin";
import { generateValuesReport } from "@/app/lib/results/generators/generate-values-report";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const { rid } = await req.json();
    if (!rid) return NextResponse.json({ error: "Missing rid" }, { status: 400 });

    // Verify Firebase ID token from Authorization header
    const auth = req.headers.get("authorization") || "";
    const token = auth.startsWith("Bearer ") ? auth.slice(7) : null;
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const decoded = await adminAuth().verifyIdToken(token);
    const uid = decoded.uid as string;

    const report = await generateValuesReport(uid, rid);
    return NextResponse.json(report, { status: 200 });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message ?? "Failed to build values report" },
      { status: 500 }
    );
  }
}