import { getSupabaseServer } from "@/lib/supabase/server";
import type { User } from "@supabase/supabase-js";

export interface SessionUser {
  id: string;
  email: string | undefined;
  user: User;
}

/**
 * Returns the current authenticated user from the Supabase session, or null.
 * Safe to call in Server Components, Route Handlers, and Server Actions.
 */
export async function getSessionUser(): Promise<SessionUser | null> {
  const supabase = await getSupabaseServer();
  if (!supabase) return null;

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  return {
    id: user.id,
    email: user.email,
    user,
  };
}
