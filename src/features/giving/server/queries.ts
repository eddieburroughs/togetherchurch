"use server";

import { getSupabaseServer } from "@/lib/supabase/server";
import { getSessionUser } from "@/lib/auth/getSessionUser";
import { getUserChurchContext } from "@/lib/auth/getUserChurchContext";

export interface GivingPartnerRow {
  id: string;
  church_id: string;
  name: string;
  description: string | null;
  website_url: string | null;
  category: string | null;
  sort_order: number;
  is_active: boolean;
  created_at: string;
}

async function getChurchId(): Promise<string> {
  const session = await getSessionUser();
  if (!session) throw new Error("Authentication required.");
  const ctx = await getUserChurchContext(session.id);
  if (!ctx) throw new Error("No church membership.");
  return ctx.churchId;
}

export async function listGivingPartners(opts?: { activeOnly?: boolean }) {
  const churchId = await getChurchId();
  const supabase = await getSupabaseServer();
  if (!supabase) return [];

  let query = supabase
    .from("giving_partners")
    .select("*")
    .eq("church_id", churchId)
    .order("sort_order")
    .order("name");

  if (opts?.activeOnly) {
    query = query.eq("is_active", true);
  }

  const { data } = await query;
  return (data ?? []) as GivingPartnerRow[];
}

export async function getGivingPartner(id: string) {
  const churchId = await getChurchId();
  const supabase = await getSupabaseServer();
  if (!supabase) return null;

  const { data } = await supabase
    .from("giving_partners")
    .select("*")
    .eq("id", id)
    .eq("church_id", churchId)
    .single();

  return data as GivingPartnerRow | null;
}
