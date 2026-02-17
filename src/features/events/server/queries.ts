"use server";

import { getSupabaseServer } from "@/lib/supabase/server";
import { getUserChurchContext } from "@/lib/auth/getUserChurchContext";
import { getSessionUser } from "@/lib/auth/getSessionUser";

export interface EventRow {
  id: string;
  church_id: string;
  campus_id: string | null;
  title: string;
  description: string | null;
  location: string | null;
  starts_at: string;
  ends_at: string | null;
  featured: boolean;
  capacity: number | null;
  created_at: string;
}

export interface RsvpRow {
  id: string;
  event_id: string;
  user_id: string | null;
  guest_name: string | null;
  guest_email: string | null;
  status: "yes" | "no" | "maybe";
  created_at: string;
}

async function getChurchId(): Promise<string> {
  const session = await getSessionUser();
  if (!session) throw new Error("Authentication required.");
  const ctx = await getUserChurchContext(session.id);
  if (!ctx) throw new Error("No church membership.");
  return ctx.churchId;
}

export async function listEvents(opts?: {
  upcoming?: boolean;
  search?: string;
  offset?: number;
  limit?: number;
}) {
  const churchId = await getChurchId();
  const supabase = await getSupabaseServer();
  if (!supabase) return { data: [], count: 0 };

  const limit = opts?.limit ?? 50;
  const offset = opts?.offset ?? 0;

  let query = supabase
    .from("events")
    .select("*", { count: "exact" })
    .eq("church_id", churchId)
    .order("starts_at", { ascending: true })
    .range(offset, offset + limit - 1);

  if (opts?.upcoming) {
    query = query.gte("starts_at", new Date().toISOString());
  }

  if (opts?.search) {
    query = query.or(
      `title.ilike.%${opts.search}%,location.ilike.%${opts.search}%`,
    );
  }

  const { data, count } = await query;
  return { data: (data ?? []) as EventRow[], count: count ?? 0 };
}

export async function getEvent(id: string) {
  const churchId = await getChurchId();
  const supabase = await getSupabaseServer();
  if (!supabase) return null;

  const { data } = await supabase
    .from("events")
    .select("*")
    .eq("id", id)
    .eq("church_id", churchId)
    .single();

  return data as EventRow | null;
}

export async function getEventRsvps(eventId: string) {
  const churchId = await getChurchId();
  const supabase = await getSupabaseServer();
  if (!supabase) return [];

  const { data } = await supabase
    .from("event_rsvps")
    .select("*")
    .eq("event_id", eventId)
    .eq("church_id", churchId)
    .order("created_at");

  return (data ?? []) as RsvpRow[];
}

export async function getUserRsvp(eventId: string, userId: string) {
  const churchId = await getChurchId();
  const supabase = await getSupabaseServer();
  if (!supabase) return null;

  const { data } = await supabase
    .from("event_rsvps")
    .select("*")
    .eq("event_id", eventId)
    .eq("user_id", userId)
    .eq("church_id", churchId)
    .single();

  return data as RsvpRow | null;
}

export async function getRsvpCounts(eventId: string) {
  const churchId = await getChurchId();
  const supabase = await getSupabaseServer();
  if (!supabase) return { yes: 0, no: 0, maybe: 0 };

  const { data } = await supabase
    .from("event_rsvps")
    .select("status")
    .eq("event_id", eventId)
    .eq("church_id", churchId);

  const counts = { yes: 0, no: 0, maybe: 0 };
  for (const r of data ?? []) {
    if (r.status in counts) counts[r.status as keyof typeof counts]++;
  }
  return counts;
}
