"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Search, X } from "lucide-react";
import { searchProducts } from "@/data/products";
import { formatPrice } from "@/lib/utils";
import { classNames } from "@/lib/utils";

interface SearchBarProps {
  className?: string;
  autoFocus?: boolean;
  onNavigate?: () => void;
}

/**
 * Global product search input. Matches on product name, brand, and category
 * (see data/products.ts -> searchProducts). Shows a live dropdown of up to 5
 * matches and submits to /shop?q=... for the full results page.
 */
export default function SearchBar({ className, autoFocus, onNavigate }: SearchBarProps) {
  const [query, setQuery] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);

  const results = query.trim().length > 0 ? searchProducts(query).slice(0, 5) : [];
  const showDropdown = isFocused && query.trim().length > 0;

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsFocused(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const submitSearch = () => {
    if (!query.trim()) return;
    router.push(`/shop?q=${encodeURIComponent(query.trim())}`);
    setIsFocused(false);
    onNavigate?.();
  };

  return (
    <div ref={containerRef} className={classNames("relative w-full", className)}>
      <form
        role="search"
        onSubmit={(e) => {
          e.preventDefault();
          submitSearch();
        }}
        className="relative"
      >
        <Search
          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
          aria-hidden="true"
        />
        <label htmlFor="product-search" className="sr-only">
          Search products
        </label>
        <input
          id="product-search"
          type="search"
          value={query}
          autoFocus={autoFocus}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setIsFocused(true)}
          placeholder="Search medicines, brands, categories…"
          className="input pl-9 pr-9"
        />
        {query && (
          <button
            type="button"
            onClick={() => setQuery("")}
            aria-label="Clear search"
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        )}
      </form>

      {showDropdown && (
        <div className="absolute z-30 mt-2 w-full overflow-hidden rounded-xl bg-white shadow-card-hover ring-1 ring-black/5">
          {results.length > 0 ? (
            <ul>
              {results.map((product) => (
                <li key={product.id}>
                  <Link
                    href={`/products/${product.slug}`}
                    onClick={() => {
                      setIsFocused(false);
                      setQuery("");
                      onNavigate?.();
                    }}
                    className="flex items-center gap-3 px-3 py-2 hover:bg-brand-50"
                  >
                    <span className="relative h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-brand-50">
                      <Image src={product.image} alt="" fill className="object-cover" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium text-gray-900">
                        {product.name}
                      </span>
                      <span className="block text-xs text-gray-500">{product.brand}</span>
                    </span>
                    <span className="shrink-0 text-sm font-semibold text-brand-700">
                      {formatPrice(product.salePrice ?? product.price)}
                    </span>
                  </Link>
                </li>
              ))}
              <li>
                <button
                  type="button"
                  onClick={submitSearch}
                  className="block w-full px-3 py-2.5 text-center text-sm font-semibold text-brand-700 hover:bg-brand-50"
                >
                  See all results for &ldquo;{query}&rdquo;
                </button>
              </li>
            </ul>
          ) : (
            <p className="px-3 py-4 text-center text-sm text-gray-500">
              No products match &ldquo;{query}&rdquo;
            </p>
          )}
        </div>
      )}
    </div>
  );
}
