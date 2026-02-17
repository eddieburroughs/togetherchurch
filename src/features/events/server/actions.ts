"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getSessionUser } from "@/lib/auth/getSessionUser";
import { getUserChurchContext } from "@/lib/auth/getUserChurchContext";
import { getSupabaseAdmin, getSupabaseServer } from "@/lib/supabase/server";
import { requireFeature } from "@/lib/features/requireFeature";

export async function createEvent(formData: FormData) {
  const { ctx } = await requireFeature("core.events");

  const admin = getSupabaseAdmin();
  if (!admin) throw new Error("Server not configured.");

  const title = (formData.get("title") as string)?.trim();
  if (!title) throw new Error("Title is required.");

  const startsAt = formData.get("starts_at") as string;
  if (!startsAt) throw new Error("Start date/time is required.");

  const { error } = await admin.from("events").insert({
    church_id: ctx.churchId,
    title,
    description: (formData.get("description") as string)?.trim() || null,
    location: (formData.get("location") as string)?.trim() || null,
    starts_at: new Date(startsAt).toISOString(),
    ends_at: formData.get("ends_at")
      ? new Date(formData.get("ends_at") as string).toISOString()
      : null,
    featured: formData.get("featured") === "on",
    capacity: formData.get("capacity")
      ? parseInt(formData.get("capacity") as string, 10)
      : null,
  });

  if (error) throw new Error(error.message);
  redirect("/admin/events");
}

export async function updateEvent(id: string, formData: FormData) {
  const { ctx } = await requireFeature("core.events");

  const admin = getSupabaseAdmin();
  if (!admin) throw new Error("Server not configured.");

  const title = (formData.get("title") as string)?.trim();
  if (!title) throw new Error("Title is required.");

  const { error } = await admin
    .from("events")
    .update({
      title,
      description: (formData.get("description") as string)?.trim() || null,
      location: (formData.get("location") as string)?.trim() || null,
      starts_at: new Date(formData.get("starts_at") as string).toISOString(),
      ends_at: formData.get("ends_at")
        ? new Date(formData.get("ends_at") as string).toISOString()
        : null,
      featured: formData.get("featured") === "on",
      capacity: formData.get("capacity")
        ? parseInt(formData.get("capacity") as string, 10)
        : null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("church_id", ctx.churchId);

  if (error) throw new Error(error.message);
  revalidatePath("/admin/events");
}

export async function deleteEvent(id: string) {
  const { ctx } = await requireFeature("core.events");

  const admin = getSupabaseAdmin();
  if (!admin) throw new Error("Server not configured.");

  await admin
    .from("events")
    .delete()
    .eq("id", id)
    .eq("church_id", ctx.churchId);

  revalidatePath("/admin/events");
}

export async function submitRsvp(eventId: string, status: "yes" | "no" | "maybe") {
  const session = await getSessionUser();
  if (!session) throw new Error("Authentication required.");

  const ctx = await getUserChurchContext(session.id);
  if (!ctx) throw new Error("No church membership.");

  const supabase = await getSupabaseServer();
  if (!supabase) throw new Error("Server not configured.");

  // Check for existing RSVP
  const { data: existing } = await supabase
    .from("event_rsvps")
    .select("id")
    .eq("event_id", eventId)
    .eq("user_id", session.id)
    .single();

  if (existing) {
    await supabase
      .from("event_rsvps")
      .update({ status })
      .eq("id", existing.id);
  } else {
    await supabase.from("event_rsvps").insert({
      church_id: ctx.churchId,
      event_id: eventId,
      user_id: session.id,
      status,
    });
  }

  revalidatePath(`/dashboard/events/${eventId}`);
  revalidatePath(`/admin/events/${eventId}`);
}

export async function exportRsvpsCsv(eventId: string): Promise<string> {
  const { ctx } = await requireFeature("core.events");

  const admin = getSupabaseAdmin();
  if (!admin) throw new Error("Server not configured.");

  const { data: rsvps } = await admin
    .from("event_rsvps")
    .select("user_id, guest_name, guest_email, status, created_at")
    .eq("event_id", eventId)
    .eq("church_id", ctx.churchId)
    .order("created_at");

  // Get profiles for user RSVPs
  const userIds = (rsvps ?? [])
    .filter((r) => r.user_id)
    .map((r) => r.user_id!);

  const profileMap = new Map<string, { display_name: string | null; email: string | null }>();
  if (userIds.length > 0) {
    const { data: profiles } = await admin
      .from("profiles")
      .select("user_id, display_name, email")
      .in("user_id", userIds);

    for (const p of profiles ?? []) {
      profileMap.set(p.user_id, p);
    }
  }

  const header = "Name,Email,Status,Date";
  const rows = (rsvps ?? []).map((r) => {
    const profile = r.user_id ? profileMap.get(r.user_id) : null;
    const name = profile?.display_name ?? r.guest_name ?? "";
    const email = profile?.email ?? r.guest_email ?? "";
    return `"${name}","${email}","${r.status}","${r.created_at}"`;
  });

  return [header, ...rows].join("\n");
}
