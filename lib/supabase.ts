import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/** Cache tag for every public catalog read. Admin writes call revalidateTag(CATALOG_TAG). */
export const CATALOG_TAG = "catalog";

let cachedClient: SupabaseClient | null = null;

/**
 * Shared Supabase client for the public product catalog (read-only).
 *
 * Uses the publishable ("anon") key, which is safe to expose; Row Level
 * Security only allows SELECT for this key. All writes happen in the admin
 * portal through the session-aware client in lib/supabase-server.ts and are
 * limited to accounts listed in the `admin_users` table.
 *
 * On the server, every request is tagged with CATALOG_TAG and cached for up
 * to 5 minutes, so the storefront stays fast. When an admin saves a product
 * or category, the admin actions purge the tag and the change shows up
 * immediately.
 *
 * Requires NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY
 * (locally in .env.local, and in Vercel -> Project -> Settings ->
 * Environment Variables for production).
 */
export function getSupabaseClient(): SupabaseClient {
  if (cachedClient) return cachedClient;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    throw new Error(
      "Missing Supabase environment variables. Set NEXT_PUBLIC_SUPABASE_URL and " +
        "NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local, and in your Vercel project's " +
        "Environment Variables settings for production."
    );
  }

  cachedClient = createClient(url, key, {
    auth: { persistSession: false },
    global: {
      // `next` is a Next.js fetch extension; browsers ignore it.
      fetch: (input: RequestInfo | URL, init?: RequestInit) =>
        fetch(input, {
          ...init,
          next: { revalidate: 300, tags: [CATALOG_TAG] },
        } as RequestInit),
    },
  });
  return cachedClient;
}
