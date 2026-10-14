"use server";

import { headers } from "next/headers";
import { businessConfig } from "@/config/business";
import { createAdminClient } from "@/lib/supabase-admin";
import { sendNewOrderEmail } from "@/lib/order-email";
import type { CheckoutDetails, PlacedOrder } from "@/types";

export interface PlaceOrderInput {
  details: CheckoutDetails;
  items: { productId: number; optionLabel?: string | null; quantity: number }[];
  /** Optional discount voucher code. The database decides whether it is valid and how much it takes off. */
  voucherCode?: string | null;
}

export type PlaceOrderResult =
  | { ok: true; order: PlacedOrder }
  | { ok: false; error: string };

// Voucher codes are letters, digits and dashes only (the same rule the database enforces).
const VOUCHER_RE = /^[A-Za-z0-9-]{4,30}$/;
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
    // option_label names the pack size (empty = the product's base unit). The database
    // looks up its price; nothing sent from the browser is trusted for money.
    .map((i) => ({
      product_id: i.productId,
      option_label: typeof i.optionLabel === "string" ? i.optionLabel.trim().slice(0, 80) : "",
      quantity: i.quantity,
    }));
  if (items.length === 0 || items.length !== input.items.length || items.length > 50) {
    return { ok: false, error: "Your cart looks empty or invalid. Please review it and try again." };
  }
  if (items.some((i) => i.quantity < 1 || i.quantity > 99)) {
    return { ok: false, error: "Item quantities must be between 1 and 99." };
  }

  const voucherCode = text(input.voucherCode, 40);
  if (voucherCode && !VOUCHER_RE.test(voucherCode)) {
    return { ok: false, error: "This voucher code is not valid. Remove it and try again." };
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
    p_voucher_code: voucherCode || null,
  });

  if (error) {
    // Log the error code only: messages for stock errors include a product name, never customer data.
    console.error("[checkout] create_order failed:", error.message);
    const m = error.message;
    if (m.includes("out_of_stock")) {
      return { ok: false, error: "One of the items in your cart is out of stock. Please remove it and try again, or contact us." };
    }
    if (m.includes("rate_limited")) {
      return { ok: false, error: "Too many orders from this phone number in the last hour. Please call us to place another order." };
    }
    if (m.includes("invalid_voucher")) {
      return { ok: false, error: "This voucher code is no longer valid. Remove it and try again, or contact us." };
    }
    if (m.includes("voucher_not_applicable")) {
      return { ok: false, error: "This voucher does not apply to the items in your cart. Remove it and try again." };
    }
    if (m.includes("unknown_product") || m.includes("unknown_option") || m.includes("prescription_required")) {
      return { ok: false, error: "One of the items in your cart is no longer available online. Please refresh your cart and try again." };
    }
    return { ok: false, error: "We couldn't save your order. Please try again, or contact us directly." };
  }

  const o = data as {
    order_number: string;
    subtotal: number;
    discount: number;
    voucher_code: string | null;
    delivery_fee: number;
    total: number;
    items: { name: string; option_label: string | null; quantity: number; unit_price: number; line_total: number }[];
  };

  const placed: PlacedOrder = {
    orderNumber: o.order_number,
    subtotal: Number(o.subtotal),
    discount: Number(o.discount ?? 0),
    voucherCode: o.voucher_code ?? null,
    deliveryFee: Number(o.delivery_fee),
    total: Number(o.total),
    items: o.items.map((i) => ({
      name: i.name,
      optionLabel: i.option_label ?? null,
      quantity: i.quantity,
      unitPrice: Number(i.unit_price),
      lineTotal: Number(i.line_total),
    })),
  };

  // Alert the pharmacy by email. Awaited so the serverless function is not
  // stopped early; it never throws and never blocks the order (see lib/order-email.ts).
  await sendNewOrderEmail(placed, {
    customerName: fullName,
    phone,
    whatsapp,
    email,
    deliveryMethod,
    paymentMethod,
    address,
    city,
    notes,
  });

  return { ok: true, order: placed };
}

export type CheckVoucherResult =
  | { ok: true; code: string; percent: number; discount: number; eligibleSubtotal: number }
  | { ok: false; error: string };

// Best-effort guard against guessing codes: 10 checks per 10 minutes per visitor address.
// It lives in the memory of one server instance, so it slows a script down but is not a hard
// limit. Codes should be hard to guess (the admin page generates ones with a random part).
const VOUCHER_WINDOW_MS = 10 * 60 * 1000;
const VOUCHER_MAX_CHECKS = 10;
const voucherChecks = new Map<string, { count: number; resetAt: number }>();

function tooManyVoucherChecks(key: string): boolean {
  const now = Date.now();
  if (voucherChecks.size > 5000) {
    for (const [k, v] of voucherChecks) if (v.resetAt < now) voucherChecks.delete(k);
  }
  const entry = voucherChecks.get(key);
  if (!entry || entry.resetAt < now) {
    voucherChecks.set(key, { count: 1, resetAt: now + VOUCHER_WINDOW_MS });
    return false;
  }
  entry.count += 1;
  return entry.count > VOUCHER_MAX_CHECKS;
}

/**
 * Shows the customer what a voucher takes off before they place the order. Runs on the
 * server only. The amount comes from the database; placeOrder() works it out again, so
 * what is shown here can never change what is charged.
 */
export async function checkVoucher(input: {
  code: string;
  items: { productId: number; optionLabel?: string | null; quantity: number }[];
}): Promise<CheckVoucherResult> {
  const code = text(input?.code, 40);
  if (!code) return { ok: false, error: "Enter your voucher code." };
  if (!VOUCHER_RE.test(code)) return { ok: false, error: "This voucher code is not valid." };
  if (!Array.isArray(input.items) || input.items.length === 0 || input.items.length > 50) {
    return { ok: false, error: "Your cart looks empty or invalid." };
  }

  const h = headers();
  const visitor = (h.get("x-forwarded-for") ?? "").split(",")[0].trim() || "unknown";
  if (tooManyVoucherChecks(visitor)) {
    return { ok: false, error: "Too many attempts. Please wait a few minutes and try again." };
  }

  const items = input.items
    .filter((i) => Number.isInteger(i?.productId) && i.productId > 0 && Number.isInteger(i?.quantity))
    .map((i) => ({
      product_id: i.productId,
      option_label: typeof i.optionLabel === "string" ? i.optionLabel.trim().slice(0, 80) : "",
      quantity: i.quantity,
    }));
  if (items.length !== input.items.length || items.some((i) => i.quantity < 1 || i.quantity > 99)) {
    return { ok: false, error: "Your cart looks empty or invalid." };
  }

  let admin;
  try {
    admin = createAdminClient();
  } catch (err) {
    console.error("[checkout] admin client unavailable:", err instanceof Error ? err.message : err);
    return { ok: false, error: "Vouchers can't be checked right now. You can still place your order." };
  }

  const { data, error } = await admin.rpc("preview_voucher", { p_code: code, p_items: items });
  if (error) {
    // Log the error text only; it never contains the code or customer data.
    console.error("[checkout] preview_voucher failed:", error.message);
    return { ok: false, error: "We couldn't check the voucher. Please try again." };
  }

  const r = data as {
    valid: boolean;
    reason?: "invalid" | "not_applicable";
    code?: string;
    percent?: number;
    discount?: number;
    eligible_subtotal?: number;
  };
  if (!r.valid) {
    return {
      ok: false,
      error:
        r.reason === "not_applicable"
          ? "This voucher doesn't apply to the items in your cart."
          : "This voucher code is not valid.",
    };
  }
  return {
    ok: true,
    code: String(r.code),
    percent: Number(r.percent),
    discount: Number(r.discount),
    eligibleSubtotal: Number(r.eligible_subtotal),
  };
}
