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
  people_count?: number;
}

async function getChurchId(): Promise<string> {
  const session = await getSessionUser();
  if (!session) throw new Error("Authentication required.");
  const ctx = await getUserChurchContext(session.id);
  if (!ctx) throw new Error("No church membership.");
  return ctx.churchId;
}

export async function listPeople(
  search?: string,
  offset = 0,
  limit = 50,
  opts?: { tagId?: string; householdId?: string },
) {
  const churchId = await getChurchId();
  const supabase = await getSupabaseServer();
  if (!supabase) return { data: [], count: 0 };

  // When filtering by tag, we need to go through the junction table
  if (opts?.tagId) {
    const { data: personIds } = await supabase
      .from("person_tags")
      .select("person_id")
      .eq("tag_id", opts.tagId);

    const ids = (personIds ?? []).map((r) => r.person_id);
    if (ids.length === 0) return { data: [], count: 0 };

    let query = supabase
      .from("people")
      .select(
        "id, first_name, last_name, email, phone, status, household_id, created_at",
        { count: "exact" },
      )
      .eq("church_id", churchId)
      .in("id", ids)
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

  let query = supabase
    .from("people")
    .select(
      "id, first_name, last_name, email, phone, status, household_id, created_at",
      { count: "exact" },
    )
    .eq("church_id", churchId)
    .order("last_name")
    .order("first_name")
    .range(offset, offset + limit - 1);

  if (search) {
    query = query.or(
      `first_name.ilike.%${search}%,last_name.ilike.%${search}%,email.ilike.%${search}%,phone.ilike.%${search}%`,
    );
  }

  if (opts?.householdId) {
    query = query.eq("household_id", opts.householdId);
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

export async function getHousehold(id: string) {
  const churchId = await getChurchId();
  const supabase = await getSupabaseServer();
  if (!supabase) return null;

  const { data } = await supabase
    .from("households")
    .select("id, name, created_at")
    .eq("id", id)
    .eq("church_id", churchId)
    .single();

  return data as HouseholdRow | null;
}

export async function getHouseholdMembers(householdId: string) {
  const churchId = await getChurchId();
  const supabase = await getSupabaseServer();
  if (!supabase) return [];

  const { data } = await supabase
    .from("people")
    .select("id, first_name, last_name, email, phone, status")
    .eq("church_id", churchId)
    .eq("household_id", householdId)
    .order("last_name")
    .order("first_name");

  return data ?? [];
}

export async function listHouseholdsWithCounts(search?: string) {
  const churchId = await getChurchId();
  const supabase = await getSupabaseServer();
  if (!supabase) return [];

  let query = supabase
    .from("households")
    .select("id, name, created_at, people(count)")
    .eq("church_id", churchId)
    .order("name");

  if (search) {
    query = query.ilike("name", `%${search}%`);
  }

  const { data } = await query;
  return (data ?? []).map((h) => ({
    id: h.id as string,
    name: h.name as string,
    created_at: h.created_at as string,
    member_count: (h.people as unknown as { count: number }[])?.[0]?.count ?? 0,
  })) as HouseholdRow[];
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

export async function listTagsWithCounts(search?: string) {
  const churchId = await getChurchId();
  const supabase = await getSupabaseServer();
  if (!supabase) return [];

  let query = supabase
    .from("tags")
    .select("id, name, created_at, person_tags(count)")
    .eq("church_id", churchId)
    .order("name");

  if (search) {
    query = query.ilike("name", `%${search}%`);
  }

  const { data } = await query;
  return (data ?? []).map((t) => ({
    id: t.id as string,
    name: t.name as string,
    created_at: t.created_at as string,
    people_count:
      (t.person_tags as unknown as { count: number }[])?.[0]?.count ?? 0,
  })) as TagRow[];
}

export async function getTag(id: string) {
  const churchId = await getChurchId();
  const supabase = await getSupabaseServer();
  if (!supabase) return null;

  const { data } = await supabase
    .from("tags")
    .select("id, name, created_at")
    .eq("id", id)
    .eq("church_id", churchId)
    .single();

  return data as TagRow | null;
}

export async function getTaggedPeople(tagId: string) {
  const churchId = await getChurchId();
  const supabase = await getSupabaseServer();
  if (!supabase) return [];

  const { data: personIds } = await supabase
    .from("person_tags")
    .select("person_id")
    .eq("tag_id", tagId);

  const ids = (personIds ?? []).map((r) => r.person_id);
  if (ids.length === 0) return [];

  const { data } = await supabase
    .from("people")
    .select("id, first_name, last_name, email, phone, status")
    .eq("church_id", churchId)
    .in("id", ids)
    .order("last_name")
    .order("first_name");

  return data ?? [];
}

export async function exportPeopleData() {
  const churchId = await getChurchId();
  const supabase = await getSupabaseServer();
  if (!supabase) return [];

  const { data: people } = await supabase
    .from("people")
    .select("id, first_name, last_name, email, phone, status, household_id")
    .eq("church_id", churchId)
    .order("last_name")
    .order("first_name");

  if (!people || people.length === 0) return [];

  // Fetch all households for name lookup
  const { data: households } = await supabase
    .from("households")
    .select("id, name")
    .eq("church_id", churchId);

  const householdMap = new Map(
    (households ?? []).map((h) => [h.id, h.name]),
  );

  // Fetch all person_tags with tag names
  const personIds = people.map((p) => p.id);
  const { data: personTags } = await supabase
    .from("person_tags")
    .select("person_id, tags(name)")
    .in("person_id", personIds);

  const tagsByPerson = new Map<string, string[]>();
  for (const pt of personTags ?? []) {
    const tagName = (pt.tags as unknown as { name: string })?.name;
    if (tagName) {
      const existing = tagsByPerson.get(pt.person_id) ?? [];
      existing.push(tagName);
      tagsByPerson.set(pt.person_id, existing);
    }
  }

  return people.map((p) => ({
    first_name: p.first_name,
    last_name: p.last_name,
    email: p.email ?? "",
    phone: p.phone ?? "",
    status: p.status,
    household: p.household_id ? (householdMap.get(p.household_id) ?? "") : "",
    tags: (tagsByPerson.get(p.id) ?? []).join(", "),
  }));
}
