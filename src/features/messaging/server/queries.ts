"use server";

import { getSupabaseServer, getSupabaseAdmin } from "@/lib/supabase/server";
import { getUserChurchContext } from "@/lib/auth/getUserChurchContext";
import { getSessionUser } from "@/lib/auth/getSessionUser";

export interface TemplateRow {
  id: string;
  church_id: string;
  channel: "sms" | "email";
  name: string;
  body: string;
  created_at: string;
}

export interface SendRow {
  id: string;
  church_id: string;
  channel: "sms" | "email";
  created_by_user_id: string;
  audience_type: "all" | "tag" | "group" | "event";
  audience_ref: string | null;
  subject: string | null;
  body: string;
  status: "queued" | "sent" | "failed";
  error: string | null;
  created_at: string;
  // joined
  tag_name?: string;
}

export interface Recipient {
  personId: string;
  name: string;
  phone?: string | null;
  email?: string | null;
}

async function getChurchId(): Promise<string> {
  const session = await getSessionUser();
  if (!session) throw new Error("Authentication required.");
  const ctx = await getUserChurchContext(session.id);
  if (!ctx) throw new Error("No church membership.");
  return ctx.churchId;
}

export async function listTemplates(channel?: "sms" | "email") {
  const churchId = await getChurchId();
  const supabase = await getSupabaseServer();
  if (!supabase) return [];

  let query = supabase
    .from("message_templates")
    .select("*")
    .eq("church_id", churchId)
    .order("name");

  if (channel) {
    query = query.eq("channel", channel);
  }

  const { data } = await query;
  return (data ?? []) as TemplateRow[];
}

export async function getTemplate(id: string) {
  const churchId = await getChurchId();
  const supabase = await getSupabaseServer();
  if (!supabase) return null;

  const { data } = await supabase
    .from("message_templates")
    .select("*")
    .eq("id", id)
    .eq("church_id", churchId)
    .single();

  return data as TemplateRow | null;
}

export async function listSends(opts?: { offset?: number; limit?: number }) {
  const churchId = await getChurchId();
  const supabase = await getSupabaseServer();
  if (!supabase) return { data: [], count: 0 };

  const limit = opts?.limit ?? 50;
  const offset = opts?.offset ?? 0;

  const { data, count } = await supabase
    .from("message_sends")
    .select("*", { count: "exact" })
    .eq("church_id", churchId)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  return { data: (data ?? []) as SendRow[], count: count ?? 0 };
}

export async function listTags() {
  const churchId = await getChurchId();
  const supabase = await getSupabaseServer();
  if (!supabase) return [];

  const { data } = await supabase
    .from("tags")
    .select("id, name")
    .eq("church_id", churchId)
    .order("name");

  return (data ?? []) as { id: string; name: string }[];
}

/**
 * Resolve recipient list for a broadcast.
 * Returns people with the relevant contact info.
 */
export async function getRecipients(
  channel: "sms" | "email",
  audienceType: "all" | "tag",
  tagId?: string,
): Promise<Recipient[]> {
  const churchId = await getChurchId();
  const admin = getSupabaseAdmin();
  if (!admin) return [];

  const contactField = channel === "sms" ? "phone" : "email";

  let query = admin
    .from("people")
    .select("id, first_name, last_name, phone, email")
    .eq("church_id", churchId)
    .eq("status", "active")
    .not(contactField, "is", null)
    .neq(contactField, "");

  if (audienceType === "tag" && tagId) {
    // Get people IDs with this tag
    const { data: tagged } = await admin
      .from("person_tags")
      .select("person_id")
      .eq("tag_id", tagId);

    const personIds = (tagged ?? []).map((t) => t.person_id);
    if (personIds.length === 0) return [];

    query = query.in("id", personIds);
  }

  const { data: people } = await query;

  let recipients: Recipient[] = (people ?? []).map((p) => ({
    personId: p.id,
    name: `${p.first_name} ${p.last_name}`,
    phone: p.phone,
    email: p.email,
  }));

  // For SMS: filter out opted-out phone numbers
  if (channel === "sms") {
    const phones = recipients
      .map((r) => r.phone)
      .filter(Boolean) as string[];

    if (phones.length > 0) {
      const { data: optedOut } = await admin
        .from("profiles")
        .select("phone")
        .eq("sms_opt_out", true)
        .in("phone", phones);

      const optedOutPhones = new Set(
        (optedOut ?? []).map((p) => p.phone),
      );

      recipients = recipients.filter(
        (r) => r.phone && !optedOutPhones.has(r.phone),
      );
    }
  }

  return recipients;
}
