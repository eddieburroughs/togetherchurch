"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { requireFeature } from "@/lib/features/requireFeature";

export async function createAnnouncement(formData: FormData) {
  const { ctx } = await requireFeature("core.announcements");

  const admin = getSupabaseAdmin();
  if (!admin) throw new Error("Server not configured.");

  const title = (formData.get("title") as string)?.trim();
  if (!title) throw new Error("Title is required.");

  const body = (formData.get("body") as string)?.trim() || null;
  const campusId = (formData.get("campus_id") as string) || null;
  const publishOption = formData.get("publish_option") as string;

  let isPublished = false;
  let publishAt: string | null = null;

  if (publishOption === "now") {
    isPublished = true;
    publishAt = new Date().toISOString();
  } else if (publishOption === "schedule") {
    const scheduleDate = formData.get("publish_at") as string;
    if (!scheduleDate) throw new Error("Schedule date is required.");
    isPublished = true;
    publishAt = new Date(scheduleDate).toISOString();
  }
  // else "draft" — isPublished stays false

  if (ctx.campusMode === "required" && !campusId) {
    throw new Error("Campus is required.");
  }

  const { error } = await admin.from("announcements").insert({
    church_id: ctx.churchId,
    title,
    body,
    campus_id: campusId,
    publish_at: publishAt,
    is_published: isPublished,
  });

  if (error) throw new Error(error.message);
  redirect("/admin/announcements");
}

export async function updateAnnouncement(id: string, formData: FormData) {
  const { ctx } = await requireFeature("core.announcements");

  const admin = getSupabaseAdmin();
  if (!admin) throw new Error("Server not configured.");

  const title = (formData.get("title") as string)?.trim();
  if (!title) throw new Error("Title is required.");

  const body = (formData.get("body") as string)?.trim() || null;
  const campusId = (formData.get("campus_id") as string) || null;
  const publishOption = formData.get("publish_option") as string;

  let isPublished = false;
  let publishAt: string | null = null;

  if (publishOption === "now") {
    isPublished = true;
    publishAt = new Date().toISOString();
  } else if (publishOption === "schedule") {
    const scheduleDate = formData.get("publish_at") as string;
    if (!scheduleDate) throw new Error("Schedule date is required.");
    isPublished = true;
    publishAt = new Date(scheduleDate).toISOString();
  } else if (publishOption === "published") {
    // Keep current published state (for edits that don't change publish status)
    isPublished = true;
    publishAt = (formData.get("current_publish_at") as string) || new Date().toISOString();
  }

  if (ctx.campusMode === "required" && !campusId) {
    throw new Error("Campus is required.");
  }

  const { error } = await admin
    .from("announcements")
    .update({
      title,
      body,
      campus_id: campusId,
      publish_at: publishAt,
      is_published: isPublished,
    })
    .eq("id", id)
    .eq("church_id", ctx.churchId);

  if (error) throw new Error(error.message);
  revalidatePath("/admin/announcements");
  revalidatePath("/dashboard");
}

export async function deleteAnnouncement(id: string) {
  const { ctx } = await requireFeature("core.announcements");

  const admin = getSupabaseAdmin();
  if (!admin) throw new Error("Server not configured.");

  await admin
    .from("announcements")
    .delete()
    .eq("id", id)
    .eq("church_id", ctx.churchId);

  revalidatePath("/admin/announcements");
  revalidatePath("/dashboard");
}

export async function publishAnnouncement(id: string) {
  const { ctx } = await requireFeature("core.announcements");

  const admin = getSupabaseAdmin();
  if (!admin) throw new Error("Server not configured.");

  const { error } = await admin
    .from("announcements")
    .update({
      is_published: true,
      publish_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("church_id", ctx.churchId);

  if (error) throw new Error(error.message);
  revalidatePath("/admin/announcements");
  revalidatePath("/dashboard");
}

export async function unpublishAnnouncement(id: string) {
  const { ctx } = await requireFeature("core.announcements");

  const admin = getSupabaseAdmin();
  if (!admin) throw new Error("Server not configured.");

  const { error } = await admin
    .from("announcements")
    .update({ is_published: false })
    .eq("id", id)
    .eq("church_id", ctx.churchId);

  if (error) throw new Error(error.message);
  revalidatePath("/admin/announcements");
  revalidatePath("/dashboard");
}
