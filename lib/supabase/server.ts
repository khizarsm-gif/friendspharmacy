import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * Session-aware Supabase client for use in Server Components, Route
 * Handlers, and Server Actions. Unlike the plain client in lib/supabase.ts
 * (which never carries a user session — it's used for public, read-only
 * product/category queries), this client reads the visitor's auth cookies,
 * so requests it makes are authenticated as the logged-in admin user and
 * satisfy the "authenticated" Row Level Security policies on products and
 * the product-images storage bucket.
 *
 * Only used by the /admin section — the public storefront never needs a
 * logged-in session.
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch {
            // Called from a Server Component render, where cookies can't be
            // written. Harmless — middleware.ts refreshes the session cookie
            // on every /admin request, so the session still stays alive.
          }
        },
      },
    }
  );
}
