import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase-server";

type ServerSupabase = Awaited<ReturnType<typeof createClient>>;

export type AdminRole = "owner" | "purchaser";

export interface AdminSession {
  supabase: ServerSupabase;
  user: { id: string; email?: string } | null;
  isAdmin: boolean;
  role: AdminRole | null;
  displayName: string | null;
  mustChangePassword: boolean;
}

/**
 * Returns the signed-in user and their row in `admin_users` (role etc.).
 * Signing in alone is not enough to manage the store: Row Level Security
 * also requires is_admin() / is_owner(), so these checks decide what the UI
 * shows while the database remains the real gatekeeper.
 */
export async function getAdminSession(): Promise<AdminSession> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const empty = { isAdmin: false, role: null, displayName: null, mustChangePassword: false };
  if (!user) return { supabase, user: null, ...empty };

  const { data, error } = await supabase
    .from("admin_users")
    .select("role, display_name, must_change_password")
    .eq("user_id", user.id)
    .maybeSingle();
  if (error) console.error("[admin-auth] admin_users lookup failed:", error.message);

  const sessionUser = { id: user.id, email: user.email };
  if (!data) return { supabase, user: sessionUser, ...empty };
  return {
    supabase,
    user: sessionUser,
    isAdmin: true,
    role: data.role as AdminRole,
    displayName: data.display_name,
    mustChangePassword: data.must_change_password,
  };
}

/** For admin pages: redirects anyone who isn't a signed-in team member. */
export async function requireAdminPage(): Promise<ServerSupabase> {
  const { supabase, user, isAdmin } = await getAdminSession();
  if (!user || !isAdmin) redirect("/admin/login");
  return supabase;
}

/** For owner-only pages (team, category editing): purchasers go back to the dashboard. */
export async function requireOwnerPage(): Promise<AdminSession> {
  const session = await getAdminSession();
  if (!session.user || !session.isAdmin) redirect("/admin/login");
  if (session.role !== "owner") redirect("/admin");
  return session;
}

type ActionAuth =
  | { supabase: ServerSupabase; userId: string; error: null }
  | { supabase: null; userId: null; error: string };

/** For server actions: any team member. Returns an error message instead of redirecting. */
export async function requireAdminAction(): Promise<ActionAuth> {
  const { supabase, user, isAdmin } = await getAdminSession();
  if (!user) return { supabase: null, userId: null, error: "Your session expired. Please sign in again." };
  if (!isAdmin) return { supabase: null, userId: null, error: "This account is not allowed to manage the store." };
  return { supabase, userId: user.id, error: null };
}

/** For server actions: owners only. */
export async function requireOwnerAction(): Promise<ActionAuth> {
  const { supabase, user, isAdmin, role } = await getAdminSession();
  if (!user) return { supabase: null, userId: null, error: "Your session expired. Please sign in again." };
  if (!isAdmin || role !== "owner") {
    return { supabase: null, userId: null, error: "Only an owner can do this." };
  }
  return { supabase, userId: user.id, error: null };
}
