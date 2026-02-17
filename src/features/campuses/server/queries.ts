"use server";

import { getSupabaseServer } from "@/lib/supabase/server";
import { getUserChurchContext } from "@/lib/auth/getUserChurchContext";
import { getSessionUser } from "@/lib/auth/getSessionUser";

export interface CampusRow {
  id: string;
  church_id: string;
  name: string;
  is_default: boolean;
  created_at: string;
}

async function getChurchId(): Promise<string> {
  const session = await getSessionUser();
  if (!session) throw new Error("Authentication required.");
  const ctx = await getUserChurchContext(session.id);
  if (!ctx) throw new Error("No church membership.");
  return ctx.churchId;
}

export async function listCampuses() {
  const churchId = await getChurchId();
  const supabase = await getSupabaseServer();
  if (!supabase) return [];

  const { data } = await supabase
    .from("campuses")
    .select("*")
    .eq("church_id", churchId)
    .order("is_default", { ascending: false })
    .order("name");

  return (data ?? []) as CampusRow[];
}

export async function getCampus(id: string) {
  const churchId = await getChurchId();
  const supabase = await getSupabaseServer();
  if (!supabase) return null;

  const { data } = await supabase
    .from("campuses")
    .select("*")
    .eq("id", id)
    .eq("church_id", churchId)
    .single();

  return data as CampusRow | null;
}

export async function getCampusMode(): Promise<"off" | "optional" | "required"> {
  const churchId = await getChurchId();
  const supabase = await getSupabaseServer();
  if (!supabase) return "off";

  const { data } = await supabase
    .from("church_settings")
    .select("campus_mode")
    .eq("church_id", churchId)
    .single();

  return (data?.campus_mode as "off" | "optional" | "required") ?? "off";
}
