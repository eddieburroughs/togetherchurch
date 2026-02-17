"use server";

import { getSessionUser } from "@/lib/auth/getSessionUser";
import { getSupabaseAdmin } from "@/lib/supabase/server";

export async function updateProfile(
  _prev: { error?: string; success?: boolean } | null,
  formData: FormData,
) {
  const session = await getSessionUser();
  if (!session) return { error: "Authentication required." };

  const admin = getSupabaseAdmin();
  if (!admin) return { error: "Server not configured." };

  const displayName = (formData.get("display_name") as string)?.trim() || null;
  const phone = (formData.get("phone") as string)?.trim() || null;

  const { error } = await admin
    .from("profiles")
    .update({
      display_name: displayName,
      phone,
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", session.id);

  if (error) return { error: error.message };

  return { success: true };
}
