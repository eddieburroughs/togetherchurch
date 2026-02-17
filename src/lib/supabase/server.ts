/**
 * Supabase client for server (Server Components, Route Handlers, Server Actions).
 * Returns null if Supabase is not configured — callers must handle this.
 */

import { ENV } from "@/lib/env";

function createStub() {
  console.warn("[supabase/server] Supabase is not configured. Using stub.");
  return null;
}

export function getSupabaseServer() {
  if (!ENV.SUPABASE_URL || !ENV.SUPABASE_ANON_KEY) {
    return null;
  }

  // TODO: Replace with createServerClient from @supabase/ssr
  // using cookies() from next/headers
  return createStub();
}

export function getSupabaseAdmin() {
  if (!ENV.SUPABASE_URL || !ENV.SUPABASE_SERVICE_ROLE_KEY) {
    return null;
  }

  // TODO: Replace with createClient from @supabase/supabase-js
  // using the service role key (bypasses RLS)
  return createStub();
}
