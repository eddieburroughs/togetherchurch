"use server";

import { revalidatePath } from "next/cache";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { requireFeature } from "@/lib/features/requireFeature";
import { getSessionUser } from "@/lib/auth/getSessionUser";
import { getUserChurchContext } from "@/lib/auth/getUserChurchContext";
import { logAudit } from "@/lib/audit/logAudit";

// ── Campus CRUD ───────────────────────────────────────────────────────────

export async function createCampus(formData: FormData) {
  const { session, ctx } = await requireFeature("org.campuses");

  const admin = getSupabaseAdmin();
  if (!admin) throw new Error("Server not configured.");

  const name = (formData.get("name") as string)?.trim();
  if (!name) throw new Error("Campus name is required.");

  const isDefault = formData.get("is_default") === "on";

  // If marking as default, unset others first
  if (isDefault) {
    await admin
      .from("campuses")
      .update({ is_default: false })
      .eq("church_id", ctx.churchId);
  }

  const { error } = await admin.from("campuses").insert({
    church_id: ctx.churchId,
    name,
    is_default: isDefault,
  });

  if (error) throw new Error(error.message);
  await logAudit({ churchId: ctx.churchId, userId: session.id, action: "campus.created", targetType: "campus", meta: { name } });
  revalidatePath("/admin/settings/campuses");
}

export async function updateCampus(id: string, formData: FormData) {
  const { session, ctx } = await requireFeature("org.campuses");

  const admin = getSupabaseAdmin();
  if (!admin) throw new Error("Server not configured.");

  const name = (formData.get("name") as string)?.trim();
  if (!name) throw new Error("Campus name is required.");

  const isDefault = formData.get("is_default") === "on";

  if (isDefault) {
    await admin
      .from("campuses")
      .update({ is_default: false })
      .eq("church_id", ctx.churchId);
  }

  const { error } = await admin
    .from("campuses")
    .update({ name, is_default: isDefault })
    .eq("id", id)
    .eq("church_id", ctx.churchId);

  if (error) throw new Error(error.message);
  await logAudit({ churchId: ctx.churchId, userId: session.id, action: "campus.updated", targetType: "campus", targetId: id, meta: { name } });
  revalidatePath("/admin/settings/campuses");
}

export async function deleteCampus(id: string) {
  const { session, ctx } = await requireFeature("org.campuses");

  const admin = getSupabaseAdmin();
  if (!admin) throw new Error("Server not configured.");

  await admin
    .from("campuses")
    .delete()
    .eq("id", id)
    .eq("church_id", ctx.churchId);

  await logAudit({ churchId: ctx.churchId, userId: session.id, action: "campus.deleted", targetType: "campus", targetId: id });
  revalidatePath("/admin/settings/campuses");
}

// ── Church Settings ───────────────────────────────────────────────────────

export async function updateCampusMode(mode: "off" | "optional" | "required") {
  const session = await getSessionUser();
  if (!session) throw new Error("Authentication required.");

  const ctx = await getUserChurchContext(session.id);
  if (!ctx) throw new Error("No church membership.");
  if (ctx.role !== "admin") throw new Error("Admin access required.");

  const admin = getSupabaseAdmin();
  if (!admin) throw new Error("Server not configured.");

  // If turning on (optional/required), must have org.campuses feature
  if (mode !== "off") {
    const { requireFeature: rf } = await import("@/lib/features/requireFeature");
    await rf("org.campuses");
  }

  const { error } = await admin
    .from("church_settings")
    .update({
      campus_mode: mode,
      updated_at: new Date().toISOString(),
    })
    .eq("church_id", ctx.churchId);

  if (error) throw new Error(error.message);
  await logAudit({ churchId: ctx.churchId, userId: session.id, action: "settings.campus_mode_updated", targetType: "settings", meta: { mode } });
  revalidatePath("/admin/settings/church");
  revalidatePath("/admin");
}
