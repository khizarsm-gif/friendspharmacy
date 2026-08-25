import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let cachedClient: SupabaseClient | null = null;

/**
 * Shared Supabase client for the public product catalog.
 *
 * Safe to call from Server Components, Client Components, and route
 * handlers alike — it uses the publishable ("anon") key, which is designed
 * to be exposed to the browser. Read access is scoped by the Row Level
 * Security policies created in the products/categories migration (public
 * read-only; no insert/update/delete for this key). A future admin
 * dashboard would use the separate service role key, kept server-only, for
 * writes.
 *
 * Requires NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to be
 * set (see .env.local.example).
 */
export function getSupabaseClient(): SupabaseClient {
  if (cachedClient) return cachedClient;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    throw new Error(
      "Missing Supabase environment variables. Set NEXT_PUBLIC_SUPABASE_URL and " +
        "NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local (see .env.local.example), and " +
        "in your Vercel project's Environment Variables settings for production."
    );
  }

  cachedClient = createClient(url, key, {
    auth: { persistSession: false },
  });
  return cachedClient;
}
