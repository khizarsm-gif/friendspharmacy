import type { Metadata } from "next";
import type { ReactNode } from "react";
import { ShieldAlert } from "lucide-react";
import { getAdminSession } from "@/lib/admin-auth";
import AdminShell from "./_components/AdminShell";
import { signOut } from "./actions";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Admin",
  robots: { index: false, follow: false },
};

/**
 * Layout for the whole /admin section.
 * - Not signed in: only the login page is reachable (middleware.ts), shown bare.
 * - Signed in but not in `admin_users`: a "not authorized" screen.
 * - Admin: the sidebar shell.
 */
export default async function AdminLayout({ children }: { children: ReactNode }) {
  const { user, isAdmin, role, displayName, mustChangePassword } = await getAdminSession();

  if (!user) return <>{children}</>;

  if (!isAdmin) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
        <div className="card w-full max-w-md p-8 text-center">
          <ShieldAlert className="mx-auto mb-3 h-10 w-10 text-amber-500" aria-hidden="true" />
          <h1 className="text-lg font-bold text-gray-900">Not authorized</h1>
          <p className="mt-2 text-sm text-gray-600">
            {user.email} is signed in but isn&apos;t an admin for this store. Ask the owner to
            add this account to the <code className="rounded bg-gray-100 px-1">admin_users</code>{" "}
            table in Supabase.
          </p>
          <form action={signOut} className="mt-6">
            <button type="submit" className="btn-secondary">
              Sign out
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <AdminShell
      email={user.email ?? ""}
      name={displayName}
      role={role ?? "purchaser"}
      mustChangePassword={mustChangePassword}
    >
      {children}
    </AdminShell>
  );
}
