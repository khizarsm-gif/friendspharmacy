import type { Metadata } from "next";
import { Suspense } from "react";
import ShopClient from "./ShopClient";

export const metadata: Metadata = {
  title: "Shop Medicines & Healthcare Products",
  description:
    "Browse and search our full range of medicines, vitamins, personal care, baby care, and wellness products. Filter by category and price, and order online or via WhatsApp.",
  alternates: { canonical: "/shop" },
};

// The shop page reads `?q=` and `?category=` from the URL via useSearchParams
// to pre-apply search/category filters (e.g. links from the homepage
// category cards or the header search). Forcing dynamic rendering means the
// server renders the fully-filtered product list on each request — including
// for search engine crawlers and WhatsApp/social link previews — rather than
// serving a generic "Loading…" shell from a build-time static snapshot.
export const dynamic = "force-dynamic";

export default function ShopPage() {
  return (
    <Suspense fallback={<div className="container-page py-16 text-center text-sm text-gray-500">Loading products…</div>}>
      <ShopClient />
    </Suspense>
  );
}
