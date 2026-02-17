"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getSessionUser } from "@/lib/auth/getSessionUser";
import { getUserChurchContext } from "@/lib/auth/getUserChurchContext";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { requireFeature } from "@/lib/features/requireFeature";
import { logAudit } from "@/lib/audit/logAudit";
import { ENV } from "@/lib/env";

function generateConfirmationCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 8; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

// ---------------------------------------------------------------------------
// Ticket Type CRUD
// ---------------------------------------------------------------------------

export async function createTicketType(eventId: string, formData: FormData) {
  const { ctx } = await requireFeature("engage.events.tickets");

  const admin = getSupabaseAdmin();
  if (!admin) throw new Error("Server not configured.");

  const name = (formData.get("name") as string)?.trim();
  if (!name) throw new Error("Name is required.");

  const priceCents = Math.round(
    parseFloat(formData.get("price") as string || "0") * 100,
  );

  // If price > 0, ensure Stripe Connect is set up
  if (priceCents > 0) {
    const { data: connect } = await admin
      .from("stripe_connect_accounts")
      .select("charges_enabled")
      .eq("church_id", ctx.churchId)
      .single();

    if (!connect?.charges_enabled) {
      throw new Error("Connect your Stripe account before creating paid tickets.");
    }
  }

  const { error } = await admin.from("ticket_types").insert({
    church_id: ctx.churchId,
    event_id: eventId,
    name,
    description: (formData.get("description") as string)?.trim() || null,
    price_cents: priceCents,
    capacity: formData.get("capacity")
      ? parseInt(formData.get("capacity") as string, 10)
      : null,
    sort_order: parseInt(formData.get("sort_order") as string || "0", 10),
    active: true,
  });

  if (error) throw new Error(error.message);
  revalidatePath(`/admin/events/${eventId}/tickets`);
}

export async function updateTicketType(id: string, formData: FormData) {
  const { ctx } = await requireFeature("engage.events.tickets");

  const admin = getSupabaseAdmin();
  if (!admin) throw new Error("Server not configured.");

  const name = (formData.get("name") as string)?.trim();
  if (!name) throw new Error("Name is required.");

  const priceCents = Math.round(
    parseFloat(formData.get("price") as string || "0") * 100,
  );

  if (priceCents > 0) {
    const { data: connect } = await admin
      .from("stripe_connect_accounts")
      .select("charges_enabled")
      .eq("church_id", ctx.churchId)
      .single();

    if (!connect?.charges_enabled) {
      throw new Error("Connect your Stripe account before setting a paid price.");
    }
  }

  const { error } = await admin
    .from("ticket_types")
    .update({
      name,
      description: (formData.get("description") as string)?.trim() || null,
      price_cents: priceCents,
      capacity: formData.get("capacity")
        ? parseInt(formData.get("capacity") as string, 10)
        : null,
      sort_order: parseInt(formData.get("sort_order") as string || "0", 10),
      active: formData.get("active") === "on",
    })
    .eq("id", id)
    .eq("church_id", ctx.churchId);

  if (error) throw new Error(error.message);
  revalidatePath(`/admin/events`);
}

export async function deleteTicketType(id: string, eventId: string) {
  const { ctx } = await requireFeature("engage.events.tickets");

  const admin = getSupabaseAdmin();
  if (!admin) throw new Error("Server not configured.");

  await admin
    .from("ticket_types")
    .delete()
    .eq("id", id)
    .eq("church_id", ctx.churchId);

  revalidatePath(`/admin/events/${eventId}/tickets`);
}

// ---------------------------------------------------------------------------
// Place Order (Free tickets)
// ---------------------------------------------------------------------------

export async function placeOrderFree(
  eventId: string,
  items: { ticketTypeId: string; quantity: number }[],
) {
  const session = await getSessionUser();
  if (!session) throw new Error("Authentication required.");
  const ctx = await getUserChurchContext(session.id);
  if (!ctx) throw new Error("No church membership.");

  const admin = getSupabaseAdmin();
  if (!admin) throw new Error("Server not configured.");

  // Verify all items are free and have capacity
  for (const item of items) {
    const { data: tt } = await admin
      .from("ticket_types")
      .select("price_cents, capacity, id, event_id")
      .eq("id", item.ticketTypeId)
      .eq("event_id", eventId)
      .single();

    if (!tt) throw new Error("Ticket type not found.");
    if (tt.price_cents > 0) throw new Error("Use paid checkout for paid tickets.");

    if (tt.capacity !== null) {
      // Check remaining capacity
      const { data: soldItems } = await admin
        .from("ticket_order_items")
        .select("quantity, order_id")
        .eq("ticket_type_id", item.ticketTypeId);

      if (soldItems && soldItems.length > 0) {
        const orderIds = [...new Set(soldItems.map((s) => s.order_id))];
        const { data: completed } = await admin
          .from("ticket_orders")
          .select("id")
          .in("id", orderIds)
          .eq("status", "completed");

        const completedIds = new Set((completed ?? []).map((o) => o.id));
        const sold = soldItems
          .filter((s) => completedIds.has(s.order_id))
          .reduce((sum, s) => sum + s.quantity, 0);

        if (sold + item.quantity > tt.capacity) {
          throw new Error(`Not enough capacity for "${tt.id}".`);
        }
      }
    }
  }

  const confirmationCode = generateConfirmationCode();

  const { data: order, error: orderError } = await admin
    .from("ticket_orders")
    .insert({
      church_id: ctx.churchId,
      event_id: eventId,
      user_id: session.id,
      status: "completed",
      total_cents: 0,
      confirmation_code: confirmationCode,
    })
    .select("id")
    .single();

  if (orderError || !order) throw new Error(orderError?.message ?? "Failed to create order.");

  const orderItems = items.map((item) => ({
    order_id: order.id,
    ticket_type_id: item.ticketTypeId,
    quantity: item.quantity,
    unit_price_cents: 0,
  }));

  await admin.from("ticket_order_items").insert(orderItems);

  revalidatePath(`/dashboard/events/${eventId}`);
  return { orderId: order.id, confirmationCode };
}

// ---------------------------------------------------------------------------
// Place Order (Paid tickets via Stripe)
// ---------------------------------------------------------------------------

export async function createPaymentIntent(
  eventId: string,
  items: { ticketTypeId: string; quantity: number }[],
) {
  const session = await getSessionUser();
  if (!session) throw new Error("Authentication required.");
  const ctx = await getUserChurchContext(session.id);
  if (!ctx) throw new Error("No church membership.");

  const admin = getSupabaseAdmin();
  if (!admin) throw new Error("Server not configured.");

  if (!ENV.STRIPE_SECRET_KEY) throw new Error("Stripe not configured.");

  // Get connect account
  const { data: connect } = await admin
    .from("stripe_connect_accounts")
    .select("stripe_account_id, charges_enabled")
    .eq("church_id", ctx.churchId)
    .single();

  if (!connect?.charges_enabled) {
    throw new Error("Church Stripe account not ready.");
  }

  // Calculate total
  let totalCents = 0;
  for (const item of items) {
    const { data: tt } = await admin
      .from("ticket_types")
      .select("price_cents, capacity")
      .eq("id", item.ticketTypeId)
      .eq("event_id", eventId)
      .single();

    if (!tt) throw new Error("Ticket type not found.");
    totalCents += tt.price_cents * item.quantity;
  }

  if (totalCents <= 0) throw new Error("Use free checkout for free tickets.");

  const confirmationCode = generateConfirmationCode();

  // Create order in pending state
  const { data: order, error: orderError } = await admin
    .from("ticket_orders")
    .insert({
      church_id: ctx.churchId,
      event_id: eventId,
      user_id: session.id,
      status: "pending",
      total_cents: totalCents,
      confirmation_code: confirmationCode,
    })
    .select("id")
    .single();

  if (orderError || !order) throw new Error(orderError?.message ?? "Failed to create order.");

  const orderItems = items.map((item) => ({
    order_id: order.id,
    ticket_type_id: item.ticketTypeId,
    quantity: item.quantity,
    unit_price_cents: 0, // Will be filled after
  }));

  // Set actual unit prices
  for (const oi of orderItems) {
    const { data: tt } = await admin
      .from("ticket_types")
      .select("price_cents")
      .eq("id", oi.ticket_type_id)
      .single();
    oi.unit_price_cents = tt?.price_cents ?? 0;
  }

  await admin.from("ticket_order_items").insert(orderItems);

  // Create Stripe Payment Intent via REST API
  const params = new URLSearchParams();
  params.append("amount", totalCents.toString());
  params.append("currency", "usd");
  params.append("metadata[order_id]", order.id);
  params.append("metadata[church_id]", ctx.churchId);

  const resp = await fetch("https://api.stripe.com/v1/payment_intents", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${ENV.STRIPE_SECRET_KEY}`,
      "Stripe-Account": connect.stripe_account_id,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: params.toString(),
  });

  if (!resp.ok) {
    const err = await resp.json();
    throw new Error(err.error?.message ?? "Failed to create payment intent.");
  }

  const pi = await resp.json();

  // Store payment intent ID on the order
  await admin
    .from("ticket_orders")
    .update({ stripe_payment_intent: pi.id })
    .eq("id", order.id);

  return {
    clientSecret: pi.client_secret as string,
    orderId: order.id,
    confirmationCode,
  };
}

// ---------------------------------------------------------------------------
// Stripe Connect Onboarding
// ---------------------------------------------------------------------------

export async function createStripeConnectAccount() {
  const { ctx } = await requireFeature("engage.events.tickets");

  const admin = getSupabaseAdmin();
  if (!admin) throw new Error("Server not configured.");
  if (!ENV.STRIPE_SECRET_KEY) throw new Error("Stripe not configured.");

  // Check if already exists
  const { data: existing } = await admin
    .from("stripe_connect_accounts")
    .select("stripe_account_id")
    .eq("church_id", ctx.churchId)
    .single();

  let accountId: string;

  if (existing) {
    accountId = existing.stripe_account_id;
  } else {
    // Create connected account
    const params = new URLSearchParams();
    params.append("type", "standard");

    const resp = await fetch("https://api.stripe.com/v1/accounts", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${ENV.STRIPE_SECRET_KEY}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params.toString(),
    });

    if (!resp.ok) {
      const err = await resp.json();
      throw new Error(err.error?.message ?? "Failed to create Stripe account.");
    }

    const account = await resp.json();
    accountId = account.id;

    await admin.from("stripe_connect_accounts").insert({
      church_id: ctx.churchId,
      stripe_account_id: accountId,
    });
  }

  // Create account link for onboarding
  const linkParams = new URLSearchParams();
  linkParams.append("account", accountId);
  linkParams.append("refresh_url", `${ENV.SITE_URL}/admin/settings/stripe-connect`);
  linkParams.append("return_url", `${ENV.SITE_URL}/admin/settings/stripe-connect`);
  linkParams.append("type", "account_onboarding");

  const linkResp = await fetch("https://api.stripe.com/v1/account_links", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${ENV.STRIPE_SECRET_KEY}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: linkParams.toString(),
  });

  if (!linkResp.ok) {
    const err = await linkResp.json();
    throw new Error(err.error?.message ?? "Failed to create onboarding link.");
  }

  const link = await linkResp.json();
  return { url: link.url as string };
}

export async function refreshStripeConnectStatus() {
  const { ctx } = await requireFeature("engage.events.tickets");

  const admin = getSupabaseAdmin();
  if (!admin) throw new Error("Server not configured.");
  if (!ENV.STRIPE_SECRET_KEY) throw new Error("Stripe not configured.");

  const { data: connect } = await admin
    .from("stripe_connect_accounts")
    .select("stripe_account_id")
    .eq("church_id", ctx.churchId)
    .single();

  if (!connect) return null;

  // Fetch account from Stripe
  const resp = await fetch(
    `https://api.stripe.com/v1/accounts/${connect.stripe_account_id}`,
    {
      headers: {
        Authorization: `Bearer ${ENV.STRIPE_SECRET_KEY}`,
      },
    },
  );

  if (!resp.ok) throw new Error("Failed to fetch Stripe account.");

  const account = await resp.json();

  await admin
    .from("stripe_connect_accounts")
    .update({
      charges_enabled: account.charges_enabled ?? false,
      details_submitted: account.details_submitted ?? false,
      updated_at: new Date().toISOString(),
    })
    .eq("church_id", ctx.churchId);

  revalidatePath("/admin/settings/stripe-connect");
  return {
    chargesEnabled: account.charges_enabled as boolean,
    detailsSubmitted: account.details_submitted as boolean,
  };
}

// ---------------------------------------------------------------------------
// Refunds
// ---------------------------------------------------------------------------

export async function refundOrder(orderId: string) {
  const { session, ctx } = await requireFeature("engage.events.tickets");

  const admin = getSupabaseAdmin();
  if (!admin) throw new Error("Server not configured.");

  const { data: order } = await admin
    .from("ticket_orders")
    .select("id, status, total_cents, stripe_payment_intent, event_id, church_id, confirmation_code")
    .eq("id", orderId)
    .eq("church_id", ctx.churchId)
    .single();

  if (!order) throw new Error("Order not found.");
  if (order.status === "refunded") throw new Error("Order is already refunded.");
  if (order.status !== "completed") throw new Error("Only completed orders can be refunded.");

  // If paid order, issue Stripe refund
  if (order.total_cents > 0 && order.stripe_payment_intent) {
    if (!ENV.STRIPE_SECRET_KEY) throw new Error("Stripe not configured.");

    // Get connected account
    const { data: connect } = await admin
      .from("stripe_connect_accounts")
      .select("stripe_account_id")
      .eq("church_id", ctx.churchId)
      .single();

    if (!connect) throw new Error("Stripe Connect account not found.");

    const params = new URLSearchParams();
    params.append("payment_intent", order.stripe_payment_intent);

    const resp = await fetch("https://api.stripe.com/v1/refunds", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${ENV.STRIPE_SECRET_KEY}`,
        "Stripe-Account": connect.stripe_account_id,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params.toString(),
    });

    if (!resp.ok) {
      const err = await resp.json();
      throw new Error(err.error?.message ?? "Failed to process refund.");
    }
  }

  // Update order status
  await admin
    .from("ticket_orders")
    .update({
      status: "refunded",
      updated_at: new Date().toISOString(),
    })
    .eq("id", orderId);

  await logAudit({
    churchId: ctx.churchId,
    userId: session.id,
    action: "order.refunded",
    targetType: "order",
    targetId: orderId,
    meta: {
      confirmation_code: order.confirmation_code,
      amount_cents: order.total_cents,
      event_id: order.event_id,
    },
  });

  revalidatePath(`/admin/events/${order.event_id}/orders`);
  revalidatePath(`/admin/events/${order.event_id}/checkin`);
}

// ---------------------------------------------------------------------------
// Check-in
// ---------------------------------------------------------------------------

export async function checkInByConfirmationCode(
  eventId: string,
  confirmationCode: string,
) {
  const { session, ctx } = await requireFeature("engage.events.tickets");

  const admin = getSupabaseAdmin();
  if (!admin) throw new Error("Server not configured.");

  const { data: order } = await admin
    .from("ticket_orders")
    .select("id, status, event_id, church_id")
    .eq("confirmation_code", confirmationCode.toUpperCase())
    .eq("event_id", eventId)
    .eq("church_id", ctx.churchId)
    .single();

  if (!order) throw new Error("Order not found.");
  if (order.status !== "completed") throw new Error("Order is not completed.");

  // Check if already checked in
  const { data: existing } = await admin
    .from("ticket_checkins")
    .select("id")
    .eq("order_id", order.id)
    .eq("event_id", eventId)
    .single();

  if (existing) throw new Error("Already checked in.");

  await admin.from("ticket_checkins").insert({
    church_id: ctx.churchId,
    order_id: order.id,
    event_id: eventId,
    checked_in_by: session.id,
  });

  revalidatePath(`/admin/events/${eventId}/checkin`);
  return { orderId: order.id };
}
