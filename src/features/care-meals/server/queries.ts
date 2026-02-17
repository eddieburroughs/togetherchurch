"use server";

import { getSupabaseServer, getSupabaseAdmin } from "@/lib/supabase/server";
import { getUserChurchContext } from "@/lib/auth/getUserChurchContext";
import { getSessionUser } from "@/lib/auth/getSessionUser";

export interface TrainRow {
  id: string;
  church_id: string;
  campus_id: string | null;
  title: string;
  description: string | null;
  start_date: string;
  end_date: string;
  created_at: string;
}

export interface SlotRow {
  id: string;
  church_id: string;
  train_id: string;
  slot_date: string;
  slot_label: string;
  capacity: number;
  notes: string | null;
  created_at: string;
  signups?: SignupRow[];
}

export interface SignupRow {
  id: string;
  church_id: string;
  slot_id: string;
  user_id: string;
  note: string | null;
  created_at: string;
  display_name?: string;
}

async function getChurchId(): Promise<string> {
  const session = await getSessionUser();
  if (!session) throw new Error("Authentication required.");
  const ctx = await getUserChurchContext(session.id);
  if (!ctx) throw new Error("No church membership.");
  return ctx.churchId;
}

export async function listTrains(opts?: {
  active?: boolean;
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
    .from("care_trains")
    .select("*", { count: "exact" })
    .eq("church_id", churchId)
    .order("start_date", { ascending: false })
    .range(offset, offset + limit - 1);

  if (opts?.active) {
    query = query.gte("end_date", new Date().toISOString().slice(0, 10));
  }

  if (opts?.search) {
    query = query.ilike("title", `%${opts.search}%`);
  }

  const { data, count } = await query;
  return { data: (data ?? []) as TrainRow[], count: count ?? 0 };
}

export async function getTrain(id: string) {
  const churchId = await getChurchId();
  const supabase = await getSupabaseServer();
  if (!supabase) return null;

  const { data } = await supabase
    .from("care_trains")
    .select("*")
    .eq("id", id)
    .eq("church_id", churchId)
    .single();

  return data as TrainRow | null;
}

export async function getTrainSlots(trainId: string): Promise<SlotRow[]> {
  const admin = getSupabaseAdmin();
  if (!admin) return [];

  const { data: slots } = await admin
    .from("care_slots")
    .select("*")
    .eq("train_id", trainId)
    .order("slot_date")
    .order("slot_label");

  if (!slots || slots.length === 0) return [];

  // Fetch all signups for these slots
  const slotIds = slots.map((s) => s.id);
  const { data: signups } = await admin
    .from("care_signups")
    .select("*")
    .in("slot_id", slotIds)
    .order("created_at");

  // Fetch display names for signed-up users
  const userIds = [
    ...new Set((signups ?? []).map((s) => s.user_id)),
  ];
  const profileMap = new Map<string, string>();

  if (userIds.length > 0) {
    const { data: profiles } = await admin
      .from("profiles")
      .select("user_id, display_name, email")
      .in("user_id", userIds);

    for (const p of profiles ?? []) {
      profileMap.set(p.user_id, p.display_name ?? p.email ?? "Member");
    }
  }

  const signupsBySlot = new Map<string, SignupRow[]>();
  for (const s of signups ?? []) {
    const list = signupsBySlot.get(s.slot_id) ?? [];
    list.push({
      ...s,
      display_name: profileMap.get(s.user_id) ?? "Member",
    });
    signupsBySlot.set(s.slot_id, list);
  }

  return slots.map((s) => ({
    ...s,
    signups: signupsBySlot.get(s.id) ?? [],
  })) as SlotRow[];
}
