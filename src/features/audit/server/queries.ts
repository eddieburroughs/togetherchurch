"use server";

import { getSupabaseServer } from "@/lib/supabase/server";
import { getSessionUser } from "@/lib/auth/getSessionUser";
import { getUserChurchContext } from "@/lib/auth/getUserChurchContext";

export interface AuditEntry {
  id: string;
  church_id: string;
  actor_user_id: string;
  action: string;
  target_type: string | null;
  target_id: string | null;
  meta: Record<string, unknown> | null;
  created_at: string;
  // joined
  actor_name?: string;
}

async function getChurchId(): Promise<string> {
  const session = await getSessionUser();
  if (!session) throw new Error("Authentication required.");
  const ctx = await getUserChurchContext(session.id);
  if (!ctx) throw new Error("No church membership.");
  return ctx.churchId;
}

export async function listAuditEntries(opts?: {
  action?: string;
  targetType?: string;
  offset?: number;
  limit?: number;
}) {
  const churchId = await getChurchId();
  const supabase = await getSupabaseServer();
  if (!supabase) return { data: [], count: 0 };

  const limit = opts?.limit ?? 50;
  const offset = opts?.offset ?? 0;

  let query = supabase
    .from("audit_log")
    .select("*", { count: "exact" })
    .eq("church_id", churchId)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (opts?.action) {
    query = query.like("action", `${opts.action}%`);
  }

  if (opts?.targetType) {
    query = query.eq("target_type", opts.targetType);
  }

  const { data, count } = await query;
  const entries = (data ?? []) as AuditEntry[];

  // Resolve actor display names
  if (entries.length > 0) {
    const userIds = [...new Set(entries.map((e) => e.actor_user_id))];
    const { data: profiles } = await supabase
      .from("profiles")
      .select("user_id, display_name, email")
      .in("user_id", userIds);

    const profileMap = new Map(
      (profiles ?? []).map((p) => [
        p.user_id,
        p.display_name ?? p.email ?? "Unknown",
      ]),
    );

    for (const entry of entries) {
      entry.actor_name = profileMap.get(entry.actor_user_id) ?? "Unknown";
    }
  }

  return { data: entries, count: count ?? 0 };
}
