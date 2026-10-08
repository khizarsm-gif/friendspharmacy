"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { CheckCircle2, ClipboardCheck, ShoppingBag } from "lucide-react";
import Breadcrumbs from "@/components/Breadcrumbs";
import CheckoutForm from "@/components/CheckoutForm";
import { useCart } from "@/lib/cart-context";
import { formatPrice, effectivePrice } from "@/lib/utils";
import type { CheckoutDetails, DeliveryMethod, PlacedOrder } from "@/types";
import { placeOrder } from "./actions";

export default function CheckoutClient() {
  const { lines, subtotal, deliveryFee: cartDeliveryFee, clearCart, isHydrated } = useCart();
  const [placed, setPlaced] = useState<PlacedOrder | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deliveryMethod, setDeliveryMethod] = useState<DeliveryMethod>("delivery");

  // Pickup orders pay no delivery fee. This mirrors the rule applied in the
  // database (create_order), which is the source of truth for the saved total.
  const deliveryFee = deliveryMethod === "pickup" ? 0 : cartDeliveryFee;
  const total = subtotal + deliveryFee;

  const handleSubmit = async (details: CheckoutDetails) => {
    setSubmitting(true);
    setError(null);
    try {
      const result = await placeOrder({
        details,
        items: lines.map((l) => ({ productId: l.product.id, quantity: l.quantity })),
      });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      // The order is saved and the pharmacy is notified by email on the server.
      setPlaced(result.order);
      clearCart();
    } catch (err) {
      console.error("[checkout] placeOrder threw:", err instanceof Error ? err.message : err);
      setError("We couldn't save your order. Please check your connection and try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (placed) {
    return (
      <div className="container-page py-16">
        <div className="mx-auto flex max-w-lg flex-col items-center gap-4 rounded-2xl border border-brand-100 bg-brand-50 p-10 text-center">
          <CheckCircle2 className="h-14 w-14 text-brand-600" aria-hidden="true" />
          <h1 className="text-2xl font-bold text-gray-900">Order received</h1>
          <p className="text-sm text-gray-600">
            Your order number is{" "}
            <strong className="text-gray-900">{placed.orderNumber}</strong>. Total:{" "}
            <strong className="text-gray-900">{formatPrice(placed.total)}</strong>. Please keep
            this number for reference.
          </p>
          <p className="text-sm text-gray-600">
            Your order has been sent to our pharmacy team. We will contact you shortly to confirm
            availability and {deliveryMethod === "pickup" ? "pickup" : "delivery"}.
          </p>
          <Link href="/shop" className="btn-secondary">
            Continue Shopping
          </Link>
        </div>
      </div>
    );
  }

  if (isHydrated && lines.length === 0) {
    return (
      <div className="container-page py-16">
        <Breadcrumbs items={[{ label: "Checkout" }]} />
        <div className="flex flex-col items-center justify-center gap-4 rounded-2xl border border-dashed border-gray-300 bg-gray-50 py-20 text-center">
          <ShoppingBag className="h-12 w-12 text-gray-300" aria-hidden="true" />
          <h1 className="text-xl font-semibold text-gray-800">
            Your cart is empty
          </h1>
          <p className="max-w-sm text-sm text-gray-500">
            Add a few products to your cart before checking out.
          </p>
          <Link href="/shop" className="btn-primary">
            Browse Products
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container-page py-10">
      <Breadcrumbs items={[{ label: "Checkout" }]} />
      <h1 className="mb-6 text-2xl font-bold text-gray-900 sm:text-3xl">Checkout</h1>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_380px]">
        <div className="card p-5 sm:p-6">
          <CheckoutForm
            onSubmit={handleSubmit}
            submitLabel="Place Order"
            submitting={submitting}
            serverError={error}
            onDeliveryMethodChange={setDeliveryMethod}
          />
        </div>

        <div className="card h-fit p-5">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">Order Summary</h2>
          <ul className="mb-4 flex flex-col gap-3">
            {lines.map(({ product, quantity }) => (
              <li key={product.id} className="flex gap-3">
                <span className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-brand-50">
                  <Image src={product.image} alt={product.name} fill className="object-cover" />
                </span>
                <span className="flex-1">
                  <span className="block line-clamp-1 text-sm font-medium text-gray-900">
                    {product.name}
                  </span>
                  <span className="block text-xs text-gray-500">Qty: {quantity}</span>
                </span>
                <span className="shrink-0 text-sm font-semibold text-gray-900">
                  {formatPrice(effectivePrice(product.price, product.salePrice) * quantity)}
                </span>
              </li>
            ))}
          </ul>

          <div className="flex flex-col gap-2 border-t border-gray-100 pt-3 text-sm">
            <div className="flex justify-between text-gray-600">
              <span>Subtotal</span>
              <span>{formatPrice(subtotal)}</span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>Delivery Fee</span>
              <span>{deliveryFee === 0 ? "Free" : formatPrice(deliveryFee)}</span>
            </div>
            <div className="flex justify-between border-t border-gray-100 pt-2 text-base font-bold text-gray-900">
              <span>Total</span>
              <span>{formatPrice(total)}</span>
            </div>
          </div>

          <p className="mt-4 flex items-start gap-2 text-xs text-gray-400">
            <ClipboardCheck className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" aria-hidden="true" />
            Your order is sent straight to our team, who will contact you to confirm it.
          </p>
        </div>
      </div>
    </div>
  );
}
