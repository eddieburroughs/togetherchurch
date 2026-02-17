"use server";

import { revalidatePath } from "next/cache";
import { getSessionUser } from "@/lib/auth/getSessionUser";
import { getSupabaseAdmin } from "@/lib/supabase/server";

export async function markAsRead(notificationId: string) {
  const session = await getSessionUser();
  if (!session) throw new Error("Authentication required.");

  const admin = getSupabaseAdmin();
  if (!admin) throw new Error("Server not configured.");

  await admin
    .from("notifications")
    .update({ is_read: true })
    .eq("id", notificationId)
    .eq("user_id", session.id);

  revalidatePath("/dashboard/notifications");
  revalidatePath("/admin/notifications");
}

export async function markAllAsRead() {
  const session = await getSessionUser();
  if (!session) throw new Error("Authentication required.");

  const admin = getSupabaseAdmin();
  if (!admin) throw new Error("Server not configured.");

  await admin
    .from("notifications")
    .update({ is_read: true })
    .eq("user_id", session.id)
    .eq("is_read", false);

  revalidatePath("/dashboard/notifications");
  revalidatePath("/admin/notifications");
}
