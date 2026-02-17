"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { requireFeature } from "@/lib/features/requireFeature";
import { logAudit } from "@/lib/audit/logAudit";

export async function createGivingPartner(formData: FormData) {
  const { session, ctx } = await requireFeature("core.giving");

  const admin = getSupabaseAdmin();
  if (!admin) throw new Error("Server not configured.");

  const name = (formData.get("name") as string)?.trim();
  if (!name) throw new Error("Partner name is required.");

  const { error } = await admin.from("giving_partners").insert({
    church_id: ctx.churchId,
    name,
    description: (formData.get("description") as string)?.trim() || null,
    website_url: (formData.get("website_url") as string)?.trim() || null,
    category: (formData.get("category") as string)?.trim() || null,
    sort_order: parseInt(formData.get("sort_order") as string || "0", 10),
  });

  if (error) throw new Error(error.message);
  await logAudit({ churchId: ctx.churchId, userId: session.id, action: "partner.created", targetType: "partner", meta: { name } });
  redirect("/admin/giving");
}

export async function updateGivingPartner(id: string, formData: FormData) {
  const { session, ctx } = await requireFeature("core.giving");

  const admin = getSupabaseAdmin();
  if (!admin) throw new Error("Server not configured.");

  const name = (formData.get("name") as string)?.trim();
  if (!name) throw new Error("Partner name is required.");

  const { error } = await admin
    .from("giving_partners")
    .update({
      name,
      description: (formData.get("description") as string)?.trim() || null,
      website_url: (formData.get("website_url") as string)?.trim() || null,
      category: (formData.get("category") as string)?.trim() || null,
      sort_order: parseInt(formData.get("sort_order") as string || "0", 10),
      is_active: formData.get("is_active") === "on",
    })
    .eq("id", id)
    .eq("church_id", ctx.churchId);

  if (error) throw new Error(error.message);
  await logAudit({ churchId: ctx.churchId, userId: session.id, action: "partner.updated", targetType: "partner", targetId: id, meta: { name } });
  redirect("/admin/giving");
}

export async function deleteGivingPartner(id: string) {
  const { session, ctx } = await requireFeature("core.giving");

  const admin = getSupabaseAdmin();
  if (!admin) throw new Error("Server not configured.");

  await admin
    .from("giving_partners")
    .delete()
    .eq("id", id)
    .eq("church_id", ctx.churchId);

  await logAudit({ churchId: ctx.churchId, userId: session.id, action: "partner.deleted", targetType: "partner", targetId: id });
  revalidatePath("/admin/giving");
}

export async function updateGivingUrl(formData: FormData) {
  const { session, ctx } = await requireFeature("core.giving");

  const admin = getSupabaseAdmin();
  if (!admin) throw new Error("Server not configured.");

  const givingUrl = (formData.get("giving_url") as string)?.trim() || null;

  await admin
    .from("church_settings")
    .update({ giving_url: givingUrl, updated_at: new Date().toISOString() })
    .eq("church_id", ctx.churchId);

  await logAudit({ churchId: ctx.churchId, userId: session.id, action: "giving.url_updated", targetType: "settings", meta: { giving_url: givingUrl } });
  revalidatePath("/admin/giving");
  revalidatePath("/dashboard/giving");
}
