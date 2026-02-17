"use server";

import { getSupabaseServer, getSupabaseAdmin } from "@/lib/supabase/server";
import { getUserChurchContext } from "@/lib/auth/getUserChurchContext";
import { getSessionUser } from "@/lib/auth/getSessionUser";

export interface GroupRow {
  id: string;
  church_id: string;
  campus_id: string | null;
  name: string;
  description: string | null;
  created_at: string;
  member_count?: number;
}

export interface GroupMemberRow {
  group_id: string;
  church_id: string;
  user_id: string;
  role: "leader" | "member";
  sms_mirror_opt_in: boolean;
  sms_notify_opt_in: boolean;
  is_muted: boolean;
  joined_at: string;
  // joined
  display_name?: string;
  email?: string;
  phone?: string;
}

export interface ChatMessageRow {
  id: string;
  church_id: string;
  group_id: string;
  sender_user_id: string | null;
  source: "app" | "sms";
  body: string;
  meta: Record<string, unknown> | null;
  created_at: string;
  // joined
  sender_name?: string;
}

async function getChurchId(): Promise<string> {
  const session = await getSessionUser();
  if (!session) throw new Error("Authentication required.");
  const ctx = await getUserChurchContext(session.id);
  if (!ctx) throw new Error("No church membership.");
  return ctx.churchId;
}

export async function listGroups(opts?: {
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
    .from("groups")
    .select("*", { count: "exact" })
    .eq("church_id", churchId)
    .order("name")
    .range(offset, offset + limit - 1);

  if (opts?.search) {
    query = query.ilike("name", `%${opts.search}%`);
  }

  const { data, count } = await query;
  return { data: (data ?? []) as GroupRow[], count: count ?? 0 };
}

export async function getGroup(id: string) {
  const churchId = await getChurchId();
  const supabase = await getSupabaseServer();
  if (!supabase) return null;

  const { data } = await supabase
    .from("groups")
    .select("*")
    .eq("id", id)
    .eq("church_id", churchId)
    .single();

  return data as GroupRow | null;
}

export async function getGroupMembers(groupId: string) {
  const admin = getSupabaseAdmin();
  if (!admin) return [];

  const { data: members } = await admin
    .from("group_members")
    .select("*")
    .eq("group_id", groupId)
    .order("role")
    .order("joined_at");

  if (!members || members.length === 0) return [];

  // Fetch profile info for display names
  const userIds = members.map((m) => m.user_id);
  const { data: profiles } = await admin
    .from("profiles")
    .select("user_id, display_name, email, phone")
    .in("user_id", userIds);

  const profileMap = new Map(
    (profiles ?? []).map((p) => [
      p.user_id,
      { display_name: p.display_name, email: p.email, phone: p.phone },
    ]),
  );

  return members.map((m) => {
    const profile = profileMap.get(m.user_id);
    return {
      ...m,
      display_name: profile?.display_name ?? profile?.email ?? m.user_id,
      email: profile?.email,
      phone: profile?.phone,
    } as GroupMemberRow;
  });
}

export async function getGroupMembership(groupId: string, userId: string) {
  const admin = getSupabaseAdmin();
  if (!admin) return null;

  const { data } = await admin
    .from("group_members")
    .select("*")
    .eq("group_id", groupId)
    .eq("user_id", userId)
    .single();

  return data as GroupMemberRow | null;
}

export async function getMyGroups() {
  const session = await getSessionUser();
  if (!session) return [];

  const ctx = await getUserChurchContext(session.id);
  if (!ctx) return [];

  const admin = getSupabaseAdmin();
  if (!admin) return [];

  const { data: memberships } = await admin
    .from("group_members")
    .select("group_id")
    .eq("user_id", session.id)
    .eq("church_id", ctx.churchId);

  if (!memberships || memberships.length === 0) return [];

  const groupIds = memberships.map((m) => m.group_id);
  const { data: groups } = await admin
    .from("groups")
    .select("*")
    .in("id", groupIds)
    .order("name");

  return (groups ?? []) as GroupRow[];
}

export async function getChatMessages(
  groupId: string,
  opts?: { limit?: number; before?: string },
) {
  const admin = getSupabaseAdmin();
  if (!admin) return [];

  const limit = opts?.limit ?? 50;

  let query = admin
    .from("chat_messages")
    .select("*")
    .eq("group_id", groupId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (opts?.before) {
    query = query.lt("created_at", opts.before);
  }

  const { data: messages } = await query;
  if (!messages || messages.length === 0) return [];

  // Fetch sender names
  const senderIds = [
    ...new Set(messages.filter((m) => m.sender_user_id).map((m) => m.sender_user_id!)),
  ];

  const profileMap = new Map<string, string>();
  if (senderIds.length > 0) {
    const { data: profiles } = await admin
      .from("profiles")
      .select("user_id, display_name, email")
      .in("user_id", senderIds);

    for (const p of profiles ?? []) {
      profileMap.set(p.user_id, p.display_name ?? p.email ?? "Unknown");
    }
  }

  return messages
    .map((m) => ({
      ...m,
      sender_name: m.sender_user_id
        ? profileMap.get(m.sender_user_id) ?? "Unknown"
        : "System",
    }))
    .reverse() as ChatMessageRow[];
}

export async function listChurchUsers(churchId: string) {
  const admin = getSupabaseAdmin();
  if (!admin) return [];

  const { data: users } = await admin
    .from("church_users")
    .select("user_id, role, status")
    .eq("church_id", churchId)
    .eq("status", "active")
    .order("role");

  if (!users || users.length === 0) return [];

  const userIds = users.map((u) => u.user_id);
  const { data: profiles } = await admin
    .from("profiles")
    .select("user_id, display_name, email")
    .in("user_id", userIds);

  const profileMap = new Map(
    (profiles ?? []).map((p) => [
      p.user_id,
      { display_name: p.display_name, email: p.email },
    ]),
  );

  return users.map((u) => ({
    user_id: u.user_id,
    role: u.role as string,
    display_name:
      profileMap.get(u.user_id)?.display_name ??
      profileMap.get(u.user_id)?.email ??
      u.user_id,
  }));
}
