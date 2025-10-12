// src/app/api/stripe/webhook/route.ts
import Stripe from 'stripe';
import { NextRequest, NextResponse } from 'next/server';
import { initializeApp, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

if (!getApps().length) initializeApp();
const db = getFirestore();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

// Ensure Node.js runtime so we can read the raw body
export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  const sig = req.headers.get('stripe-signature') || '';
  const secret = process.env.STRIPE_WEBHOOK_SECRET!;
  let event: Stripe.Event;

  try {
    const raw = await req.text(); // raw body for signature verification
    event = stripe.webhooks.constructEvent(raw, sig, secret);
  } catch (err: any) {
    console.error('[stripe] webhook signature error', err?.message);
    return new NextResponse('Bad signature', { status: 400 });
  }

  try {
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;

      // We put uid in metadata/client_reference_id when creating the session
      const uid =
        (session.metadata?.uid as string) ||
        (session.client_reference_id as string) ||
        '';

      if (uid) {
        // Grant PRO
        await db.doc(`users/${uid}`).set({ entitlement: 'pro' }, { merge: true });

        // Optional: store payment record (use session.created from Stripe or ISO date)
        await db
          .collection(`users/${uid}/payments`)
          .doc(String(session.id))
          .set(
            {
              provider: 'stripe',
              sessionId: session.id,
              amount_total: session.amount_total,
              currency: session.currency,
              created_unix: session.created,             // Stripe’s Unix timestamp (seconds)
              created_iso: new Date().toISOString(),     // Your server time (optional)
              status: session.status,
              mode: session.mode,
            },
            { merge: true }
          );
      }
    }
  } catch (err) {
    console.error('[stripe] webhook handler error', err);
    return new NextResponse('Webhook handler failed', { status: 500 });
  }

  return new NextResponse('OK', { status: 200 });
}