/**
 * Supabase client for browser (Client Components).
 * Returns null if Supabase is not configured — callers must handle this.
 */

import { ENV } from "@/lib/env";

let client: ReturnType<typeof createStub> | null = null;

function createStub() {
  // Stub: will be replaced with real createBrowserClient once
  // @supabase/ssr is installed and env vars are set.
  console.warn("[supabase/browser] Supabase is not configured. Using stub.");
  return null;
}

export function getSupabaseBrowser() {
  if (!ENV.SUPABASE_URL || !ENV.SUPABASE_ANON_KEY) {
    return null;
  }

  if (!client) {
    // TODO: Replace with createBrowserClient from @supabase/ssr
    client = createStub();
  }

  return client;
}
