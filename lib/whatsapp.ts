import { businessConfig } from "@/config/business";
import { formatPrice, effectivePrice } from "@/lib/utils";
import type { Product, CheckoutDetails } from "@/types";

export interface WhatsAppOrderLine {
  product: Product;
  quantity: number;
}

/**
 * Builds the wa.me deep link that opens WhatsApp (app or web) with a
 * pre-filled order message addressed to the pharmacy's configured
 * WhatsApp number (config/business.ts -> whatsappRaw).
 *
 * Used both for "Order via WhatsApp" from the cart and for the general
 * "WhatsApp Us" contact buttons (pass an empty `lines` array for the latter).
 */
export function buildWhatsAppOrderUrl(
  lines: WhatsAppOrderLine[],
  deliveryFee: number,
  customer?: Partial<
    Pick<CheckoutDetails, "fullName" | "phone" | "address">
  >
): string {
  const subtotal = lines.reduce(
    (sum, line) =>
      sum + effectivePrice(line.product.price, line.product.salePrice) * line.quantity,
    0
  );
  const total = subtotal + (lines.length > 0 ? deliveryFee : 0);

  const productLines = lines
    .map((line) => `- ${line.product.name} x ${line.quantity}`)
    .join("\n");

  const messageParts = [
    `Hello ${businessConfig.name},`,
    `I would like to place an order.`,
  ];

  if (lines.length > 0) {
    messageParts.push(`Products:\n${productLines}`);
    messageParts.push(`Subtotal: ${formatPrice(subtotal)}`);
    messageParts.push(`Delivery: ${formatPrice(deliveryFee)}`);
    messageParts.push(`Total: ${formatPrice(total)}`);
  }

  messageParts.push(`Name: ${customer?.fullName || ""}`);
  messageParts.push(`Phone: ${customer?.phone || ""}`);
  messageParts.push(`Address: ${customer?.address || ""}`);

  const message = messageParts.join("\n\n");

  return `https://wa.me/${businessConfig.whatsappRaw}?text=${encodeURIComponent(
    message
  )}`;
}

/** Simple WhatsApp link for general contact (no order context). */
export function buildWhatsAppContactUrl(message?: string): string {
  const text =
    message ||
    `Hello ${businessConfig.name}, I have a question about a product.`;
  return `https://wa.me/${businessConfig.whatsappRaw}?text=${encodeURIComponent(
    text
  )}`;
}

export function buildTelUrl(): string {
  return `tel:${businessConfig.phoneRaw}`;
}
