"use client";

import { useState, type ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ExternalLink, LayoutDashboard, LogOut, Menu, Package, Tags, X, type LucideIcon,
} from "lucide-react";
import { classNames } from "@/lib/utils";
import { signOut } from "../actions";

const NAV: { href: string; label: string; icon: LucideIcon; exact?: boolean }[] = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/admin/products", label: "Products", icon: Package },
  { href: "/admin/categories", label: "Categories", icon: Tags },
];

export default function AdminShell({ email, children }: { email: string; children: ReactNode }) {
  const pathname = usePathname() ?? "";
  const [open, setOpen] = useState(false);

  const isActive = (href: string, exact?: boolean) =>
    exact ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);

  const sidebar = (
    <div className="flex h-full flex-col">
      <Link href="/admin" className="block px-5 py-5" onClick={() => setOpen(false)}>
        <span className="inline-block rounded-xl bg-white px-3 py-2">
          <Image src="/images/logo.png" alt="Friends Pharmacy" width={118} height={48} />
        </span>
        <span className="mt-2 block text-xs font-medium uppercase tracking-wider text-brand-300">
          Admin Portal
        </span>
      </Link>

      <nav className="flex-1 space-y-1 px-3 py-2" aria-label="Admin">
        {NAV.map(({ href, label, icon: Icon, exact }) => (
          <Link
            key={href}
            href={href}
            onClick={() => setOpen(false)}
            aria-current={isActive(href, exact) ? "page" : undefined}
            className={classNames(
              "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
              isActive(href, exact)
                ? "bg-white/10 text-white"
                : "text-brand-200 hover:bg-white/5 hover:text-white"
            )}
          >
            <Icon className="h-5 w-5" aria-hidden="true" />
            {label}
          </Link>
        ))}
        <a
          href="/"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-brand-200 hover:bg-white/5 hover:text-white"
        >
          <ExternalLink className="h-5 w-5" aria-hidden="true" />
          View store
        </a>
      </nav>

      <div className="border-t border-white/10 p-4">
        <p className="truncate text-xs text-brand-300" title={email}>
          {email}
        </p>
        <form action={signOut} className="mt-2">
          <button
            type="submit"
            className="flex items-center gap-2 text-sm font-medium text-brand-100 hover:text-white"
          >
            <LogOut className="h-4 w-4" aria-hidden="true" />
            Sign out
          </button>
        </form>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 hidden w-64 bg-brand-950 lg:block">{sidebar}</aside>

      {/* Mobile top bar + drawer */}
      <header className="sticky top-0 z-30 flex items-center justify-between border-b bg-white px-4 py-3 lg:hidden">
        <span className="text-sm font-bold text-gray-900">Friends Pharmacy Admin</span>
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Open menu"
          className="rounded-lg p-2 hover:bg-gray-100"
        >
          <Menu className="h-5 w-5" aria-hidden="true" />
        </button>
      </header>
      {open && (
        <div className="fixed inset-0 z-40 lg:hidden" role="dialog" aria-modal="true">
          <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} aria-hidden="true" />
          <aside className="absolute inset-y-0 left-0 w-64 bg-brand-950">
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close menu"
              className="absolute right-3 top-4 rounded-lg p-1.5 text-brand-200 hover:bg-white/10"
            >
              <X className="h-5 w-5" aria-hidden="true" />
            </button>
            {sidebar}
          </aside>
        </div>
      )}

      <main className="px-4 py-6 sm:px-6 lg:ml-64 lg:px-10 lg:py-8">{children}</main>
    </div>
  );
}
