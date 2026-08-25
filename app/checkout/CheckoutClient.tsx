"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { CheckCircle2, MessageCircle, ShoppingBag } from "lucide-react";
import Breadcrumbs from "@/components/Breadcrumbs";
import CheckoutForm from "@/components/CheckoutForm";
import { useCart } from "@/lib/cart-context";
import { formatPrice, effectivePrice } from "@/lib/utils";
import { buildWhatsAppOrderUrl } from "@/lib/whatsapp";
import type { CheckoutDetails } from "@/types";

export default function CheckoutClient() {
  const { lines, subtotal, deliveryFee, total, clearCart, isHydrated } = useCart();
  const [orderPlaced, setOrderPlaced] = useState(false);

  const handleSubmit = (details: CheckoutDetails) => {
    const whatsappUrl = buildWhatsAppOrderUrl(
      lines.map((l) => ({ product: l.product, quantity: l.quantity })),
      deliveryFee,
      { fullName: details.fullName, phone: details.phone, address: details.address }
    );

    // NOTE: This MVP has no backend/database yet, so "placing an order" means
    // opening a pre-filled WhatsApp message to the pharmacy's configured
    // number (config/business.ts) with the full order + customer details.
    // When a real backend is added, this is the place to POST the order to
    // an /api/orders route instead (see README "What to add in Phase 2").
    window.open(whatsappUrl, "_blank", "noopener,noreferrer");
    setOrderPlaced(true);
    clearCart();
  };

  if (orderPlaced) {
    return (
      <div className="container-page py-16">
        <div className="mx-auto flex max-w-lg flex-col items-center gap-4 rounded-2xl border border-brand-100 bg-brand-50 p-10 text-center">
          <CheckCircle2 className="h-14 w-14 text-brand-600" aria-hidden="true" />
          <h1 className="text-2xl font-bold text-gray-900">Order Sent!</h1>
          <p className="text-sm text-gray-600">
            We&apos;ve opened WhatsApp with your order details. Please send
            the message to confirm your order with our pharmacy team — we&apos;ll
            follow up shortly to confirm availability and delivery.
          </p>
          <Link href="/shop" className="btn-primary">
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
          <CheckoutForm onSubmit={handleSubmit} submitLabel="Place Order via WhatsApp" />
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
            <MessageCircle className="mt-0.5 h-4 w-4 shrink-0 text-[#25D366]" aria-hidden="true" />
            Placing your order opens WhatsApp with your order pre-filled, so
            our team can confirm it with you directly.
          </p>
        </div>
      </div>
    </div>
  );
}
