"use server";

import { getSupabaseServer } from "@/lib/supabase/server";
import { getUserChurchContext } from "@/lib/auth/getUserChurchContext";
import { getSessionUser } from "@/lib/auth/getSessionUser";

export interface PersonRow {
  id: string;
  first_name: string;
  last_name: string;
  email: string | null;
  phone: string | null;
  status: string;
  household_id: string | null;
  created_at: string;
}

export interface HouseholdRow {
  id: string;
  name: string;
  created_at: string;
  member_count?: number;
}

export interface TagRow {
  id: string;
  name: string;
  created_at: string;
}

async function getChurchId(): Promise<string> {
  const session = await getSessionUser();
  if (!session) throw new Error("Authentication required.");
  const ctx = await getUserChurchContext(session.id);
  if (!ctx) throw new Error("No church membership.");
  return ctx.churchId;
}

export async function listPeople(search?: string, offset = 0, limit = 50) {
  const churchId = await getChurchId();
  const supabase = await getSupabaseServer();
  if (!supabase) return { data: [], count: 0 };

  let query = supabase
    .from("people")
    .select("id, first_name, last_name, email, phone, status, household_id, created_at", { count: "exact" })
    .eq("church_id", churchId)
    .order("last_name")
    .order("first_name")
    .range(offset, offset + limit - 1);

  if (search) {
    query = query.or(
      `first_name.ilike.%${search}%,last_name.ilike.%${search}%,email.ilike.%${search}%,phone.ilike.%${search}%`,
    );
  }

  const { data, count } = await query;
  return { data: (data ?? []) as PersonRow[], count: count ?? 0 };
}

export async function getPerson(id: string) {
  const churchId = await getChurchId();
  const supabase = await getSupabaseServer();
  if (!supabase) return null;

  const { data } = await supabase
    .from("people")
    .select("*")
    .eq("id", id)
    .eq("church_id", churchId)
    .single();

  return data;
}

export async function getPersonTags(personId: string) {
  const supabase = await getSupabaseServer();
  if (!supabase) return [];

  const { data } = await supabase
    .from("person_tags")
    .select("tag_id, tags(id, name)")
    .eq("person_id", personId);

  return (data ?? []).map((row) => {
    const tag = row.tags as unknown as { id: string; name: string };
    return { id: tag.id, name: tag.name };
  });
}

export async function listHouseholds(search?: string) {
  const churchId = await getChurchId();
  const supabase = await getSupabaseServer();
  if (!supabase) return [];

  let query = supabase
    .from("households")
    .select("id, name, created_at")
    .eq("church_id", churchId)
    .order("name");

  if (search) {
    query = query.ilike("name", `%${search}%`);
  }

  const { data } = await query;
  return (data ?? []) as HouseholdRow[];
}

export async function listTags(search?: string) {
  const churchId = await getChurchId();
  const supabase = await getSupabaseServer();
  if (!supabase) return [];

  let query = supabase
    .from("tags")
    .select("id, name, created_at")
    .eq("church_id", churchId)
    .order("name");

  if (search) {
    query = query.ilike("name", `%${search}%`);
  }

  const { data } = await query;
  return (data ?? []) as TagRow[];
}
