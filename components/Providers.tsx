"use client";

import { CartProvider } from "@/lib/cart-context";
import { CatalogProvider } from "@/lib/catalog-context";
import { ToastProvider } from "@/lib/toast-context";
import { WishlistProvider } from "@/lib/wishlist-context";
import type { Category, Product } from "@/types";

export default function Providers({
  products,
  categories,
  children,
}: {
  products: Product[];
  categories: Category[];
  children: React.ReactNode;
}) {
  return (
    <CatalogProvider products={products} categories={categories}>
      <ToastProvider>
        <WishlistProvider>
          <CartProvider>{children}</CartProvider>
        </WishlistProvider>
      </ToastProvider>
    </CatalogProvider>
  );
}
