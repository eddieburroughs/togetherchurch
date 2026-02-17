"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getSessionUser } from "@/lib/auth/getSessionUser";
import { getUserChurchContext } from "@/lib/auth/getUserChurchContext";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { requireFeature } from "@/lib/features/requireFeature";
import { logAudit } from "@/lib/audit/logAudit";
import { sendPushNotifications } from "@/lib/push/pushService";

// ── Train CRUD ──────────────────────────────────────────────────────────

export async function createTrain(formData: FormData) {
  const { session, ctx } = await requireFeature("engage.care_meals");

  const admin = getSupabaseAdmin();
  if (!admin) throw new Error("Server not configured.");

  const title = (formData.get("title") as string)?.trim();
  if (!title) throw new Error("Title is required.");

  const startDate = formData.get("start_date") as string;
  const endDate = formData.get("end_date") as string;
  if (!startDate || !endDate) throw new Error("Start and end dates are required.");

  const campusId = (formData.get("campus_id") as string) || null;
  if (ctx.campusMode === "required" && !campusId) {
    throw new Error("Campus is required.");
  }

  const { error } = await admin.from("care_trains").insert({
    church_id: ctx.churchId,
    title,
    description: (formData.get("description") as string)?.trim() || null,
    start_date: startDate,
    end_date: endDate,
    campus_id: campusId,
  });

  if (error) throw new Error(error.message);
  await logAudit({ churchId: ctx.churchId, userId: session.id, action: "train.created", targetType: "train", meta: { title } });
  redirect("/admin/care-meals");
}

export async function updateTrain(id: string, formData: FormData) {
  const { session, ctx } = await requireFeature("engage.care_meals");

  const admin = getSupabaseAdmin();
  if (!admin) throw new Error("Server not configured.");

  const title = (formData.get("title") as string)?.trim();
  if (!title) throw new Error("Title is required.");

  const campusId = (formData.get("campus_id") as string) || null;
  if (ctx.campusMode === "required" && !campusId) {
    throw new Error("Campus is required.");
  }

  const { error } = await admin
    .from("care_trains")
    .update({
      title,
      description: (formData.get("description") as string)?.trim() || null,
      start_date: formData.get("start_date") as string,
      end_date: formData.get("end_date") as string,
      campus_id: campusId,
    })
    .eq("id", id)
    .eq("church_id", ctx.churchId);

  if (error) throw new Error(error.message);
  await logAudit({ churchId: ctx.churchId, userId: session.id, action: "train.updated", targetType: "train", targetId: id, meta: { title } });
  revalidatePath(`/admin/care-meals/${id}`);
}

export async function deleteTrain(id: string) {
  const { session, ctx } = await requireFeature("engage.care_meals");

  const admin = getSupabaseAdmin();
  if (!admin) throw new Error("Server not configured.");

  await admin
    .from("care_trains")
    .delete()
    .eq("id", id)
    .eq("church_id", ctx.churchId);

  await logAudit({ churchId: ctx.churchId, userId: session.id, action: "train.deleted", targetType: "train", targetId: id });
  redirect("/admin/care-meals");
}

// ── Slot CRUD ───────────────────────────────────────────────────────────

export async function createSlot(formData: FormData) {
  const { ctx } = await requireFeature("engage.care_meals");

  const admin = getSupabaseAdmin();
  if (!admin) throw new Error("Server not configured.");

  const trainId = formData.get("train_id") as string;
  if (!trainId) throw new Error("Train ID is required.");

  const slotDate = formData.get("slot_date") as string;
  const slotLabel = (formData.get("slot_label") as string)?.trim();
  if (!slotDate || !slotLabel) throw new Error("Date and label are required.");

  const capacity = parseInt(formData.get("capacity") as string, 10) || 1;

  const { error } = await admin.from("care_slots").insert({
    church_id: ctx.churchId,
    train_id: trainId,
    slot_date: slotDate,
    slot_label: slotLabel,
    capacity: Math.max(1, capacity),
    notes: (formData.get("notes") as string)?.trim() || null,
  });

  if (error) throw new Error(error.message);
  revalidatePath(`/admin/care-meals/${trainId}`);
}

export async function deleteSlot(slotId: string, trainId: string) {
  const { ctx } = await requireFeature("engage.care_meals");

  const admin = getSupabaseAdmin();
  if (!admin) throw new Error("Server not configured.");

  await admin
    .from("care_slots")
    .delete()
    .eq("id", slotId)
    .eq("church_id", ctx.churchId);

  revalidatePath(`/admin/care-meals/${trainId}`);
}

// ── Signups ─────────────────────────────────────────────────────────────

export async function claimSlot(slotId: string, note?: string) {
  const session = await getSessionUser();
  if (!session) throw new Error("Authentication required.");

  const ctx = await getUserChurchContext(session.id);
  if (!ctx) throw new Error("No church membership.");

  const admin = getSupabaseAdmin();
  if (!admin) throw new Error("Server not configured.");

  // Check capacity
  const { data: slot } = await admin
    .from("care_slots")
    .select("id, capacity, train_id")
    .eq("id", slotId)
    .single();

  if (!slot) throw new Error("Slot not found.");

  const { count } = await admin
    .from("care_signups")
    .select("id", { count: "exact" })
    .eq("slot_id", slotId);

  if ((count ?? 0) >= slot.capacity) {
    throw new Error("This slot is full.");
  }

  // Check if already signed up
  const { data: existing } = await admin
    .from("care_signups")
    .select("id")
    .eq("slot_id", slotId)
    .eq("user_id", session.id)
    .single();

  if (existing) throw new Error("You are already signed up for this slot.");

  const { error } = await admin.from("care_signups").insert({
    church_id: ctx.churchId,
    slot_id: slotId,
    user_id: session.id,
    note: note?.trim() || null,
  });

  if (error) throw new Error(error.message);

  // Notify admins/leaders
  const { data: leaders } = await admin
    .from("church_users")
    .select("user_id")
    .eq("church_id", ctx.churchId)
    .in("role", ["admin", "leader"])
    .eq("status", "active");

  if (leaders && leaders.length > 0) {
    const { data: profile } = await admin
      .from("profiles")
      .select("display_name, email")
      .eq("user_id", session.id)
      .single();

    const name = profile?.display_name ?? profile?.email ?? "A member";

    // Get train title for context
    const { data: train } = await admin
      .from("care_trains")
      .select("title")
      .eq("id", slot.train_id)
      .single();

    await sendPushNotifications({
      churchId: ctx.churchId,
      userIds: leaders.map((l) => l.user_id),
      title: "Meal Train Signup",
      body: `${name} signed up for "${train?.title ?? "a meal train"}"`,
      type: "care_signup",
      data: { train_id: slot.train_id, slot_id: slotId },
    });
  }

  revalidatePath(`/dashboard/care-meals/${slot.train_id}`);
}

export async function unclaimSlot(slotId: string, trainId: string) {
  const session = await getSessionUser();
  if (!session) throw new Error("Authentication required.");

  const admin = getSupabaseAdmin();
  if (!admin) throw new Error("Server not configured.");

  await admin
    .from("care_signups")
    .delete()
    .eq("slot_id", slotId)
    .eq("user_id", session.id);

  revalidatePath(`/dashboard/care-meals/${trainId}`);
}

// TODO: Scheduler — implement reminder notifications for upcoming slots.
// When a cron/scheduler framework is added, create a job that:
// 1. Queries care_signups joined with care_slots where slot_date = tomorrow
// 2. Sends a push/in-app notification to the signed-up user
// 3. Optionally sends an SMS/email reminder
