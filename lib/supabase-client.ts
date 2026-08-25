"use client";

import { createBrowserClient } from "@supabase/ssr";

/**
 * Session-aware Supabase client for Client Components — currently only the
 * admin login form, which needs to run `signInWithPassword` in the browser.
 * Everything after login (reading/writing products, uploading photos) goes
 * through Server Actions using lib/supabase-server.ts instead.
 *
 * Named lib/supabase-client.ts (not lib/supabase/client.ts) deliberately —
 * see the comment in lib/supabase-server.ts for why.
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
