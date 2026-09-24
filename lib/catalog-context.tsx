"use client";

import { createContext, useContext, useMemo } from "react";
import type { Category, Product } from "@/types";

interface CatalogContextValue {
  products: Product[];
  categories: Category[];
  getProductById: (id: number) => Product | undefined;
  getCategory: (slug: string) => Category | undefined;
}

const CatalogContext = createContext<CatalogContextValue | undefined>(undefined);

/**
 * Makes the product catalog available to client components (search, cart,
 * shop filters). The root layout fetches it once on the server (cached) and
 * passes it in, so client components never call Supabase themselves.
 */
export function CatalogProvider({
  products,
  categories,
  children,
}: {
  products: Product[];
  categories: Category[];
  children: React.ReactNode;
}) {
  const value = useMemo<CatalogContextValue>(() => {
    const byId = new Map(products.map((p) => [p.id, p]));
    const bySlug = new Map(categories.map((c) => [c.slug, c]));
    return {
      products,
      categories,
      getProductById: (id) => byId.get(id),
      getCategory: (slug) => bySlug.get(slug),
    };
  }, [products, categories]);

  return <CatalogContext.Provider value={value}>{children}</CatalogContext.Provider>;
}

export function useCatalog(): CatalogContextValue {
  const ctx = useContext(CatalogContext);
  if (!ctx) throw new Error("useCatalog must be used within a CatalogProvider");
  return ctx;
}
