"use server";

import { getSupabaseServer } from "@/lib/supabase/server";
import { getUserChurchContext } from "@/lib/auth/getUserChurchContext";
import { getSessionUser } from "@/lib/auth/getSessionUser";

async function getChurchId(): Promise<string> {
  const session = await getSessionUser();
  if (!session) throw new Error("Authentication required.");
  const ctx = await getUserChurchContext(session.id);
  if (!ctx) throw new Error("No church membership.");
  return ctx.churchId;
}

export interface TicketTypeRow {
  id: string;
  church_id: string;
  event_id: string;
  name: string;
  description: string | null;
  price_cents: number;
  capacity: number | null;
  sort_order: number;
  active: boolean;
  created_at: string;
}

export interface TicketOrderRow {
  id: string;
  church_id: string;
  event_id: string;
  user_id: string;
  status: "pending" | "completed" | "cancelled" | "refunded";
  total_cents: number;
  stripe_payment_intent: string | null;
  confirmation_code: string;
  created_at: string;
}

export interface TicketOrderItemRow {
  id: string;
  order_id: string;
  ticket_type_id: string;
  quantity: number;
  unit_price_cents: number;
}

export interface StripeConnectRow {
  id: string;
  church_id: string;
  stripe_account_id: string;
  charges_enabled: boolean;
  details_submitted: boolean;
}

export async function listTicketTypes(eventId: string) {
  const churchId = await getChurchId();
  const supabase = await getSupabaseServer();
  if (!supabase) return [];

  const { data } = await supabase
    .from("ticket_types")
    .select("*")
    .eq("event_id", eventId)
    .eq("church_id", churchId)
    .order("sort_order")
    .order("created_at");

  return (data ?? []) as TicketTypeRow[];
}

export async function getTicketType(id: string) {
  const churchId = await getChurchId();
  const supabase = await getSupabaseServer();
  if (!supabase) return null;

  const { data } = await supabase
    .from("ticket_types")
    .select("*")
    .eq("id", id)
    .eq("church_id", churchId)
    .single();

  return data as TicketTypeRow | null;
}

export async function listEventOrders(eventId: string) {
  const churchId = await getChurchId();
  const supabase = await getSupabaseServer();
  if (!supabase) return [];

  const { data } = await supabase
    .from("ticket_orders")
    .select("*")
    .eq("event_id", eventId)
    .eq("church_id", churchId)
    .order("created_at", { ascending: false });

  return (data ?? []) as TicketOrderRow[];
}

export async function getOrder(id: string) {
  const churchId = await getChurchId();
  const supabase = await getSupabaseServer();
  if (!supabase) return null;

  const { data } = await supabase
    .from("ticket_orders")
    .select("*")
    .eq("id", id)
    .eq("church_id", churchId)
    .single();

  return data as TicketOrderRow | null;
}

export async function getOrderItems(orderId: string) {
  const churchId = await getChurchId();
  const supabase = await getSupabaseServer();
  if (!supabase) return [];

  // Verify order belongs to church before returning items
  const { data: order } = await supabase
    .from("ticket_orders")
    .select("id")
    .eq("id", orderId)
    .eq("church_id", churchId)
    .single();

  if (!order) return [];

  const { data } = await supabase
    .from("ticket_order_items")
    .select("*")
    .eq("order_id", orderId);

  return (data ?? []) as TicketOrderItemRow[];
}

export async function getUserOrderForEvent(eventId: string, userId: string) {
  const churchId = await getChurchId();
  const supabase = await getSupabaseServer();
  if (!supabase) return null;

  const { data } = await supabase
    .from("ticket_orders")
    .select("*")
    .eq("event_id", eventId)
    .eq("user_id", userId)
    .eq("church_id", churchId)
    .in("status", ["completed", "pending"])
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return data as TicketOrderRow | null;
}

export async function getStripeConnect() {
  const churchId = await getChurchId();
  const supabase = await getSupabaseServer();
  if (!supabase) return null;

  const { data } = await supabase
    .from("stripe_connect_accounts")
    .select("*")
    .eq("church_id", churchId)
    .single();

  return data as StripeConnectRow | null;
}

export async function getTicketSoldCount(ticketTypeId: string) {
  const churchId = await getChurchId();
  const supabase = await getSupabaseServer();
  if (!supabase) return 0;

  // Verify ticket type belongs to church
  const { data: tt } = await supabase
    .from("ticket_types")
    .select("id")
    .eq("id", ticketTypeId)
    .eq("church_id", churchId)
    .single();

  if (!tt) return 0;

  const { data } = await supabase
    .from("ticket_order_items")
    .select("quantity, order_id")
    .eq("ticket_type_id", ticketTypeId);

  if (!data || data.length === 0) return 0;

  // Only count items from completed orders
  const orderIds = [...new Set(data.map((d) => d.order_id))];
  const { data: orders } = await supabase
    .from("ticket_orders")
    .select("id, status")
    .in("id", orderIds)
    .eq("status", "completed");

  const completedOrderIds = new Set((orders ?? []).map((o) => o.id));
  return data
    .filter((d) => completedOrderIds.has(d.order_id))
    .reduce((sum, d) => sum + d.quantity, 0);
}

export async function getEventCheckins(eventId: string) {
  const churchId = await getChurchId();
  const supabase = await getSupabaseServer();
  if (!supabase) return [];

  const { data } = await supabase
    .from("ticket_checkins")
    .select("*")
    .eq("event_id", eventId)
    .eq("church_id", churchId)
    .order("checked_in_at", { ascending: false });

  return (data ?? []) as { id: string; order_id: string; event_id: string; checked_in_at: string }[];
}

export async function getOrderByConfirmationCode(confirmationCode: string) {
  const churchId = await getChurchId();
  const supabase = await getSupabaseServer();
  if (!supabase) return null;

  const { data } = await supabase
    .from("ticket_orders")
    .select("*")
    .eq("confirmation_code", confirmationCode)
    .eq("church_id", churchId)
    .single();

  return data as TicketOrderRow | null;
}
