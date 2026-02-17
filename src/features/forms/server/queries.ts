"use server";

import { getSupabaseServer } from "@/lib/supabase/server";
import { getUserChurchContext } from "@/lib/auth/getUserChurchContext";
import { getSessionUser } from "@/lib/auth/getSessionUser";

export interface FormRow {
  id: string;
  church_id: string;
  key: string;
  title: string;
  schema: FormSchema;
  is_enabled: boolean;
  created_at: string;
}

export interface FormField {
  name: string;
  label: string;
  type: "text" | "email" | "tel" | "textarea" | "checkbox";
  required?: boolean;
}

export interface FormSchema {
  fields: FormField[];
}

export interface SubmissionRow {
  id: string;
  church_id: string;
  form_id: string;
  submitted_by_user_id: string | null;
  payload: Record<string, unknown>;
  created_at: string;
  // joined
  form_title?: string;
  form_key?: string;
}

async function getChurchId(): Promise<string> {
  const session = await getSessionUser();
  if (!session) throw new Error("Authentication required.");
  const ctx = await getUserChurchContext(session.id);
  if (!ctx) throw new Error("No church membership.");
  return ctx.churchId;
}

export async function listForms() {
  const churchId = await getChurchId();
  const supabase = await getSupabaseServer();
  if (!supabase) return [];

  const { data } = await supabase
    .from("form_definitions")
    .select("*")
    .eq("church_id", churchId)
    .order("created_at");

  return (data ?? []) as FormRow[];
}

export async function getFormByKey(key: string) {
  const churchId = await getChurchId();
  const supabase = await getSupabaseServer();
  if (!supabase) return null;

  const { data } = await supabase
    .from("form_definitions")
    .select("*")
    .eq("church_id", churchId)
    .eq("key", key)
    .eq("is_enabled", true)
    .single();

  return data as FormRow | null;
}

export async function getForm(id: string) {
  const churchId = await getChurchId();
  const supabase = await getSupabaseServer();
  if (!supabase) return null;

  const { data } = await supabase
    .from("form_definitions")
    .select("*")
    .eq("id", id)
    .eq("church_id", churchId)
    .single();

  return data as FormRow | null;
}

export async function listSubmissions(opts?: {
  formId?: string;
  offset?: number;
  limit?: number;
}) {
  const churchId = await getChurchId();
  const supabase = await getSupabaseServer();
  if (!supabase) return { data: [], count: 0 };

  const limit = opts?.limit ?? 50;
  const offset = opts?.offset ?? 0;

  let query = supabase
    .from("form_submissions")
    .select("*, form_definitions(title, key)", { count: "exact" })
    .eq("church_id", churchId)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (opts?.formId) {
    query = query.eq("form_id", opts.formId);
  }

  const { data, count } = await query;

  const rows: SubmissionRow[] = (data ?? []).map((r: Record<string, unknown>) => {
    const formDef = r.form_definitions as { title: string; key: string } | null;
    return {
      id: r.id as string,
      church_id: r.church_id as string,
      form_id: r.form_id as string,
      submitted_by_user_id: r.submitted_by_user_id as string | null,
      payload: r.payload as Record<string, unknown>,
      created_at: r.created_at as string,
      form_title: formDef?.title,
      form_key: formDef?.key,
    };
  });

  return { data: rows, count: count ?? 0 };
}

export async function getSubmission(id: string) {
  const churchId = await getChurchId();
  const supabase = await getSupabaseServer();
  if (!supabase) return null;

  const { data } = await supabase
    .from("form_submissions")
    .select("*, form_definitions(title, key, schema)")
    .eq("id", id)
    .eq("church_id", churchId)
    .single();

  if (!data) return null;

  const formDef = data.form_definitions as {
    title: string;
    key: string;
    schema: FormSchema;
  } | null;

  return {
    id: data.id as string,
    church_id: data.church_id as string,
    form_id: data.form_id as string,
    submitted_by_user_id: data.submitted_by_user_id as string | null,
    payload: data.payload as Record<string, unknown>,
    created_at: data.created_at as string,
    form_title: formDef?.title,
    form_key: formDef?.key,
    form_schema: formDef?.schema,
  };
}
