"use server";

import { getSupabaseServer, getSupabaseAdmin } from "@/lib/supabase/server";
import { getUserChurchContext } from "@/lib/auth/getUserChurchContext";
import { getSessionUser } from "@/lib/auth/getSessionUser";

export interface KidRow {
  id: string;
  church_id: string;
  campus_id: string | null;
  first_name: string;
  last_name: string;
  dob: string | null;
  allergies: string | null;
  guardian_user_id: string | null;
  created_at: string;
}

export interface SessionRow {
  id: string;
  church_id: string;
  campus_id: string | null;
  name: string;
  starts_at: string;
  ends_at: string | null;
  created_at: string;
}

export interface CheckinRow {
  id: string;
  church_id: string;
  session_id: string;
  kid_id: string;
  checked_in_at: string;
  checked_out_at: string | null;
  pickup_code: string;
  created_at: string;
  // joined
  kid_first_name?: string;
  kid_last_name?: string;
  kid_allergies?: string | null;
}

export interface LabelTemplateRow {
  id: string;
  church_id: string;
  key: string;
  name: string;
  width_mm: number;
  height_mm: number;
  layout: Record<string, unknown>;
  created_at: string;
}

async function getChurchId(): Promise<string> {
  const session = await getSessionUser();
  if (!session) throw new Error("Authentication required.");
  const ctx = await getUserChurchContext(session.id);
  if (!ctx) throw new Error("No church membership.");
  return ctx.churchId;
}

export async function listKids(opts?: {
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
    .from("kids")
    .select("*", { count: "exact" })
    .eq("church_id", churchId)
    .order("last_name")
    .order("first_name")
    .range(offset, offset + limit - 1);

  if (opts?.search) {
    query = query.or(
      `first_name.ilike.%${opts.search}%,last_name.ilike.%${opts.search}%`,
    );
  }

  const { data, count } = await query;
  return { data: (data ?? []) as KidRow[], count: count ?? 0 };
}

export async function getKid(id: string) {
  const churchId = await getChurchId();
  const supabase = await getSupabaseServer();
  if (!supabase) return null;

  const { data } = await supabase
    .from("kids")
    .select("*")
    .eq("id", id)
    .eq("church_id", churchId)
    .single();

  return data as KidRow | null;
}

export async function listSessions(opts?: { offset?: number; limit?: number }) {
  const churchId = await getChurchId();
  const supabase = await getSupabaseServer();
  if (!supabase) return { data: [], count: 0 };

  const limit = opts?.limit ?? 50;
  const offset = opts?.offset ?? 0;

  const { data, count } = await supabase
    .from("kids_sessions")
    .select("*", { count: "exact" })
    .eq("church_id", churchId)
    .order("starts_at", { ascending: false })
    .range(offset, offset + limit - 1);

  return { data: (data ?? []) as SessionRow[], count: count ?? 0 };
}

export async function getSession(id: string) {
  const churchId = await getChurchId();
  const supabase = await getSupabaseServer();
  if (!supabase) return null;

  const { data } = await supabase
    .from("kids_sessions")
    .select("*")
    .eq("id", id)
    .eq("church_id", churchId)
    .single();

  return data as SessionRow | null;
}

export async function getSessionCheckins(sessionId: string): Promise<CheckinRow[]> {
  const churchId = await getChurchId();
  const admin = getSupabaseAdmin();
  if (!admin) return [];

  const { data: checkins } = await admin
    .from("kids_checkins")
    .select("*")
    .eq("session_id", sessionId)
    .eq("church_id", churchId)
    .order("checked_in_at");

  if (!checkins || checkins.length === 0) return [];

  const kidIds = [...new Set(checkins.map((c) => c.kid_id))];
  const { data: kids } = await admin
    .from("kids")
    .select("id, first_name, last_name, allergies")
    .in("id", kidIds);

  const kidMap = new Map(
    (kids ?? []).map((k) => [k.id, k]),
  );

  return checkins.map((c) => {
    const kid = kidMap.get(c.kid_id);
    return {
      ...c,
      kid_first_name: kid?.first_name,
      kid_last_name: kid?.last_name,
      kid_allergies: kid?.allergies,
    };
  }) as CheckinRow[];
}

export async function listLabelTemplates() {
  const churchId = await getChurchId();
  const admin = getSupabaseAdmin();
  if (!admin) return [];

  const { data } = await admin
    .from("label_templates")
    .select("*")
    .eq("church_id", churchId)
    .order("name");

  return (data ?? []) as LabelTemplateRow[];
}

export async function getLabelTemplate(id: string) {
  const churchId = await getChurchId();
  const admin = getSupabaseAdmin();
  if (!admin) return null;

  const { data } = await admin
    .from("label_templates")
    .select("*")
    .eq("id", id)
    .eq("church_id", churchId)
    .single();

  return data as LabelTemplateRow | null;
}
