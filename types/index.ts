/**
 * Shared TypeScript types for the Friends Pharmacy storefront.
 *
 * These shapes are intentionally simple and map cleanly onto future
 * PostgreSQL/Supabase tables (see /data/products.ts header comment for the
 * suggested schema). Keeping types centralized here means the eventual
 * swap from static data to a real database only touches the data-access
 * layer, not every component that consumes a Product.
 */

export interface Product {
  id: number;
  name: string;
  slug: string;
  brand: string;
  category: CategorySlug;
  description: string;
  keyInfo?: string[];
  price: number;
  /** Present only when the product is on sale. Must be lower than `price`. */
  salePrice?: number;
  image: string;
  stock: number;
  sku: string;
  featured: boolean;
  prescriptionRequired: boolean;
  /** ISO date string — used for "Newest" sort. */
  createdAt: string;
  /** All demo/seed products are flagged so they're easy to find & replace. */
  isDemo: boolean;
}

/**
 * Category slugs are managed in the admin portal (Supabase `categories`
 * table), so they are plain strings rather than a fixed union.
 */
export type CategorySlug = string;

export interface Category {
  slug: CategorySlug;
  name: string;
  icon: string; // icon key from lib/category-icons.tsx
  description: string;
  sortOrder: number;
}

export interface CartItem {
  productId: number;
  quantity: number;
}

export type DeliveryMethod = "delivery" | "pickup";
export type PaymentMethod = "cod" | "pay-at-pharmacy";

export interface CheckoutDetails {
  fullName: string;
  phone: string;
  whatsapp: string;
  email?: string;
  address: string;
  city: string;
  notes?: string;
  deliveryMethod: DeliveryMethod;
  paymentMethod: PaymentMethod;
}

export type SortOption = "popular" | "price-asc" | "price-desc" | "newest";
