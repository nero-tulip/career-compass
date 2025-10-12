// src/app/api/stripe/create-checkout-session/route.ts
import Stripe from "stripe";
import { NextRequest, NextResponse } from "next/server";
import { adminAuth } from "@/app/lib/firebaseAdmin";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(req: NextRequest) {
  try {
    const authz = req.headers.get("authorization") || "";
    const idToken = authz.startsWith("Bearer ") ? authz.slice(7) : "";
    if (!idToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const decoded = await adminAuth().verifyIdToken(idToken);
    const uid = decoded.uid;
    const email = decoded.email || undefined;

    const origin =
      req.headers.get("origin") ??
      process.env.NEXT_PUBLIC_APP_URL ??
      "http://localhost:3000";

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      allow_promotion_codes: true,
      line_items: [{ price: process.env.STRIPE_PRICE_ID!, quantity: 1 }],
      customer_email: email,
      client_reference_id: uid,
      metadata: { uid },
      success_url: `${origin}/app/pro/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/app/pro?from=checkout`,
    });

    return NextResponse.json({ url: session.url }, { status: 200 });
  } catch (err) {
    console.error("[stripe] create session error", err);
    return NextResponse.json({ error: "Failed to create session" }, { status: 500 });
  }
}