"use client";

import { createBrowserClient } from "@supabase/ssr";

/**
 * Session-aware Supabase client for Client Components — currently only the
 * admin login form, which needs to run `signInWithPassword` in the browser.
 * Everything after login (reading/writing products, uploading photos) goes
 * through Server Actions using lib/supabase/server.ts instead.
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
