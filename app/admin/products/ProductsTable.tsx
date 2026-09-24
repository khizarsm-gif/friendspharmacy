"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Pencil, Search, Star } from "lucide-react";
import type { Category, Product } from "@/types";
import { formatPrice } from "@/lib/utils";
import ConfirmDeleteButton from "../_components/ConfirmDeleteButton";
import { deleteProduct } from "./actions";

const LOW_STOCK = 5;
type StockFilter = "all" | "low" | "out" | "featured" | "demo";

const FILTERS: { value: StockFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "low", label: "Low stock" },
  { value: "out", label: "Out of stock" },
  { value: "featured", label: "Featured" },
  { value: "demo", label: "Demo" },
];

function StockBadge({ stock }: { stock: number }) {
  if (stock <= 0) return <span className="badge bg-red-50 text-red-700">Out of stock</span>;
  if (stock <= LOW_STOCK) return <span className="badge bg-amber-50 text-amber-700">{stock} left</span>;
  return <span className="badge bg-gray-100 text-gray-700">{stock}</span>;
}

export default function ProductsTable({
  products,
  categories,
  initialFilter,
  initialCategory,
}: {
  products: Product[];
  categories: Category[];
  initialFilter?: string;
  initialCategory?: string;
}) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState(
    categories.some((c) => c.slug === initialCategory) ? (initialCategory as string) : "all"
  );
  const [filter, setFilter] = useState<StockFilter>(
    FILTERS.some((f) => f.value === initialFilter) ? (initialFilter as StockFilter) : "all"
  );

  const categoryName = useMemo(
    () => Object.fromEntries(categories.map((c) => [c.slug, c.name])),
    [categories]
  );

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return products.filter((p) => {
      if (category !== "all" && p.category !== category) return false;
      if (filter === "low" && !(p.stock > 0 && p.stock <= LOW_STOCK)) return false;
      if (filter === "out" && p.stock > 0) return false;
      if (filter === "featured" && !p.featured) return false;
      if (filter === "demo" && !p.isDemo) return false;
      if (!q) return true;
      return (
        p.name.toLowerCase().includes(q) ||
        p.brand.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q)
      );
    });
  }, [products, query, category, filter]);

  return (
    <div className="card overflow-hidden">
      <div className="flex flex-col gap-3 border-b p-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-1 flex-col gap-3 sm:flex-row">
          <div className="relative sm:max-w-xs sm:flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" aria-hidden="true" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search name, brand or SKU"
              aria-label="Search products"
              className="input pl-9"
            />
          </div>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            aria-label="Filter by category"
            className="input sm:w-56"
          >
            <option value="all">All categories</option>
            {categories.map((c) => (
              <option key={c.slug} value={c.slug}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-wrap gap-1.5" role="group" aria-label="Quick filters">
          {FILTERS.map((f) => (
            <button
              key={f.value}
              type="button"
              onClick={() => setFilter(f.value)}
              aria-pressed={filter === f.value}
              className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
                filter === f.value
                  ? "bg-brand-600 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {visible.length === 0 ? (
        <p className="px-4 py-12 text-center text-sm text-gray-500">No products match these filters.</p>
      ) : (
        <>
          {/* Desktop table */}
          <table className="hidden w-full text-left text-sm md:table">
            <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
              <tr>
                <th className="px-4 py-3 font-semibold">Product</th>
                <th className="px-4 py-3 font-semibold">Category</th>
                <th className="px-4 py-3 font-semibold">Price</th>
                <th className="px-4 py-3 font-semibold">Stock</th>
                <th className="px-4 py-3 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {visible.map((p) => (
                <tr key={p.id} className="hover:bg-gray-50/60">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <span className="relative h-11 w-11 shrink-0 overflow-hidden rounded-lg bg-gray-100">
                        <Image src={p.image} alt="" fill sizes="44px" className="object-cover" />
                      </span>
                      <div className="min-w-0">
                        <Link
                          href={`/admin/products/${p.id}/edit`}
                          className="flex items-center gap-1.5 font-medium text-gray-900 hover:text-brand-700"
                        >
                          <span className="truncate">{p.name}</span>
                          {p.featured && <Star className="h-3.5 w-3.5 shrink-0 fill-amber-400 text-amber-400" aria-label="Featured" />}
                          {p.isDemo && (
                            <span className="badge shrink-0 bg-amber-100 !px-1.5 !py-0 text-[10px] text-amber-700">DEMO</span>
                          )}
                        </Link>
                        <p className="text-xs text-gray-500">
                          {p.brand} · {p.sku}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{categoryName[p.category] ?? p.category}</td>
                  <td className="px-4 py-3">
                    <span className="font-medium text-gray-900">{formatPrice(p.salePrice ?? p.price)}</span>
                    {p.salePrice != null && (
                      <span className="ml-1.5 text-xs text-gray-400 line-through">{formatPrice(p.price)}</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <StockBadge stock={p.stock} />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <Link
                        href={`/admin/products/${p.id}/edit`}
                        className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-sm font-medium text-brand-700 hover:bg-brand-50"
                      >
                        <Pencil className="h-4 w-4" aria-hidden="true" />
                        Edit
                      </Link>
                      <ConfirmDeleteButton
                        action={deleteProduct.bind(null, p.id)}
                        confirmText={`Delete "${p.name}"? This cannot be undone.`}
                        iconOnly
                        label={`Delete ${p.name}`}
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Mobile cards */}
          <ul className="divide-y md:hidden">
            {visible.map((p) => (
              <li key={p.id} className="flex items-center gap-3 p-4">
                <span className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-gray-100">
                  <Image src={p.image} alt="" fill sizes="56px" className="object-cover" />
                </span>
                <Link href={`/admin/products/${p.id}/edit`} className="min-w-0 flex-1">
                  <p className="truncate font-medium text-gray-900">{p.name}</p>
                  <p className="text-xs text-gray-500">{categoryName[p.category] ?? p.category}</p>
                  <div className="mt-1 flex items-center gap-2 text-sm">
                    <span className="font-semibold">{formatPrice(p.salePrice ?? p.price)}</span>
                    <StockBadge stock={p.stock} />
                  </div>
                </Link>
                <ConfirmDeleteButton
                  action={deleteProduct.bind(null, p.id)}
                  confirmText={`Delete "${p.name}"? This cannot be undone.`}
                  iconOnly
                  label={`Delete ${p.name}`}
                />
              </li>
            ))}
          </ul>
        </>
      )}
      <p className="border-t px-4 py-3 text-xs text-gray-500">
        Showing {visible.length} of {products.length}
      </p>
    </div>
  );
}
