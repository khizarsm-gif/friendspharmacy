import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase-server";

type ServerSupabase = Awaited<ReturnType<typeof createClient>>;

export interface AdminSession {
  supabase: ServerSupabase;
  user: { id: string; email?: string } | null;
  isAdmin: boolean;
}

/**
 * Returns the signed-in user and whether they are listed in `admin_users`.
 * Signing in alone is not enough to manage the store: the database's Row
 * Level Security policies also require `is_admin()`, so this check only
 * decides what the UI shows; the database is the real gatekeeper.
 */
export async function getAdminSession(): Promise<AdminSession> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { supabase, user: null, isAdmin: false };

  const { data, error } = await supabase
    .from("admin_users")
    .select("user_id")
    .eq("user_id", user.id)
    .maybeSingle();
  if (error) console.error("[admin-auth] admin_users lookup failed:", error.message);

  return { supabase, user: { id: user.id, email: user.email }, isAdmin: Boolean(data) };
}

/** For admin pages: redirects anyone who isn't a signed-in admin. */
export async function requireAdminPage(): Promise<ServerSupabase> {
  const { supabase, user, isAdmin } = await getAdminSession();
  if (!user || !isAdmin) redirect("/admin/login");
  return supabase;
}

/** For server actions: returns an error message instead of redirecting. */
export async function requireAdminAction(): Promise<
  { supabase: ServerSupabase; error: null } | { supabase: null; error: string }
> {
  const { supabase, user, isAdmin } = await getAdminSession();
  if (!user) return { supabase: null, error: "Your session expired. Please sign in again." };
  if (!isAdmin) return { supabase: null, error: "This account is not allowed to manage the store." };
  return { supabase, error: null };
}
