import type { ReactNode } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "../actions";

export const dynamic = "force-dynamic";

/**
 * Shell for the whole /admin/products section (list, add, edit). Confirms
 * there's a logged-in user server-side — defense in depth alongside
 * middleware.ts, which already redirects unauthenticated requests before
 * they get this far.
 */
export default async function AdminProductsLayout({ children }: { children: ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/admin/login");

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b bg-white">
        <div className="container-page flex items-center justify-between py-4">
          <div>
            <Link href="/admin/products" className="text-lg font-bold text-gray-900">
              Friends Pharmacy — Admin
            </Link>
            <p className="text-xs text-gray-500">Signed in as {user.email}</p>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/" className="text-sm text-gray-600 hover:underline">
              View site
            </Link>
            <form action={signOut}>
              <button type="submit" className="text-sm font-medium text-red-600 hover:underline">
                Sign out
              </button>
            </form>
          </div>
        </div>
      </header>
      <main className="container-page py-8">{children}</main>
    </div>
  );
}
