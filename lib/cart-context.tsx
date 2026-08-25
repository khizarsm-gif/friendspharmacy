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
import { getProductBySlug, products } from "@/data/products";
import { effectivePrice } from "@/lib/utils";
import type { CartItem, Product } from "@/types";

const STORAGE_KEY = "friends-pharmacy-cart";

export interface CartLine {
  product: Product;
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
  addToCart: (product: Product, quantity?: number) => void;
  updateQuantity: (productId: number, quantity: number) => void;
  removeFromCart: (productId: number) => void;
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
    return parsed.filter(
      (item): item is CartItem =>
        typeof item?.productId === "number" && typeof item?.quantity === "number"
    );
  } catch {
    return [];
  }
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);

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

  const addToCart = useCallback((product: Product, quantity = 1) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.productId === product.id);
      if (existing) {
        return prev.map((i) =>
          i.productId === product.id
            ? { ...i, quantity: Math.min(i.quantity + quantity, product.stock) }
            : i
        );
      }
      return [...prev, { productId: product.id, quantity: Math.min(quantity, product.stock) }];
    });
    setIsDrawerOpen(true);
  }, []);

  const updateQuantity = useCallback((productId: number, quantity: number) => {
    setItems((prev) => {
      if (quantity <= 0) return prev.filter((i) => i.productId !== productId);
      return prev.map((i) => (i.productId === productId ? { ...i, quantity } : i));
    });
  }, []);

  const removeFromCart = useCallback((productId: number) => {
    setItems((prev) => prev.filter((i) => i.productId !== productId));
  }, []);

  const clearCart = useCallback(() => setItems([]), []);

  const lines: CartLine[] = useMemo(
    () =>
      items
        .map((item) => {
          const product =
            products.find((p) => p.id === item.productId) ||
            getProductBySlug(String(item.productId));
          return product ? { product, quantity: item.quantity } : null;
        })
        .filter((line): line is CartLine => Boolean(line)),
    [items]
  );

  const itemCount = useMemo(
    () => lines.reduce((sum, l) => sum + l.quantity, 0),
    [lines]
  );

  const subtotal = useMemo(
    () =>
      lines.reduce(
        (sum, l) => sum + effectivePrice(l.product.price, l.product.salePrice) * l.quantity,
        0
      ),
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
