"use server";

import { getSupabaseServer } from "@/lib/supabase/server";
import { getUserChurchContext } from "@/lib/auth/getUserChurchContext";
import { getSessionUser } from "@/lib/auth/getSessionUser";

export interface AnnouncementRow {
  id: string;
  church_id: string;
  campus_id: string | null;
  title: string;
  body: string | null;
  publish_at: string | null;
  is_published: boolean;
  created_at: string;
  campus_name?: string;
}

async function getChurchId(): Promise<string> {
  const session = await getSessionUser();
  if (!session) throw new Error("Authentication required.");
  const ctx = await getUserChurchContext(session.id);
  if (!ctx) throw new Error("No church membership.");
  return ctx.churchId;
}

export async function listPublishedAnnouncements(campusId?: string) {
  const churchId = await getChurchId();
  const supabase = await getSupabaseServer();
  if (!supabase) return [];

  let query = supabase
    .from("announcements")
    .select("id, church_id, campus_id, title, body, publish_at, is_published, created_at, campuses(name)")
    .eq("church_id", churchId)
    .eq("is_published", true)
    .or("publish_at.is.null,publish_at.lte." + new Date().toISOString())
    .order("publish_at", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false })
    .limit(50);

  // If campus filtering, show church-wide (null campus) + matching campus
  if (campusId) {
    query = query.or(`campus_id.is.null,campus_id.eq.${campusId}`);
  }

  const { data } = await query;
  return (data ?? []).map((a) => ({
    ...a,
    campus_name: (a.campuses as unknown as { name: string } | null)?.name ?? null,
  })) as AnnouncementRow[];
}

export async function listAllAnnouncements(
  search?: string,
  offset = 0,
  limit = 50,
) {
  const churchId = await getChurchId();
  const supabase = await getSupabaseServer();
  if (!supabase) return { data: [], count: 0 };

  let query = supabase
    .from("announcements")
    .select("id, church_id, campus_id, title, body, publish_at, is_published, created_at, campuses(name)", {
      count: "exact",
    })
    .eq("church_id", churchId)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (search) {
    query = query.or(
      `title.ilike.%${search}%,body.ilike.%${search}%`,
    );
  }

  const { data, count } = await query;
  return {
    data: (data ?? []).map((a) => ({
      ...a,
      campus_name: (a.campuses as unknown as { name: string } | null)?.name ?? null,
    })) as AnnouncementRow[],
    count: count ?? 0,
  };
}

export async function getAnnouncement(id: string) {
  const churchId = await getChurchId();
  const supabase = await getSupabaseServer();
  if (!supabase) return null;

  const { data } = await supabase
    .from("announcements")
    .select("*")
    .eq("id", id)
    .eq("church_id", churchId)
    .single();

  return data as AnnouncementRow | null;
}
