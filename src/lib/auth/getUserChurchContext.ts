import { getSupabaseServer } from "@/lib/supabase/server";

export interface ChurchContext {
  churchId: string;
  role: "admin" | "leader" | "member";
  planId: string | null;
  campusMode: "off" | "optional" | "required";
  givingUrl: string | null;
}

/**
 * Loads the church context for the current user.
 * Returns null if the user has no active church membership.
 *
 * If the user belongs to multiple churches, returns the first one.
 * Multi-church switching can be added later.
 */
export async function getUserChurchContext(
  userId: string,
): Promise<ChurchContext | null> {
  const supabase = await getSupabaseServer();
  if (!supabase) return null;

  // Get the user's active church membership
  const { data: membership } = await supabase
    .from("church_users")
    .select("church_id, role")
    .eq("user_id", userId)
    .eq("status", "active")
    .order("created_at", { ascending: true })
    .limit(1)
    .single();

  if (!membership) return null;

  // Fetch subscription + settings in parallel
  const [subResult, settingsResult] = await Promise.all([
    supabase
      .from("church_subscriptions")
      .select("plan_id")
      .eq("church_id", membership.church_id)
      .single(),
    supabase
      .from("church_settings")
      .select("campus_mode, giving_url")
      .eq("church_id", membership.church_id)
      .single(),
  ]);

  return {
    churchId: membership.church_id,
    role: membership.role as ChurchContext["role"],
    planId: subResult.data?.plan_id ?? null,
    campusMode:
      (settingsResult.data?.campus_mode as ChurchContext["campusMode"]) ?? "off",
    givingUrl: settingsResult.data?.giving_url ?? null,
  };
}
