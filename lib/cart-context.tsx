"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { businessConfig } from "@/config/business";
import { useCatalog } from "@/lib/catalog-context";
import { findOption, lineKey } from "@/lib/pack-options";
import type { CartItem, Product } from "@/types";

const STORAGE_KEY = "friends-pharmacy-cart";

export interface CartLine {
  /** Identifies the line: same product in a different pack size is a different line. */
  key: string;
  product: Product;
  /** Pack size label, or null for the product's base unit. */
  optionLabel: string | null;
  /** Name of the chosen size to show next to the product (null for a plain product). */
  optionDisplay: string | null;
  unitPrice: number;
  quantity: number;
}

interface CartContextValue {
  items: CartItem[];
  lines: CartLine[];
  itemCount: number;
  subtotal: number;
  deliveryFee: number;
  total: number;
  isDrawerOpen: boolean;
  openDrawer: () => void;
  closeDrawer: () => void;
  addToCart: (product: Product, quantity?: number, optionLabel?: string | null) => void;
  updateQuantity: (key: string, quantity: number) => void;
  removeFromCart: (key: string) => void;
  clearCart: () => void;
  isHydrated: boolean;
}

const CartContext = createContext<CartContextValue | undefined>(undefined);

function readCartFromStorage(): CartItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter(
        (item): item is CartItem =>
          typeof item?.productId === "number" && typeof item?.quantity === "number"
      )
      .map((item) => ({
        productId: item.productId,
        optionLabel: typeof item.optionLabel === "string" && item.optionLabel ? item.optionLabel : null,
        quantity: item.quantity,
      }));
  } catch {
    return [];
  }
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);
  const { getProductById } = useCatalog();

  // Load persisted cart on mount (client-only — localStorage isn't available
  // during server rendering).
  useEffect(() => {
    setItems(readCartFromStorage());
    setIsHydrated(true);
  }, []);

  // Persist on every change, once hydrated.
  useEffect(() => {
    if (!isHydrated) return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items, isHydrated]);

  // Quantities are capped at 99 per line (the checkout limit). Stock is not
  // tracked per order, so there is no stock-based cap.
  const addToCart = useCallback((product: Product, quantity = 1, optionLabel: string | null = null) => {
    const key = lineKey(product.id, optionLabel);
    setItems((prev) => {
      const existing = prev.find((i) => lineKey(i.productId, i.optionLabel) === key);
      if (existing) {
        return prev.map((i) =>
          lineKey(i.productId, i.optionLabel) === key
            ? { ...i, quantity: Math.min(i.quantity + quantity, 99) }
            : i
        );
      }
      return [...prev, { productId: product.id, optionLabel, quantity: Math.min(quantity, 99) }];
    });
    setIsDrawerOpen(true);
  }, []);

  const updateQuantity = useCallback((key: string, quantity: number) => {
    setItems((prev) => {
      if (quantity <= 0) return prev.filter((i) => lineKey(i.productId, i.optionLabel) !== key);
      return prev.map((i) =>
        lineKey(i.productId, i.optionLabel) === key ? { ...i, quantity: Math.min(quantity, 99) } : i
      );
    });
  }, []);

  const removeFromCart = useCallback((key: string) => {
    setItems((prev) => prev.filter((i) => lineKey(i.productId, i.optionLabel) !== key));
  }, []);

  const clearCart = useCallback(() => setItems([]), []);

  const lines: CartLine[] = useMemo(
    () =>
      items
        .map((item) => {
          // Items whose product was deleted in the admin are dropped here, and so are
          // lines whose pack size staff have since removed from the product.
          const product = getProductById(item.productId);
          if (!product) return null;
          const option = findOption(product, item.optionLabel);
          if (!option) return null;
          return {
            key: lineKey(product.id, item.optionLabel),
            product,
            optionLabel: option.label,
            optionDisplay: product.packOptions.length > 0 ? option.displayLabel : null,
            unitPrice: option.price,
            quantity: item.quantity,
          };
        })
        .filter((line): line is CartLine => Boolean(line)),
    [items, getProductById]
  );

  const itemCount = useMemo(
    () => lines.reduce((sum, l) => sum + l.quantity, 0),
    [lines]
  );

  const subtotal = useMemo(
    () =>
      lines.reduce((sum, l) => sum + l.unitPrice * l.quantity, 0),
    [lines]
  );

  const deliveryFee = useMemo(() => {
    if (lines.length === 0) return 0;
    return subtotal >= businessConfig.freeDeliveryThreshold
      ? 0
      : businessConfig.deliveryFee;
  }, [subtotal, lines.length]);

  const total = subtotal + deliveryFee;

  const value: CartContextValue = {
    items,
    lines,
    itemCount,
    subtotal,
    deliveryFee,
    total,
    isDrawerOpen,
    openDrawer: () => setIsDrawerOpen(true),
    closeDrawer: () => setIsDrawerOpen(false),
    addToCart,
    updateQuantity,
    removeFromCart,
    clearCart,
    isHydrated,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within a CartProvider");
  return ctx;
}
