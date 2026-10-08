import type { DeliveryMethod, OrderStatus } from "@/types";

/** Shared order status metadata (labels, badge colors, allowed values). */
export const ORDER_STATUSES: OrderStatus[] = [
  "new",
  "confirmed",
  "out_for_delivery",
  "ready_for_pickup",
  "completed",
  "cancelled",
];

export const STATUS_LABELS: Record<OrderStatus, string> = {
  new: "New",
  confirmed: "Confirmed",
  out_for_delivery: "Out for delivery",
  ready_for_pickup: "Ready for pickup",
  completed: "Completed",
  cancelled: "Cancelled",
};

// Full class strings (not built dynamically) so Tailwind keeps them.
export const STATUS_TONES: Record<OrderStatus, string> = {
  new: "bg-amber-50 text-amber-700",
  confirmed: "bg-accent-50 text-accent-700",
  out_for_delivery: "bg-accent-50 text-accent-700",
  ready_for_pickup: "bg-accent-50 text-accent-700",
  completed: "bg-brand-50 text-brand-700",
  cancelled: "bg-gray-100 text-gray-600",
};

export function isOrderStatus(value: unknown): value is OrderStatus {
  return typeof value === "string" && (ORDER_STATUSES as string[]).includes(value);
}

/** Statuses a staff member can move an order to, given how it is fulfilled. */
export function selectableStatuses(deliveryMethod: DeliveryMethod): OrderStatus[] {
  return ORDER_STATUSES.filter((s) =>
    deliveryMethod === "delivery" ? s !== "ready_for_pickup" : s !== "out_for_delivery"
  );
}

export const DELIVERY_LABELS: Record<DeliveryMethod, string> = {
  delivery: "Home delivery",
  pickup: "Pharmacy pickup",
};

export const PAYMENT_LABELS: Record<string, string> = {
  cod: "Cash on delivery",
  "pay-at-pharmacy": "Pay at pharmacy",
};

/** Formats a timestamp in the pharmacy's local time (Lahore). */
export function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString("en-GB", {
    timeZone: "Asia/Karachi",
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

/**
 * Best-effort conversion of a customer-entered number to the digits wa.me
 * expects. Pakistani local numbers (03xx...) get the 92 country code.
 */
export function whatsappDigits(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  if (digits.startsWith("00")) return digits.slice(2);
  if (digits.startsWith("0")) return `92${digits.slice(1)}`;
  return digits;
}
