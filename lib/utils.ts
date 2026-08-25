import { businessConfig } from "@/config/business";

/**
 * Formats a numeric amount as a PKR currency string, e.g. formatPrice(1250)
 * => "PKR 1,250"
 */
export function formatPrice(amount: number): string {
  const formatted = new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 0,
  }).format(Math.round(amount));
  return `${businessConfig.currencySymbol} ${formatted}`;
}

/** Returns true if a product currently has a valid sale price. */
export function isOnSale(price: number, salePrice?: number): boolean {
  return typeof salePrice === "number" && salePrice > 0 && salePrice < price;
}

/** Returns the effective (sale-aware) price to charge for a product. */
export function effectivePrice(price: number, salePrice?: number): number {
  return isOnSale(price, salePrice) ? (salePrice as number) : price;
}

export function calculateDiscountPercent(
  price: number,
  salePrice?: number
): number | null {
  if (!isOnSale(price, salePrice)) return null;
  return Math.round((1 - (salePrice as number) / price) * 100);
}

/** Simple slugify helper, kept for when products are added programmatically. */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export function classNames(
  ...classes: Array<string | false | null | undefined>
): string {
  return classes.filter(Boolean).join(" ");
}
