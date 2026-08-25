"use client";

import Image from "next/image";
import Link from "next/link";
import { Trash2, ShoppingBag, MessageCircle } from "lucide-react";
import Breadcrumbs from "@/components/Breadcrumbs";
import QuantitySelector from "@/components/QuantitySelector";
import { useCart } from "@/lib/cart-context";
import { formatPrice, effectivePrice } from "@/lib/utils";
import { buildWhatsAppOrderUrl } from "@/lib/whatsapp";
import { businessConfig } from "@/config/business";

export default function CartClient() {
  const {
    lines,
    subtotal,
    deliveryFee,
    total,
    updateQuantity,
    removeFromCart,
    isHydrated,
  } = useCart();

  const whatsappOrderUrl = buildWhatsAppOrderUrl(
    lines.map((l) => ({ product: l.product, quantity: l.quantity })),
    deliveryFee
  );

  if (isHydrated && lines.length === 0) {
    return (
      <div className="container-page py-16">
        <Breadcrumbs items={[{ label: "Cart" }]} />
        <div className="flex flex-col items-center justify-center gap-4 rounded-2xl border border-dashed border-gray-300 bg-gray-50 py-20 text-center">
          <ShoppingBag className="h-12 w-12 text-gray-300" aria-hidden="true" />
          <h1 className="text-xl font-semibold text-gray-800">Your cart is empty</h1>
          <p className="max-w-sm text-sm text-gray-500">
            Looks like you haven&apos;t added anything yet. Browse our shop to
            find medicines, vitamins, and healthcare essentials.
          </p>
          <Link href="/shop" className="btn-primary">
            Start Shopping
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container-page py-10">
      <Breadcrumbs items={[{ label: "Cart" }]} />
      <h1 className="mb-6 text-2xl font-bold text-gray-900 sm:text-3xl">
        Shopping Cart
      </h1>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_360px]">
        <div className="card divide-y divide-gray-100">
          {lines.map(({ product, quantity }) => (
            <div key={product.id} className="flex gap-4 p-4 sm:p-5">
              <Link
                href={`/products/${product.slug}`}
                className="relative h-24 w-24 shrink-0 overflow-hidden rounded-xl bg-brand-50 sm:h-28 sm:w-28"
              >
                <Image src={product.image} alt={product.name} fill className="object-cover" />
              </Link>

              <div className="flex flex-1 flex-col justify-between gap-2">
                <div>
                  <Link
                    href={`/products/${product.slug}`}
                    className="font-medium text-gray-900 hover:text-brand-700"
                  >
                    {product.name}
                  </Link>
                  <p className="text-sm text-gray-500">{product.brand}</p>
                  <p className="text-sm font-semibold text-brand-800">
                    {formatPrice(effectivePrice(product.price, product.salePrice))}
                  </p>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3">
                  <QuantitySelector
                    quantity={quantity}
                    max={product.stock}
                    onChange={(q) => updateQuantity(product.id, q)}
                  />
                  <div className="flex items-center gap-4">
                    <span className="font-semibold text-gray-900">
                      {formatPrice(
                        effectivePrice(product.price, product.salePrice) * quantity
                      )}
                    </span>
                    <button
                      onClick={() => removeFromCart(product.id)}
                      aria-label={`Remove ${product.name} from cart`}
                      className="flex items-center gap-1 text-sm text-red-500 hover:underline"
                    >
                      <Trash2 className="h-4 w-4" aria-hidden="true" />
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="card h-fit p-5">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">Order Summary</h2>
          <div className="flex flex-col gap-2 text-sm">
            <div className="flex justify-between text-gray-600">
              <span>Subtotal</span>
              <span>{formatPrice(subtotal)}</span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>Delivery Fee</span>
              <span>{deliveryFee === 0 ? "Free" : formatPrice(deliveryFee)}</span>
            </div>
            {subtotal < businessConfig.freeDeliveryThreshold && (
              <p className="text-xs text-brand-600">
                Add {formatPrice(businessConfig.freeDeliveryThreshold - subtotal)} more
                for free delivery.
              </p>
            )}
            <div className="flex justify-between border-t border-gray-100 pt-2 text-base font-bold text-gray-900">
              <span>Total</span>
              <span>{formatPrice(total)}</span>
            </div>
          </div>

          <div className="mt-5 flex flex-col gap-2">
            <Link href="/checkout" className="btn-primary w-full">
              Proceed to Checkout
            </Link>
            <a
              href={whatsappOrderUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-whatsapp w-full"
            >
              <MessageCircle className="h-4 w-4" aria-hidden="true" />
              Order via WhatsApp
            </a>
            <Link href="/shop" className="btn-secondary w-full">
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
