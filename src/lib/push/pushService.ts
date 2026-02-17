import { getSupabaseAdmin } from "@/lib/supabase/server";

/**
 * Push notification abstraction.
 *
 * Default implementation: creates notification rows in the database (in-app).
 * Swap this to OneSignal / APNs / FCM for real push later.
 */
export async function sendPushNotifications(opts: {
  churchId: string;
  userIds: string[];
  title: string;
  body: string;
  type?: string;
  data?: Record<string, string>;
}) {
  if (opts.userIds.length === 0) return;

  const admin = getSupabaseAdmin();
  if (!admin) return;

  const notifications = opts.userIds.map((userId) => ({
    church_id: opts.churchId,
    user_id: userId,
    type: opts.type ?? "push",
    title: opts.title,
    body: opts.body,
    data: opts.data ?? null,
  }));

  await admin.from("notifications").insert(notifications);
}
