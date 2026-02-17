"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getSessionUser } from "@/lib/auth/getSessionUser";
import { getUserChurchContext } from "@/lib/auth/getUserChurchContext";
import { getSupabaseAdmin, getSupabaseServer } from "@/lib/supabase/server";
import { requireFeature } from "@/lib/features/requireFeature";
import { logAudit } from "@/lib/audit/logAudit";

export async function submitForm(formKey: string, payload: Record<string, string | boolean>) {
  const session = await getSessionUser();
  if (!session) throw new Error("Authentication required.");

  const ctx = await getUserChurchContext(session.id);
  if (!ctx) throw new Error("No church membership.");

  const supabase = await getSupabaseServer();
  if (!supabase) throw new Error("Server not configured.");

  // Look up the form definition
  const { data: form } = await supabase
    .from("form_definitions")
    .select("id, title")
    .eq("church_id", ctx.churchId)
    .eq("key", formKey)
    .eq("is_enabled", true)
    .single();

  if (!form) throw new Error("Form not found or not enabled.");

  // Insert submission
  const { error } = await supabase.from("form_submissions").insert({
    church_id: ctx.churchId,
    form_id: form.id,
    submitted_by_user_id: session.id,
    payload,
  });

  if (error) throw new Error(error.message);

  // Notify all admins and leaders
  const admin = getSupabaseAdmin();
  if (admin) {
    const { data: leaders } = await admin
      .from("church_users")
      .select("user_id")
      .eq("church_id", ctx.churchId)
      .in("role", ["admin", "leader"])
      .eq("status", "active");

    if (leaders && leaders.length > 0) {
      const submitterName =
        (typeof payload.first_name === "string" ? payload.first_name : "") ||
        (typeof payload.name === "string" ? payload.name : "") ||
        session.email ||
        "Someone";

      const notifications = leaders.map((l) => ({
        church_id: ctx.churchId,
        user_id: l.user_id,
        type: "form_submission",
        title: `New ${form.title} submission`,
        body: `${submitterName} submitted a ${form.title} form.`,
        data: { form_key: formKey, form_id: form.id },
      }));

      await admin.from("notifications").insert(notifications);
    }
  }

  revalidatePath("/admin/inbox/forms");
}

export async function deleteSubmission(id: string) {
  const { session, ctx } = await requireFeature("core.forms");

  const admin = getSupabaseAdmin();
  if (!admin) throw new Error("Server not configured.");

  await admin
    .from("form_submissions")
    .delete()
    .eq("id", id)
    .eq("church_id", ctx.churchId);

  await logAudit({ churchId: ctx.churchId, userId: session.id, action: "form_submission.deleted", targetType: "form_submission", targetId: id });
  revalidatePath("/admin/inbox/forms");
}

export async function toggleFormEnabled(formId: string, enabled: boolean) {
  const { session, ctx } = await requireFeature("core.forms");

  const admin = getSupabaseAdmin();
  if (!admin) throw new Error("Server not configured.");

  const { error } = await admin
    .from("form_definitions")
    .update({ is_enabled: enabled })
    .eq("id", formId)
    .eq("church_id", ctx.churchId);

  if (error) throw new Error(error.message);
  await logAudit({ churchId: ctx.churchId, userId: session.id, action: enabled ? "form.enabled" : "form.disabled", targetType: "form", targetId: formId });
  revalidatePath("/admin/inbox/forms");
}
