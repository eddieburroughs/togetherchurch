"use server";

import { getSupabaseServer } from "@/lib/supabase/server";
import { getSessionUser } from "@/lib/auth/getSessionUser";
import { getUserChurchContext } from "@/lib/auth/getUserChurchContext";

export interface NotificationRow {
  id: string;
  church_id: string;
  user_id: string;
  type: string;
  title: string;
  body: string | null;
  data: Record<string, string> | null;
  is_read: boolean;
  created_at: string;
}

export async function listNotifications(opts?: {
  unreadOnly?: boolean;
  limit?: number;
  offset?: number;
}) {
  const session = await getSessionUser();
  if (!session) return { data: [], count: 0 };

  const ctx = await getUserChurchContext(session.id);
  if (!ctx) return { data: [], count: 0 };

  const supabase = await getSupabaseServer();
  if (!supabase) return { data: [], count: 0 };

  const limit = opts?.limit ?? 50;
  const offset = opts?.offset ?? 0;

  let query = supabase
    .from("notifications")
    .select("*", { count: "exact" })
    .eq("user_id", session.id)
    .eq("church_id", ctx.churchId)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (opts?.unreadOnly) {
    query = query.eq("is_read", false);
  }

  const { data, count } = await query;
  return { data: (data ?? []) as NotificationRow[], count: count ?? 0 };
}

export async function getUnreadCount() {
  const session = await getSessionUser();
  if (!session) return 0;

  const ctx = await getUserChurchContext(session.id);
  if (!ctx) return 0;

  const supabase = await getSupabaseServer();
  if (!supabase) return 0;

  const { count } = await supabase
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .eq("user_id", session.id)
    .eq("church_id", ctx.churchId)
    .eq("is_read", false);

  return count ?? 0;
}
