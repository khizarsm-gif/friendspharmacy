"use client";

import { useCatalog } from "@/lib/catalog-context";
import type { CategorySlug, SortOption } from "@/types";
import { formatPrice } from "@/lib/utils";

export interface FiltersState {
  category: CategorySlug | "all";
  sort: SortOption;
  maxPrice: number;
}

interface ProductFiltersProps {
  filters: FiltersState;
  onChange: (filters: FiltersState) => void;
  priceCeiling: number;
  resultCount: number;
}

const sortOptions: { value: SortOption; label: string }[] = [
  { value: "popular", label: "Popular" },
  { value: "price-asc", label: "Price: Low to High" },
  { value: "price-desc", label: "Price: High to Low" },
  { value: "newest", label: "Newest" },
];

export default function ProductFilters({
  filters,
  onChange,
  priceCeiling,
  resultCount,
}: ProductFiltersProps) {
  const { categories } = useCatalog();
  return (
    <div className="card flex flex-col gap-6 p-4 sm:p-5">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-gray-900">Filters</h2>
        <span className="text-xs text-gray-500">{resultCount} results</span>
      </div>

      <fieldset>
        <legend className="label">Category</legend>
        <div className="flex flex-col gap-1">
          <label className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-sm hover:bg-brand-50">
            <input
              type="radio"
              name="category"
              className="h-4 w-4 accent-brand-600"
              checked={filters.category === "all"}
              onChange={() => onChange({ ...filters, category: "all" })}
            />
            All Categories
          </label>
          {categories.map((cat) => (
            <label
              key={cat.slug}
              className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-sm hover:bg-brand-50"
            >
              <input
                type="radio"
                name="category"
                className="h-4 w-4 accent-brand-600"
                checked={filters.category === cat.slug}
                onChange={() => onChange({ ...filters, category: cat.slug })}
              />
              {cat.name}
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend className="label">
          Max Price: {formatPrice(filters.maxPrice)}
        </legend>
        <input
          type="range"
          min={0}
          max={priceCeiling}
          step={50}
          value={filters.maxPrice}
          onChange={(e) => onChange({ ...filters, maxPrice: Number(e.target.value) })}
          className="w-full accent-brand-600"
          aria-label="Maximum price"
        />
        <div className="mt-1 flex justify-between text-xs text-gray-400">
          <span>{formatPrice(0)}</span>
          <span>{formatPrice(priceCeiling)}</span>
        </div>
      </fieldset>

      <fieldset>
        <legend className="label">Sort By</legend>
        <select
          value={filters.sort}
          onChange={(e) => onChange({ ...filters, sort: e.target.value as SortOption })}
          className="input"
          aria-label="Sort products"
        >
          {sortOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </fieldset>

      <button
        type="button"
        onClick={() => onChange({ category: "all", sort: "popular", maxPrice: priceCeiling })}
        className="text-sm font-medium text-brand-700 hover:underline"
      >
        Reset Filters
      </button>
    </div>
  );
}
