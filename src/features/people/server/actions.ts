"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getSessionUser } from "@/lib/auth/getSessionUser";
import { getUserChurchContext } from "@/lib/auth/getUserChurchContext";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { requireFeature } from "@/lib/features/requireFeature";

export async function createPerson(formData: FormData) {
  const { ctx } = await requireFeature("core.people");

  const admin = getSupabaseAdmin();
  if (!admin) throw new Error("Server not configured.");

  const firstName = (formData.get("first_name") as string)?.trim();
  const lastName = (formData.get("last_name") as string)?.trim();
  if (!firstName || !lastName) throw new Error("First and last name required.");

  const campusId = (formData.get("campus_id") as string) || null;
  if (ctx.campusMode === "required" && !campusId) {
    throw new Error("Campus is required.");
  }

  const { data: person, error } = await admin
    .from("people")
    .insert({
      church_id: ctx.churchId,
      first_name: firstName,
      last_name: lastName,
      email: (formData.get("email") as string)?.trim() || null,
      phone: (formData.get("phone") as string)?.trim() || null,
      household_id: (formData.get("household_id") as string) || null,
      campus_id: campusId,
      status: "active",
    })
    .select("id")
    .single();

  if (error) throw new Error(error.message);

  // Handle tag assignments
  const tagIds = formData.getAll("tag_ids") as string[];
  if (tagIds.length > 0 && person) {
    await admin.from("person_tags").insert(
      tagIds.map((tagId) => ({ person_id: person.id, tag_id: tagId })),
    );
  }

  redirect("/admin/people");
}

export async function updatePerson(id: string, formData: FormData) {
  const { ctx } = await requireFeature("core.people");

  const admin = getSupabaseAdmin();
  if (!admin) throw new Error("Server not configured.");

  const campusId = (formData.get("campus_id") as string) || null;
  if (ctx.campusMode === "required" && !campusId) {
    throw new Error("Campus is required.");
  }

  const { error } = await admin
    .from("people")
    .update({
      first_name: (formData.get("first_name") as string)?.trim(),
      last_name: (formData.get("last_name") as string)?.trim(),
      email: (formData.get("email") as string)?.trim() || null,
      phone: (formData.get("phone") as string)?.trim() || null,
      household_id: (formData.get("household_id") as string) || null,
      campus_id: campusId,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("church_id", ctx.churchId);

  if (error) throw new Error(error.message);

  // Replace tags: delete all existing, insert new
  const tagIds = formData.getAll("tag_ids") as string[];
  await admin.from("person_tags").delete().eq("person_id", id);
  if (tagIds.length > 0) {
    await admin.from("person_tags").insert(
      tagIds.map((tagId) => ({ person_id: id, tag_id: tagId })),
    );
  }

  revalidatePath(`/admin/people/${id}`);
  revalidatePath("/admin/people");
}

export async function deletePerson(id: string) {
  const { ctx } = await requireFeature("core.people");

  const admin = getSupabaseAdmin();
  if (!admin) throw new Error("Server not configured.");

  await admin
    .from("people")
    .delete()
    .eq("id", id)
    .eq("church_id", ctx.churchId);

  revalidatePath("/admin/people");
}

export async function createTag(formData: FormData) {
  const { ctx } = await requireFeature("core.people");

  const admin = getSupabaseAdmin();
  if (!admin) throw new Error("Server not configured.");

  const name = (formData.get("name") as string)?.trim();
  if (!name) throw new Error("Tag name required.");

  const { error } = await admin
    .from("tags")
    .insert({ church_id: ctx.churchId, name });

  if (error) throw new Error(error.message);
  revalidatePath("/admin/tags");
}

export async function deleteTag(id: string) {
  const { ctx } = await requireFeature("core.people");

  const admin = getSupabaseAdmin();
  if (!admin) throw new Error("Server not configured.");

  await admin
    .from("tags")
    .delete()
    .eq("id", id)
    .eq("church_id", ctx.churchId);

  revalidatePath("/admin/tags");
}

export async function createHousehold(formData: FormData) {
  const { ctx } = await requireFeature("core.people");

  const admin = getSupabaseAdmin();
  if (!admin) throw new Error("Server not configured.");

  const name = (formData.get("name") as string)?.trim();
  if (!name) throw new Error("Household name required.");

  const { error } = await admin
    .from("households")
    .insert({ church_id: ctx.churchId, name });

  if (error) throw new Error(error.message);
  revalidatePath("/admin/households");
}

export async function updateHousehold(id: string, formData: FormData) {
  const { ctx } = await requireFeature("core.people");

  const admin = getSupabaseAdmin();
  if (!admin) throw new Error("Server not configured.");

  const name = (formData.get("name") as string)?.trim();
  if (!name) throw new Error("Household name required.");

  const { error } = await admin
    .from("households")
    .update({ name })
    .eq("id", id)
    .eq("church_id", ctx.churchId);

  if (error) throw new Error(error.message);
  revalidatePath(`/admin/households/${id}`);
  revalidatePath("/admin/households");
}

export async function deleteHousehold(id: string) {
  const { ctx } = await requireFeature("core.people");

  const admin = getSupabaseAdmin();
  if (!admin) throw new Error("Server not configured.");

  // Unassign people from this household first
  await admin
    .from("people")
    .update({ household_id: null })
    .eq("household_id", id)
    .eq("church_id", ctx.churchId);

  await admin
    .from("households")
    .delete()
    .eq("id", id)
    .eq("church_id", ctx.churchId);

  revalidatePath("/admin/households");
  revalidatePath("/admin/people");
}

export async function exportPeopleCsv() {
  const { ctx } = await requireFeature("core.people");

  const admin = getSupabaseAdmin();
  if (!admin) throw new Error("Server not configured.");

  const { data: people } = await admin
    .from("people")
    .select("id, first_name, last_name, email, phone, status, household_id")
    .eq("church_id", ctx.churchId)
    .order("last_name")
    .order("first_name");

  if (!people || people.length === 0) return "";

  // Fetch households
  const { data: households } = await admin
    .from("households")
    .select("id, name")
    .eq("church_id", ctx.churchId);

  const householdMap = new Map(
    (households ?? []).map((h) => [h.id, h.name]),
  );

  // Fetch person_tags with tag names
  const personIds = people.map((p) => p.id);
  const { data: personTags } = await admin
    .from("person_tags")
    .select("person_id, tags(name)")
    .in("person_id", personIds);

  const tagsByPerson = new Map<string, string[]>();
  for (const pt of personTags ?? []) {
    const tagName = (pt.tags as unknown as { name: string })?.name;
    if (tagName) {
      const existing = tagsByPerson.get(pt.person_id) ?? [];
      existing.push(tagName);
      tagsByPerson.set(pt.person_id, existing);
    }
  }

  // Build CSV
  const escape = (v: string) => {
    if (v.includes(",") || v.includes('"') || v.includes("\n")) {
      return `"${v.replace(/"/g, '""')}"`;
    }
    return v;
  };

  const header = "first_name,last_name,email,phone,status,household,tags";
  const rows = people.map((p) => {
    const household = p.household_id
      ? (householdMap.get(p.household_id) ?? "")
      : "";
    const tags = (tagsByPerson.get(p.id) ?? []).join(", ");
    return [
      escape(p.first_name),
      escape(p.last_name),
      escape(p.email ?? ""),
      escape(p.phone ?? ""),
      escape(p.status),
      escape(household),
      escape(tags),
    ].join(",");
  });

  return [header, ...rows].join("\n");
}

export interface ImportRow {
  first_name: string;
  last_name: string;
  email?: string;
  phone?: string;
  household?: string;
  tags?: string;
}

export async function importPeople(rows: ImportRow[]) {
  const session = await getSessionUser();
  if (!session) throw new Error("Authentication required.");

  const ctx = await getUserChurchContext(session.id);
  if (!ctx) throw new Error("No church membership.");

  const admin = getSupabaseAdmin();
  if (!admin) throw new Error("Server not configured.");

  const churchId = ctx.churchId;

  // Pre-fetch existing people for dedup (by email + phone within church)
  const { data: existing } = await admin
    .from("people")
    .select("id, email, phone")
    .eq("church_id", churchId);

  const emailMap = new Map<string, string>();
  const phoneMap = new Map<string, string>();
  for (const p of existing ?? []) {
    if (p.email) emailMap.set(p.email.toLowerCase(), p.id);
    if (p.phone) phoneMap.set(p.phone.replace(/\D/g, ""), p.id);
  }

  // Pre-fetch existing tags
  const { data: existingTags } = await admin
    .from("tags")
    .select("id, name")
    .eq("church_id", churchId);

  const tagMap = new Map<string, string>(
    (existingTags ?? []).map((t) => [t.name.toLowerCase(), t.id]),
  );

  // Pre-fetch existing households
  const { data: existingHouseholds } = await admin
    .from("households")
    .select("id, name")
    .eq("church_id", churchId);

  const householdMap = new Map<string, string>(
    (existingHouseholds ?? []).map((h) => [h.name.toLowerCase(), h.id]),
  );

  let imported = 0;
  let skipped = 0;
  const CHUNK_SIZE = 100;

  // Process in chunks
  for (let i = 0; i < rows.length; i += CHUNK_SIZE) {
    const chunk = rows.slice(i, i + CHUNK_SIZE);
    const toInsert: Array<{
      church_id: string;
      first_name: string;
      last_name: string;
      email: string | null;
      phone: string | null;
      household_id: string | null;
      status: string;
    }> = [];
    const tagAssignments: Array<{ personIndex: number; tagIds: string[] }> = [];

    for (const row of chunk) {
      const email = row.email?.trim().toLowerCase() || null;
      const phone = row.phone?.trim().replace(/\D/g, "") || null;

      // Dedup: skip if email or phone already exists
      if (email && emailMap.has(email)) { skipped++; continue; }
      if (phone && phoneMap.has(phone)) { skipped++; continue; }

      // Resolve household
      let householdId: string | null = null;
      if (row.household?.trim()) {
        const hName = row.household.trim();
        const hKey = hName.toLowerCase();
        if (householdMap.has(hKey)) {
          householdId = householdMap.get(hKey)!;
        } else {
          const { data: newH } = await admin
            .from("households")
            .insert({ church_id: churchId, name: hName })
            .select("id")
            .single();
          if (newH) {
            householdId = newH.id;
            householdMap.set(hKey, newH.id);
          }
        }
      }

      // Resolve tags
      const tagIds: string[] = [];
      if (row.tags?.trim()) {
        const tagNames = row.tags.split(",").map((t) => t.trim()).filter(Boolean);
        for (const tName of tagNames) {
          const tKey = tName.toLowerCase();
          if (tagMap.has(tKey)) {
            tagIds.push(tagMap.get(tKey)!);
          } else {
            const { data: newT } = await admin
              .from("tags")
              .insert({ church_id: churchId, name: tName })
              .select("id")
              .single();
            if (newT) {
              tagIds.push(newT.id);
              tagMap.set(tKey, newT.id);
            }
          }
        }
      }

      toInsert.push({
        church_id: churchId,
        first_name: row.first_name.trim(),
        last_name: row.last_name.trim(),
        email: email,
        phone: row.phone?.trim() || null,
        household_id: householdId,
        status: "active",
      });

      if (tagIds.length > 0) {
        tagAssignments.push({ personIndex: toInsert.length - 1, tagIds });
      }

      // Track for dedup within this import
      if (email) emailMap.set(email, "pending");
      if (phone) phoneMap.set(phone, "pending");
    }

    if (toInsert.length > 0) {
      const { data: inserted } = await admin
        .from("people")
        .insert(toInsert)
        .select("id");

      if (inserted) {
        imported += inserted.length;

        // Assign tags
        const tagRows: Array<{ person_id: string; tag_id: string }> = [];
        for (const { personIndex, tagIds } of tagAssignments) {
          const person = inserted[personIndex];
          if (person) {
            for (const tagId of tagIds) {
              tagRows.push({ person_id: person.id, tag_id: tagId });
            }
          }
        }
        if (tagRows.length > 0) {
          await admin.from("person_tags").insert(tagRows);
        }
      }
    }
  }

  revalidatePath("/admin/people");
  return { imported, skipped, total: rows.length };
}
