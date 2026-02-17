"use server";

import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth/getSessionUser";
import { getSupabaseAdmin } from "@/lib/supabase/server";

export async function createChurch(formData: FormData) {
  const session = await getSessionUser();
  if (!session) redirect("/login");

  const name = (formData.get("name") as string)?.trim();
  const slug = (formData.get("slug") as string)
    ?.trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "");

  if (!name || !slug) {
    throw new Error("Church name and slug are required.");
  }

  const admin = getSupabaseAdmin();
  if (!admin) throw new Error("Server not configured.");

  // Create church
  const { data: church, error: churchError } = await admin
    .from("churches")
    .insert({ name, slug })
    .select("id")
    .single();

  if (churchError) {
    if (churchError.code === "23505") {
      throw new Error("That URL slug is already taken. Try another.");
    }
    throw new Error(churchError.message);
  }

  // Create default settings
  await admin.from("church_settings").insert({ church_id: church.id });

  // Create default campus
  await admin
    .from("campuses")
    .insert({ church_id: church.id, name: "Main Campus", is_default: true });

  // Add the current user as admin
  await admin.from("church_users").insert({
    church_id: church.id,
    user_id: session.id,
    role: "admin",
    status: "active",
  });

  // Create a trial subscription on the under_150 plan
  await admin.from("church_subscriptions").insert({
    church_id: church.id,
    plan_id: "under_150",
    status: "trial",
  });

  // Seed default form definitions
  await admin.from("form_definitions").insert([
    {
      church_id: church.id,
      key: "im_new",
      title: "I'm New",
      schema: {
        fields: [
          { name: "first_name", label: "First Name", type: "text", required: true },
          { name: "last_name", label: "Last Name", type: "text", required: true },
          { name: "email", label: "Email", type: "email", required: true },
          { name: "phone", label: "Phone", type: "tel", required: false },
          { name: "how_heard", label: "How did you hear about us?", type: "text", required: false },
        ],
      },
    },
    {
      church_id: church.id,
      key: "prayer_request",
      title: "Prayer Request",
      schema: {
        fields: [
          { name: "name", label: "Your Name", type: "text", required: true },
          { name: "request", label: "Prayer Request", type: "textarea", required: true },
          { name: "private", label: "Keep private (only leaders will see)", type: "checkbox", required: false },
        ],
      },
    },
  ]);

  // Ensure profile exists
  await admin
    .from("profiles")
    .upsert(
      { user_id: session.id, email: session.email },
      { onConflict: "user_id" },
    );

  redirect("/admin/onboarding/giving");
}

export async function saveGivingUrl(formData: FormData) {
  const session = await getSessionUser();
  if (!session) redirect("/login");

  const givingUrl = (formData.get("giving_url") as string)?.trim() || null;

  const admin = getSupabaseAdmin();
  if (!admin) throw new Error("Server not configured.");

  // Find user's church
  const { data: membership } = await admin
    .from("church_users")
    .select("church_id")
    .eq("user_id", session.id)
    .eq("status", "active")
    .eq("role", "admin")
    .limit(1)
    .single();

  if (!membership) throw new Error("No church found.");

  await admin
    .from("church_settings")
    .update({ giving_url: givingUrl, updated_at: new Date().toISOString() })
    .eq("church_id", membership.church_id);

  redirect("/admin/onboarding/import");
}
