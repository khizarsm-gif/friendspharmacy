"use server";

import { businessConfig } from "@/config/business";
import { createAdminClient } from "@/lib/supabase-admin";
import type { CheckoutDetails, PlacedOrder } from "@/types";

export interface PlaceOrderInput {
  details: CheckoutDetails;
  items: { productId: number; quantity: number }[];
}

export type PlaceOrderResult =
  | { ok: true; order: PlacedOrder }
  | { ok: false; error: string };

const PHONE_RE = /^[0-9+()\-\s]{5,30}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function text(value: unknown, max: number): string {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

/**
 * Saves a customer order. Runs on the server only: it validates the input,
 * then calls the create_order() database function with the service role key.
 * Prices, totals and availability are decided inside the database from the
 * product catalog, so nothing the browser sends can change what is charged.
 */
export async function placeOrder(input: PlaceOrderInput): Promise<PlaceOrderResult> {
  const d = input?.details;
  if (!d || !Array.isArray(input.items)) return { ok: false, error: "Something went wrong. Please try again." };

  const fullName = text(d.fullName, 120);
  const phone = text(d.phone, 30);
  const whatsapp = text(d.whatsapp, 30);
  const email = text(d.email, 254);
  const address = text(d.address, 500);
  const city = text(d.city, 100);
  const notes = text(d.notes, 1000);
  const deliveryMethod = d.deliveryMethod === "pickup" ? "pickup" : "delivery";
  const paymentMethod = d.paymentMethod === "pay-at-pharmacy" ? "pay-at-pharmacy" : "cod";

  if (!fullName) return { ok: false, error: "Please enter your full name." };
  if (!PHONE_RE.test(phone)) return { ok: false, error: "Please enter a valid phone number." };
  if (!PHONE_RE.test(whatsapp)) return { ok: false, error: "Please enter a valid WhatsApp number." };
  if (email && !EMAIL_RE.test(email)) return { ok: false, error: "Please enter a valid email address." };
  if (deliveryMethod === "delivery" && (!address || !city)) {
    return { ok: false, error: "Please enter your delivery address and city." };
  }

  const items = input.items
    .filter((i) => Number.isInteger(i?.productId) && i.productId > 0 && Number.isInteger(i?.quantity))
    .map((i) => ({ product_id: i.productId, quantity: i.quantity }));
  if (items.length === 0 || items.length !== input.items.length || items.length > 50) {
    return { ok: false, error: "Your cart looks empty or invalid. Please review it and try again." };
  }
  if (items.some((i) => i.quantity < 1 || i.quantity > 99)) {
    return { ok: false, error: "Item quantities must be between 1 and 99." };
  }

  let admin;
  try {
    admin = createAdminClient();
  } catch (err) {
    // Missing SUPABASE_SERVICE_ROLE_KEY: a setup problem, not something the customer can fix.
    console.error("[checkout] admin client unavailable:", err instanceof Error ? err.message : err);
    return { ok: false, error: `We can't take online orders right now. Please call or WhatsApp us on ${businessConfig.phone}.` };
  }

  const { data, error } = await admin.rpc("create_order", {
    p_customer_name: fullName,
    p_phone: phone,
    p_whatsapp: whatsapp,
    p_email: email,
    p_delivery_method: deliveryMethod,
    p_payment_method: paymentMethod,
    p_address: address,
    p_city: city,
    p_notes: notes,
    p_delivery_fee: businessConfig.deliveryFee,
    p_free_delivery_threshold: businessConfig.freeDeliveryThreshold,
    p_items: items,
  });

  if (error) {
    // Log the error code only: messages for stock errors include a product name, never customer data.
    console.error("[checkout] create_order failed:", error.message);
    const m = error.message;
    if (m.includes("insufficient_stock")) {
      return { ok: false, error: "One or more items don't have enough stock for the quantity in your cart. Please reduce the quantity and try again." };
    }
    if (m.includes("rate_limited")) {
      return { ok: false, error: "Too many orders from this phone number in the last hour. Please call us to place another order." };
    }
    if (m.includes("unknown_product") || m.includes("prescription_required")) {
      return { ok: false, error: "One of the items in your cart is no longer available online. Please refresh your cart and try again." };
    }
    return { ok: false, error: "We couldn't save your order. Please try again, or contact us directly." };
  }

  const o = data as {
    order_number: string;
    subtotal: number;
    delivery_fee: number;
    total: number;
    items: { name: string; quantity: number; unit_price: number; line_total: number }[];
  };

  return {
    ok: true,
    order: {
      orderNumber: o.order_number,
      subtotal: Number(o.subtotal),
      deliveryFee: Number(o.delivery_fee),
      total: Number(o.total),
      items: o.items.map((i) => ({
        name: i.name,
        quantity: i.quantity,
        unitPrice: Number(i.unit_price),
        lineTotal: Number(i.line_total),
      })),
    },
  };
}
