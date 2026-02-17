import { NextRequest, NextResponse } from "next/server";
import { ENV } from "@/lib/env";
import { getSupabaseAdmin } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  const body = await request.text();
  const sig = request.headers.get("stripe-signature");

  if (!sig || !ENV.STRIPE_WEBHOOK_SECRET || !ENV.STRIPE_SECRET_KEY) {
    return NextResponse.json({ error: "Not configured" }, { status: 400 });
  }

  // Verify webhook signature using Stripe's recommended method
  // We'll use the raw crypto approach to avoid needing the Stripe SDK
  const crypto = await import("crypto");
  const elements = sig.split(",");
  const timestamp = elements.find((e) => e.startsWith("t="))?.split("=")[1];
  const v1Signature = elements.find((e) => e.startsWith("v1="))?.split("=")[1];

  if (!timestamp || !v1Signature) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const signedPayload = `${timestamp}.${body}`;
  const expectedSignature = crypto
    .createHmac("sha256", ENV.STRIPE_WEBHOOK_SECRET)
    .update(signedPayload)
    .digest("hex");

  if (expectedSignature !== v1Signature) {
    return NextResponse.json({ error: "Signature mismatch" }, { status: 400 });
  }

  // Check timestamp is within 5 minutes
  const eventAge = Math.floor(Date.now() / 1000) - parseInt(timestamp, 10);
  if (eventAge > 300) {
    return NextResponse.json({ error: "Event too old" }, { status: 400 });
  }

  const event = JSON.parse(body);
  const admin = getSupabaseAdmin();
  if (!admin) {
    return NextResponse.json({ error: "DB not configured" }, { status: 500 });
  }

  switch (event.type) {
    case "payment_intent.succeeded": {
      const pi = event.data.object;
      const orderId = pi.metadata?.order_id;
      if (orderId) {
        await admin
          .from("ticket_orders")
          .update({
            status: "completed",
            updated_at: new Date().toISOString(),
          })
          .eq("id", orderId)
          .eq("stripe_payment_intent", pi.id);
      }
      break;
    }

    case "payment_intent.payment_failed": {
      const pi = event.data.object;
      const orderId = pi.metadata?.order_id;
      if (orderId) {
        await admin
          .from("ticket_orders")
          .update({
            status: "cancelled",
            updated_at: new Date().toISOString(),
          })
          .eq("id", orderId)
          .eq("stripe_payment_intent", pi.id);
      }
      break;
    }

    case "account.updated": {
      // Stripe Connect account status changed
      const account = event.data.object;
      await admin
        .from("stripe_connect_accounts")
        .update({
          charges_enabled: account.charges_enabled ?? false,
          details_submitted: account.details_submitted ?? false,
          updated_at: new Date().toISOString(),
        })
        .eq("stripe_account_id", account.id);
      break;
    }
  }

  return NextResponse.json({ received: true });
}
