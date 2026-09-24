"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { SlidersHorizontal, X } from "lucide-react";
import Breadcrumbs from "@/components/Breadcrumbs";
import ProductGrid from "@/components/ProductGrid";
import ProductFilters, { type FiltersState } from "@/components/ProductFilters";
import SearchBar from "@/components/SearchBar";
import { useCatalog } from "@/lib/catalog-context";
import { effectivePrice } from "@/lib/utils";
import type { CategorySlug } from "@/types";

const PAGE_SIZE = 8;

export default function ShopClient() {
  const searchParams = useSearchParams();
  const initialCategory = (searchParams.get("category") as CategorySlug | null) || "all";
  const initialQuery = searchParams.get("q") || "";

  const { products: allProducts } = useCatalog();
  const priceCeiling = useMemo(
    () => Math.max(50, Math.ceil(Math.max(0, ...allProducts.map((p) => p.price)) / 50) * 50),
    [allProducts]
  );

  const [filters, setFilters] = useState<FiltersState>({
    category: initialCategory,
    sort: "popular",
    maxPrice: priceCeiling,
  });
  const [query, setQuery] = useState(initialQuery);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  const filtered = useMemo(() => {
    let result = allProducts;

    if (filters.category !== "all") {
      result = result.filter((p) => p.category === filters.category);
    }

    if (query.trim()) {
      const q = query.trim().toLowerCase();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.brand.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q)
      );
    }

    result = result.filter(
      (p) => effectivePrice(p.price, p.salePrice) <= filters.maxPrice
    );

    const sorted = [...result];
    switch (filters.sort) {
      case "price-asc":
        sorted.sort(
          (a, b) => effectivePrice(a.price, a.salePrice) - effectivePrice(b.price, b.salePrice)
        );
        break;
      case "price-desc":
        sorted.sort(
          (a, b) => effectivePrice(b.price, b.salePrice) - effectivePrice(a.price, a.salePrice)
        );
        break;
      case "newest":
        sorted.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
        break;
      case "popular":
      default:
        sorted.sort((a, b) => Number(b.featured) - Number(a.featured));
        break;
    }

    return sorted;
  }, [allProducts, filters, query]);

  const visibleProducts = filtered.slice(0, visibleCount);
  const hasMore = visibleCount < filtered.length;

  const handleFiltersChange = (next: FiltersState) => {
    setFilters(next);
    setVisibleCount(PAGE_SIZE);
  };

  return (
    <div className="container-page pb-16">
      <Breadcrumbs items={[{ label: "Shop" }]} />

      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">Shop</h1>
          <p className="mt-1 text-sm text-gray-500">
            {query
              ? `Showing results for "${query}"`
              : "Browse our full range of pharmacy products."}
          </p>
        </div>
      </div>

      <div className="mb-6 sm:max-w-md">
        <SearchBar />
      </div>

      <div className="mb-4 flex items-center justify-between sm:hidden">
        <button
          type="button"
          onClick={() => setMobileFiltersOpen(true)}
          className="btn-secondary !py-2 text-sm"
        >
          <SlidersHorizontal className="h-4 w-4" aria-hidden="true" />
          Filters
        </button>
        <span className="text-sm text-gray-500">{filtered.length} results</span>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[260px_1fr]">
        <aside className="hidden lg:block">
          <div className="sticky top-24">
            <ProductFilters
              filters={filters}
              onChange={handleFiltersChange}
              priceCeiling={priceCeiling}
              resultCount={filtered.length}
            />
          </div>
        </aside>

        <div>
          <ProductGrid
            products={visibleProducts}
            emptyMessage={
              query
                ? `No products match "${query}". Try a different search term or clear filters.`
                : "No products match your filters. Try adjusting or resetting them."
            }
          />

          {hasMore && (
            <div className="mt-8 flex justify-center">
              <button
                type="button"
                onClick={() => setVisibleCount((c) => c + PAGE_SIZE)}
                className="btn-secondary"
              >
                Load More
              </button>
            </div>
          )}
        </div>
      </div>

      {mobileFiltersOpen && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Filters">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setMobileFiltersOpen(false)}
            aria-hidden="true"
          />
          <div className="absolute bottom-0 left-0 right-0 max-h-[85vh] overflow-y-auto rounded-t-2xl bg-white p-4">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-base font-semibold">Filters</h2>
              <button
                onClick={() => setMobileFiltersOpen(false)}
                aria-label="Close filters"
                className="rounded-full p-2 hover:bg-gray-100"
              >
                <X className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>
            <ProductFilters
              filters={filters}
              onChange={handleFiltersChange}
              priceCeiling={priceCeiling}
              resultCount={filtered.length}
            />
            <button
              onClick={() => setMobileFiltersOpen(false)}
              className="btn-primary mt-4 w-full"
            >
              Show {filtered.length} Results
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
