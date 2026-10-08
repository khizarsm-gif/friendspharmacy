import { businessConfig } from "@/config/business";
import { formatPrice } from "@/lib/utils";
import type { PlacedOrder } from "@/types";

/**
 * Staff notification email for a newly saved order. Server-only.
 *
 * Configured with environment variables (set them in Vercel, never in code):
 *   RESEND_API_KEY      API key from resend.com (send-only)
 *   ORDER_NOTIFY_EMAIL  where new-order alerts go (comma-separated for several)
 *   ORDER_FROM_EMAIL    optional sender, e.g. "Friends Pharmacy <orders@yourdomain.com>".
 *                       Defaults to Resend's shared test sender.
 *
 * If the variables are missing, or the email provider is down, this logs and
 * returns. The order is already saved, so a failed email never fails checkout.
 */

export interface OrderEmailDetails {
  customerName: string;
  phone: string;
  whatsapp: string;
  email: string;
  deliveryMethod: "delivery" | "pickup";
  paymentMethod: "cod" | "pay-at-pharmacy";
  address: string;
  city: string;
  notes: string;
}

function esc(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function row(label: string, value: string): string {
  return `<tr><td style="padding:4px 12px 4px 0;color:#555">${esc(label)}</td><td style="padding:4px 0"><strong>${esc(value) || "-"}</strong></td></tr>`;
}

export async function sendNewOrderEmail(order: PlacedOrder, d: OrderEmailDetails): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  const to = (process.env.ORDER_NOTIFY_EMAIL ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  if (!apiKey || to.length === 0) {
    console.warn("[order-email] not configured (RESEND_API_KEY / ORDER_NOTIFY_EMAIL); skipping");
    return;
  }

  const from = process.env.ORDER_FROM_EMAIL || `${businessConfig.name} Orders <onboarding@resend.dev>`;
  const host = process.env.VERCEL_PROJECT_PRODUCTION_URL;
  const adminUrl = host ? `https://${host}/admin/orders` : null;

  const itemsHtml = order.items
    .map(
      (i) =>
        `<tr><td style="padding:4px 12px 4px 0">${esc(i.name)}</td><td style="padding:4px 12px">x ${i.quantity}</td><td style="padding:4px 0;text-align:right">${esc(formatPrice(i.lineTotal))}</td></tr>`
    )
    .join("");

  const html = `<div style="font-family:Arial,sans-serif;font-size:14px;color:#111">
<h2 style="margin:0 0 8px">New order ${esc(order.orderNumber)}</h2>
<p style="margin:0 0 12px">${d.deliveryMethod === "pickup" ? "Store pickup" : "Home delivery"} &middot; ${d.paymentMethod === "cod" ? "Cash on delivery" : "Pay at pharmacy"}</p>
<table style="border-collapse:collapse">${itemsHtml}</table>
<p style="margin:12px 0 16px">Subtotal ${esc(formatPrice(order.subtotal))} &middot; Delivery ${order.deliveryFee === 0 ? "Free" : esc(formatPrice(order.deliveryFee))} &middot; <strong>Total ${esc(formatPrice(order.total))}</strong></p>
<table style="border-collapse:collapse">
${row("Customer", d.customerName)}${row("Phone", d.phone)}${row("WhatsApp", d.whatsapp)}${row("Email", d.email)}
${d.deliveryMethod === "delivery" ? row("Address", d.address) + row("City", d.city) : ""}${row("Notes", d.notes)}
</table>
${adminUrl ? `<p style="margin:16px 0 0"><a href="${esc(adminUrl)}">Open in the admin portal</a></p>` : ""}
</div>`;

  const text = [
    `New order ${order.orderNumber} (${d.deliveryMethod}, ${d.paymentMethod})`,
    ...order.items.map((i) => `- ${i.name} x ${i.quantity}  ${formatPrice(i.lineTotal)}`),
    `Total: ${formatPrice(order.total)}`,
    `Customer: ${d.customerName}`,
    `Phone: ${d.phone}  WhatsApp: ${d.whatsapp}`,
    d.deliveryMethod === "delivery" ? `Address: ${d.address}, ${d.city}` : "",
    d.notes ? `Notes: ${d.notes}` : "",
    adminUrl ? `Admin: ${adminUrl}` : "",
  ]
    .filter(Boolean)
    .join("\n");

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from, to, subject: `New order ${order.orderNumber} (${formatPrice(order.total)})`, html, text }),
      // Never let a slow email provider hold up the customer's confirmation screen.
      signal: AbortSignal.timeout(6000),
    });
    if (!res.ok) {
      // Log status only; the response body can echo recipient addresses.
      console.error("[order-email] provider rejected the email, status", res.status);
    }
  } catch (err) {
    console.error("[order-email] send failed:", err instanceof Error ? err.message : err);
  }
}
