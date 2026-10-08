import { businessConfig } from "@/config/business";
import { formatPrice, effectivePrice } from "@/lib/utils";
import type { Product, CheckoutDetails, PlacedOrder } from "@/types";

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

/**
 * WhatsApp link for an order that has already been saved. The message is built
 * from the saved order (authoritative prices and totals), and carries the
 * order number so staff can match it to the order in the admin portal.
 */
export function buildWhatsAppSavedOrderUrl(
  order: PlacedOrder,
  customer: Partial<Pick<CheckoutDetails, "fullName" | "phone" | "address">>
): string {
  const productLines = order.items.map((i) => `- ${i.name} x ${i.quantity}`).join("\n");
  const parts = [
    `Hello ${businessConfig.name},`,
    `I just placed order ${order.orderNumber} on your website.`,
    `Products:\n${productLines}`,
    `Subtotal: ${formatPrice(order.subtotal)}`,
    `Delivery: ${order.deliveryFee === 0 ? "Free" : formatPrice(order.deliveryFee)}`,
    `Total: ${formatPrice(order.total)}`,
    `Name: ${customer.fullName || ""}`,
    `Phone: ${customer.phone || ""}`,
  ];
  if (customer.address) parts.push(`Address: ${customer.address}`);
  return `https://wa.me/${businessConfig.whatsappRaw}?text=${encodeURIComponent(parts.join("\n\n"))}`;
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
