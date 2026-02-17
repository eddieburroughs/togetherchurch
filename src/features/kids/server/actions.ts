"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { requireFeature } from "@/lib/features/requireFeature";

function generatePickupCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 4; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

// ── Kids CRUD ───────────────────────────────────────────────────────────

export async function createKid(formData: FormData) {
  const { ctx } = await requireFeature("services.kids_checkin");

  const admin = getSupabaseAdmin();
  if (!admin) throw new Error("Server not configured.");

  const firstName = (formData.get("first_name") as string)?.trim();
  const lastName = (formData.get("last_name") as string)?.trim();
  if (!firstName || !lastName) throw new Error("Name is required.");

  const campusId = (formData.get("campus_id") as string) || null;
  if (ctx.campusMode === "required" && !campusId) {
    throw new Error("Campus is required.");
  }

  const { error } = await admin.from("kids").insert({
    church_id: ctx.churchId,
    first_name: firstName,
    last_name: lastName,
    dob: (formData.get("dob") as string) || null,
    allergies: (formData.get("allergies") as string)?.trim() || null,
    campus_id: campusId,
  });

  if (error) throw new Error(error.message);
  redirect("/admin/kids");
}

export async function updateKid(id: string, formData: FormData) {
  const { ctx } = await requireFeature("services.kids_checkin");

  const admin = getSupabaseAdmin();
  if (!admin) throw new Error("Server not configured.");

  const firstName = (formData.get("first_name") as string)?.trim();
  const lastName = (formData.get("last_name") as string)?.trim();
  if (!firstName || !lastName) throw new Error("Name is required.");

  const campusId = (formData.get("campus_id") as string) || null;
  if (ctx.campusMode === "required" && !campusId) {
    throw new Error("Campus is required.");
  }

  const { error } = await admin
    .from("kids")
    .update({
      first_name: firstName,
      last_name: lastName,
      dob: (formData.get("dob") as string) || null,
      allergies: (formData.get("allergies") as string)?.trim() || null,
      campus_id: campusId,
    })
    .eq("id", id)
    .eq("church_id", ctx.churchId);

  if (error) throw new Error(error.message);
  revalidatePath("/admin/kids");
}

export async function deleteKid(id: string) {
  const { ctx } = await requireFeature("services.kids_checkin");

  const admin = getSupabaseAdmin();
  if (!admin) throw new Error("Server not configured.");

  await admin
    .from("kids")
    .delete()
    .eq("id", id)
    .eq("church_id", ctx.churchId);

  revalidatePath("/admin/kids");
}

// ── Sessions CRUD ───────────────────────────────────────────────────────

export async function createSession(formData: FormData) {
  const { ctx } = await requireFeature("services.kids_checkin");

  const admin = getSupabaseAdmin();
  if (!admin) throw new Error("Server not configured.");

  const name = (formData.get("name") as string)?.trim();
  if (!name) throw new Error("Session name is required.");

  const startsAt = formData.get("starts_at") as string;
  if (!startsAt) throw new Error("Start time is required.");

  const campusId = (formData.get("campus_id") as string) || null;
  if (ctx.campusMode === "required" && !campusId) {
    throw new Error("Campus is required.");
  }

  const { error } = await admin.from("kids_sessions").insert({
    church_id: ctx.churchId,
    name,
    starts_at: new Date(startsAt).toISOString(),
    ends_at: formData.get("ends_at")
      ? new Date(formData.get("ends_at") as string).toISOString()
      : null,
    campus_id: campusId,
  });

  if (error) throw new Error(error.message);
  redirect("/admin/kids/sessions");
}

export async function deleteSession(id: string) {
  const { ctx } = await requireFeature("services.kids_checkin");

  const admin = getSupabaseAdmin();
  if (!admin) throw new Error("Server not configured.");

  await admin
    .from("kids_sessions")
    .delete()
    .eq("id", id)
    .eq("church_id", ctx.churchId);

  redirect("/admin/kids/sessions");
}

// ── Check-in / Check-out ────────────────────────────────────────────────

export async function checkInKid(sessionId: string, kidId: string) {
  const { ctx } = await requireFeature("services.kids_checkin");

  const admin = getSupabaseAdmin();
  if (!admin) throw new Error("Server not configured.");

  // Check if already checked in and not out
  const { data: existing } = await admin
    .from("kids_checkins")
    .select("id")
    .eq("session_id", sessionId)
    .eq("kid_id", kidId)
    .is("checked_out_at", null)
    .single();

  if (existing) throw new Error("This child is already checked in.");

  const pickupCode = generatePickupCode();

  const { error } = await admin.from("kids_checkins").insert({
    church_id: ctx.churchId,
    session_id: sessionId,
    kid_id: kidId,
    pickup_code: pickupCode,
  });

  if (error) throw new Error(error.message);
  revalidatePath(`/admin/kids/sessions/${sessionId}`);

  return { pickupCode };
}

export async function checkOutKid(checkinId: string, pickupCode: string) {
  const { ctx } = await requireFeature("services.kids_checkin");

  const admin = getSupabaseAdmin();
  if (!admin) throw new Error("Server not configured.");

  // Verify pickup code
  const { data: checkin } = await admin
    .from("kids_checkins")
    .select("id, pickup_code, session_id")
    .eq("id", checkinId)
    .eq("church_id", ctx.churchId)
    .single();

  if (!checkin) throw new Error("Check-in not found.");

  if (checkin.pickup_code !== pickupCode.toUpperCase().trim()) {
    throw new Error("Invalid pickup code.");
  }

  const { error } = await admin
    .from("kids_checkins")
    .update({ checked_out_at: new Date().toISOString() })
    .eq("id", checkinId);

  if (error) throw new Error(error.message);
  revalidatePath(`/admin/kids/sessions/${checkin.session_id}`);
}

// ── Label Templates Seed ────────────────────────────────────────────────

export async function seedLabelTemplates() {
  const { ctx } = await requireFeature("services.kids_checkin.labels");

  const admin = getSupabaseAdmin();
  if (!admin) throw new Error("Server not configured.");

  // Check if templates already exist
  const { count } = await admin
    .from("label_templates")
    .select("id", { count: "exact" })
    .eq("church_id", ctx.churchId);

  if ((count ?? 0) > 0) return;

  const templates = [
    {
      church_id: ctx.churchId,
      key: "small_2x1",
      name: "Small (2×1 inch)",
      width_mm: 56,
      height_mm: 28,
      layout: {
        fields: [
          { key: "child_name", x: 2, y: 2, fontSize: 10, bold: true },
          { key: "pickup_code", x: 2, y: 14, fontSize: 14, bold: true },
          { key: "allergies_flag", x: 40, y: 2, fontSize: 8 },
        ],
      },
    },
    {
      church_id: ctx.churchId,
      key: "medium_2x2",
      name: "Medium (2×2 inch)",
      width_mm: 56,
      height_mm: 56,
      layout: {
        fields: [
          { key: "child_name", x: 2, y: 2, fontSize: 12, bold: true },
          { key: "session_name", x: 2, y: 16, fontSize: 8 },
          { key: "date", x: 2, y: 26, fontSize: 8 },
          { key: "pickup_code", x: 2, y: 38, fontSize: 16, bold: true },
          { key: "allergies_flag", x: 40, y: 2, fontSize: 8 },
        ],
      },
    },
    {
      church_id: ctx.churchId,
      key: "large_2x4",
      name: "Large (2×4 inch)",
      width_mm: 56,
      height_mm: 102,
      layout: {
        fields: [
          { key: "child_name", x: 2, y: 4, fontSize: 14, bold: true },
          { key: "session_name", x: 2, y: 22, fontSize: 10 },
          { key: "date", x: 2, y: 36, fontSize: 10 },
          { key: "allergies", x: 2, y: 50, fontSize: 9 },
          { key: "pickup_code", x: 2, y: 72, fontSize: 22, bold: true },
          { key: "pickup_label", x: 2, y: 64, fontSize: 8 },
        ],
      },
    },
  ];

  await admin.from("label_templates").insert(templates);
  revalidatePath("/admin/kids/sessions");
}
