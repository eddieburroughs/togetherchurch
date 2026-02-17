import { getSupabaseAdmin } from "@/lib/supabase/server";

/**
 * Write an entry to the audit_log table.
 * Fire-and-forget — never throws, never blocks the caller.
 */
export async function logAudit(opts: {
  churchId: string;
  userId: string;
  action: string;
  targetType?: string;
  targetId?: string;
  meta?: Record<string, unknown>;
}) {
  try {
    const admin = getSupabaseAdmin();
    if (!admin) return;

    await admin.from("audit_log").insert({
      church_id: opts.churchId,
      actor_user_id: opts.userId,
      action: opts.action,
      target_type: opts.targetType ?? null,
      target_id: opts.targetId ?? null,
      meta: opts.meta ?? null,
    });
  } catch {
    // Audit logging must never break the main operation
  }
}
