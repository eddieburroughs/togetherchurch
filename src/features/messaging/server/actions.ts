"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { requireFeature } from "@/lib/features/requireFeature";
import { logAudit } from "@/lib/audit/logAudit";
import { sendSms } from "@/features/messaging/lib/sms-provider";
import { sendEmail } from "@/features/messaging/lib/email-provider";
import { estimateSegments } from "@/features/messaging/lib/segments";
import { getRecipients } from "./queries";

async function incrementUsage(
  churchId: string,
  metricKey: string,
  count: number,
) {
  const admin = getSupabaseAdmin();
  if (!admin || count === 0) return;

  const today = new Date().toISOString().slice(0, 10);

  // Upsert: insert or increment
  const { data: existing } = await admin
    .from("usage_counters_daily")
    .select("count")
    .eq("church_id", churchId)
    .eq("date", today)
    .eq("metric_key", metricKey)
    .single();

  if (existing) {
    await admin
      .from("usage_counters_daily")
      .update({ count: (existing.count as number) + count })
      .eq("church_id", churchId)
      .eq("date", today)
      .eq("metric_key", metricKey);
  } else {
    await admin.from("usage_counters_daily").insert({
      church_id: churchId,
      date: today,
      metric_key: metricKey,
      count,
    });
  }
}

export async function sendBroadcast(opts: {
  channel: "sms" | "email";
  audienceType: "all" | "tag";
  tagId?: string;
  subject?: string;
  body: string;
}) {
  const featureKey =
    opts.channel === "sms" ? "core.messaging_sms" : "core.messaging_email";
  const { session, ctx } = await requireFeature(featureKey);

  const admin = getSupabaseAdmin();
  if (!admin) throw new Error("Server not configured.");

  const recipients = await getRecipients(
    opts.channel,
    opts.audienceType,
    opts.tagId,
  );

  if (recipients.length === 0) {
    throw new Error("No recipients found for the selected audience.");
  }

  // Create message_sends log row
  const { data: sendRow, error: insertErr } = await admin
    .from("message_sends")
    .insert({
      church_id: ctx.churchId,
      channel: opts.channel,
      created_by_user_id: session.id,
      audience_type: opts.audienceType,
      audience_ref: opts.tagId ?? null,
      subject: opts.subject ?? null,
      body: opts.body,
      status: "queued",
    })
    .select("id")
    .single();

  if (insertErr) throw new Error(insertErr.message);

  let successCount = 0;
  let failCount = 0;
  let lastError = "";
  let totalSegments = 0;

  if (opts.channel === "sms") {
    const segmentsPerMsg = estimateSegments(opts.body);

    for (const r of recipients) {
      if (!r.phone) continue;
      try {
        await sendSms(r.phone, opts.body);
        successCount++;
        totalSegments += segmentsPerMsg;
      } catch (e) {
        failCount++;
        lastError = e instanceof Error ? e.message : String(e);
      }
    }

    await incrementUsage(ctx.churchId, "sms_segments", totalSegments);
  } else {
    const subject = opts.subject || "(No subject)";

    for (const r of recipients) {
      if (!r.email) continue;
      try {
        await sendEmail(r.email, subject, opts.body);
        successCount++;
      } catch (e) {
        failCount++;
        lastError = e instanceof Error ? e.message : String(e);
      }
    }

    await incrementUsage(ctx.churchId, "email_sends", successCount);
  }

  // Update send row status
  const status = failCount === recipients.length ? "failed" : "sent";
  await admin
    .from("message_sends")
    .update({
      status,
      error:
        failCount > 0
          ? `${failCount} failed. Last error: ${lastError}`
          : null,
    })
    .eq("id", sendRow.id);

  await logAudit({ churchId: ctx.churchId, userId: session.id, action: "broadcast.sent", targetType: "broadcast", targetId: sendRow.id, meta: { channel: opts.channel, audience: opts.audienceType, sent: successCount, failed: failCount } });
  revalidatePath("/admin/messaging/sends");

  return { sent: successCount, failed: failCount };
}

export async function getRecipientCount(opts: {
  channel: "sms" | "email";
  audienceType: "all" | "tag";
  tagId?: string;
}): Promise<number> {
  const featureKey =
    opts.channel === "sms" ? "core.messaging_sms" : "core.messaging_email";
  await requireFeature(featureKey);

  const recipients = await getRecipients(
    opts.channel,
    opts.audienceType,
    opts.tagId,
  );
  return recipients.length;
}

export async function createTemplate(formData: FormData) {
  const channel = formData.get("channel") as "sms" | "email";
  const featureKey =
    channel === "sms" ? "core.messaging_sms" : "core.messaging_email";
  const { session, ctx } = await requireFeature(featureKey);

  const admin = getSupabaseAdmin();
  if (!admin) throw new Error("Server not configured.");

  const name = (formData.get("name") as string)?.trim();
  if (!name) throw new Error("Template name is required.");

  const body = (formData.get("body") as string)?.trim();
  if (!body) throw new Error("Template body is required.");

  const { error } = await admin.from("message_templates").insert({
    church_id: ctx.churchId,
    channel,
    name,
    body,
  });

  if (error) throw new Error(error.message);
  await logAudit({ churchId: ctx.churchId, userId: session.id, action: "template.created", targetType: "template", meta: { name, channel } });
  redirect("/admin/messaging/templates");
}

export async function updateTemplate(id: string, formData: FormData) {
  const { session, ctx } = await requireFeature("core.messaging_sms");

  const admin = getSupabaseAdmin();
  if (!admin) throw new Error("Server not configured.");

  const name = (formData.get("name") as string)?.trim();
  if (!name) throw new Error("Template name is required.");

  const body = (formData.get("body") as string)?.trim();
  if (!body) throw new Error("Template body is required.");

  const { error } = await admin
    .from("message_templates")
    .update({ name, body })
    .eq("id", id)
    .eq("church_id", ctx.churchId);

  if (error) throw new Error(error.message);
  await logAudit({ churchId: ctx.churchId, userId: session.id, action: "template.updated", targetType: "template", targetId: id, meta: { name } });
  redirect("/admin/messaging/templates");
}

export async function deleteTemplate(id: string) {
  const { session, ctx } = await requireFeature("core.messaging_sms");

  const admin = getSupabaseAdmin();
  if (!admin) throw new Error("Server not configured.");

  await admin
    .from("message_templates")
    .delete()
    .eq("id", id)
    .eq("church_id", ctx.churchId);

  await logAudit({ churchId: ctx.churchId, userId: session.id, action: "template.deleted", targetType: "template", targetId: id });
  revalidatePath("/admin/messaging/templates");
}
