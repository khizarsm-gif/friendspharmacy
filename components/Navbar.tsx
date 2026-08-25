"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X, ShoppingCart, MessageCircle, Cross, Search } from "lucide-react";
import { businessConfig } from "@/config/business";
import { useCart } from "@/lib/cart-context";
import SearchBar from "@/components/SearchBar";
import { buildWhatsAppContactUrl } from "@/lib/whatsapp";

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/shop", label: "Shop" },
  { href: "/#categories", label: "Categories" },
  { href: "/about", label: "About Us" },
  { href: "/contact", label: "Contact" },
];

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const { itemCount, openDrawer } = useCart();

  return (
    <header className="sticky top-0 z-40 border-b border-gray-100 bg-white/95 backdrop-blur">
      <div className="container-page flex h-16 items-center justify-between gap-4">
        <Link href="/" className="flex shrink-0 items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-600 text-white">
            <Cross className="h-5 w-5" aria-hidden="true" />
          </span>
          <span className="flex flex-col leading-tight">
            <span className="text-base font-bold text-gray-900 sm:text-lg">
              {businessConfig.name}
            </span>
            <span className="hidden text-[11px] text-gray-500 sm:block">
              {businessConfig.tagline}
            </span>
          </span>
        </Link>

        <nav
          className="hidden items-center gap-6 lg:flex"
          aria-label="Primary navigation"
        >
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-gray-700 transition-colors hover:text-brand-700"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="hidden flex-1 items-center justify-end gap-3 md:flex">
          <SearchBar className="max-w-xs" />
          <button
            onClick={openDrawer}
            aria-label={`Open cart, ${itemCount} items`}
            className="relative rounded-full p-2.5 text-gray-700 hover:bg-brand-50 hover:text-brand-700"
          >
            <ShoppingCart className="h-5 w-5" aria-hidden="true" />
            {itemCount > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-brand-600 text-[11px] font-bold text-white">
                {itemCount > 99 ? "99+" : itemCount}
              </span>
            )}
          </button>
          <a
            href={buildWhatsAppContactUrl()}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-whatsapp !px-4 !py-2.5 text-sm"
          >
            <MessageCircle className="h-4 w-4" aria-hidden="true" />
            <span className="hidden lg:inline">WhatsApp</span>
          </a>
        </div>

        {/* Mobile controls */}
        <div className="flex items-center gap-1 md:hidden">
          <button
            onClick={() => setMobileSearchOpen((v) => !v)}
            aria-label="Toggle search"
            aria-expanded={mobileSearchOpen}
            className="rounded-full p-2.5 text-gray-700 hover:bg-brand-50"
          >
            <Search className="h-5 w-5" aria-hidden="true" />
          </button>
          <button
            onClick={openDrawer}
            aria-label={`Open cart, ${itemCount} items`}
            className="relative rounded-full p-2.5 text-gray-700 hover:bg-brand-50"
          >
            <ShoppingCart className="h-5 w-5" aria-hidden="true" />
            {itemCount > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-brand-600 text-[11px] font-bold text-white">
                {itemCount > 99 ? "99+" : itemCount}
              </span>
            )}
          </button>
          <button
            onClick={() => setMobileOpen((v) => !v)}
            aria-label="Toggle menu"
            aria-expanded={mobileOpen}
            className="rounded-full p-2.5 text-gray-700 hover:bg-brand-50"
          >
            {mobileOpen ? (
              <X className="h-5 w-5" aria-hidden="true" />
            ) : (
              <Menu className="h-5 w-5" aria-hidden="true" />
            )}
          </button>
        </div>
      </div>

      {mobileSearchOpen && (
        <div className="border-t border-gray-100 px-4 py-3 md:hidden">
          <SearchBar autoFocus onNavigate={() => setMobileSearchOpen(false)} />
        </div>
      )}

      {mobileOpen && (
        <nav
          aria-label="Mobile navigation"
          className="flex flex-col gap-1 border-t border-gray-100 px-4 py-3 md:hidden"
        >
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMobileOpen(false)}
              className="rounded-lg px-3 py-2.5 text-sm font-medium text-gray-700 hover:bg-brand-50"
            >
              {link.label}
            </Link>
          ))}
          <a
            href={buildWhatsAppContactUrl()}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => setMobileOpen(false)}
            className="btn-whatsapp mt-2 w-full"
          >
            <MessageCircle className="h-4 w-4" aria-hidden="true" />
            WhatsApp Us
          </a>
        </nav>
      )}
    </header>
  );
}
