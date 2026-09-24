import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * SERVER-ONLY Supabase client using the secret service role key. It bypasses
 * Row Level Security, so it is only used by the Team actions after the caller
 * has been verified as an owner. Never import this from a Client Component.
 *
 * Requires SUPABASE_SERVICE_ROLE_KEY (no NEXT_PUBLIC_ prefix, so it is never
 * sent to the browser) in Vercel -> Settings -> Environment Variables.
 */
export function createAdminClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error(
      "Team management isn't set up yet: add SUPABASE_SERVICE_ROLE_KEY to the Vercel environment variables and redeploy."
    );
  }
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

export function isAdminClientConfigured(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
}
