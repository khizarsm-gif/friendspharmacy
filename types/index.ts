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

export type OrderStatus =
  | "new"
  | "confirmed"
  | "out_for_delivery"
  | "ready_for_pickup"
  | "completed"
  | "cancelled";

export interface OrderItem {
  id: number;
  productId: number | null;
  productName: string;
  sku: string | null;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
}

export interface OrderStatusHistoryEntry {
  id: number;
  fromStatus: OrderStatus | null;
  toStatus: OrderStatus;
  note: string | null;
  createdAt: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  customerName: string;
  phone: string;
  whatsapp: string;
  email: string | null;
  deliveryMethod: DeliveryMethod;
  paymentMethod: PaymentMethod;
  address: string | null;
  city: string | null;
  notes: string | null;
  internalNotes: string | null;
  subtotal: number;
  deliveryFee: number;
  total: number;
  createdAt: string;
  updatedAt: string;
}

/** What the checkout server action returns after an order is saved. */
export interface PlacedOrder {
  orderNumber: string;
  subtotal: number;
  deliveryFee: number;
  total: number;
  items: { name: string; quantity: number; unitPrice: number; lineTotal: number }[];
}
