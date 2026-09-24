"use client";

import { usePathname } from "next/navigation";

/**
 * Wraps the storefront header/footer/floating buttons so they are hidden
 * inside the admin portal, which has its own layout.
 */
export default function SiteChrome({
  header,
  footer,
  children,
}: {
  header: React.ReactNode;
  footer: React.ReactNode;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  if (pathname?.startsWith("/admin")) return <>{children}</>;

  return (
    <>
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[100] focus:rounded-lg focus:bg-brand-700 focus:px-4 focus:py-2 focus:text-white"
      >
        Skip to main content
      </a>
      {header}
      <main id="main-content" className="flex-1">
        {children}
      </main>
      {footer}
    </>
  );
}
