import { effectivePrice } from "@/lib/utils";
import type { Product } from "@/types";

/** One thing a customer can pick on a product: the base unit or a pack size. */
export interface SellableOption {
  /** null = the product's base unit (what the cart and database store as "no option"). */
  label: string | null;
  /** Text shown to the customer. */
  displayLabel: string;
  /** Price per one of this option, sale-aware for the base unit. */
  price: number;
  /** Struck-through price when the base unit is on sale. */
  compareAt?: number;
}

export function hasPackOptions(product: Product): boolean {
  return product.packOptions.length > 0;
}

/** Base unit first, then the extra pack sizes in the order staff entered them. */
export function sellableOptions(product: Product): SellableOption[] {
  const baseOnSale = effectivePrice(product.price, product.salePrice) < product.price;
  const base: SellableOption = {
    label: null,
    displayLabel: product.unitLabel || "Single unit",
    price: effectivePrice(product.price, product.salePrice),
    compareAt: baseOnSale ? product.price : undefined,
  };
  return [base, ...product.packOptions.map((o) => ({ label: o.label, displayLabel: o.label, price: o.price }))];
}

/** Finds the option for a cart label. Returns undefined if staff have since removed it. */
export function findOption(product: Product, label: string | null | undefined): SellableOption | undefined {
  const wanted = label ?? null;
  return sellableOptions(product).find((o) => o.label === wanted);
}

/** Stable identity of a cart line (same product, different pack size = different line). */
export function lineKey(productId: number, optionLabel: string | null | undefined): string {
  return `${productId}::${optionLabel ?? ""}`;
}
