"use client";

import { useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { X, Trash2, ShoppingBag, MessageCircle } from "lucide-react";
import { useCart } from "@/lib/cart-context";
import { formatPrice, effectivePrice } from "@/lib/utils";
import QuantitySelector from "@/components/QuantitySelector";
import { buildWhatsAppOrderUrl } from "@/lib/whatsapp";

export default function CartDrawer() {
  const {
    isDrawerOpen,
    closeDrawer,
    lines,
    itemCount,
    subtotal,
    deliveryFee,
    total,
    updateQuantity,
    removeFromCart,
  } = useCart();

  // Lock body scroll while the drawer is open.
  useEffect(() => {
    if (isDrawerOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isDrawerOpen]);

  // Close on Escape key.
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") closeDrawer();
    }
    if (isDrawerOpen) document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [isDrawerOpen, closeDrawer]);

  if (!isDrawerOpen) return null;

  const whatsappOrderUrl = buildWhatsAppOrderUrl(
    lines.map((l) => ({ product: l.product, quantity: l.quantity })),
    deliveryFee
  );

  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label="Shopping cart">
      <div
        className="absolute inset-0 bg-black/40"
        onClick={closeDrawer}
        aria-hidden="true"
      />
      <div className="absolute right-0 top-0 flex h-full w-full max-w-md flex-col bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
          <h2 className="text-lg font-semibold text-gray-900">
            Your Cart {itemCount > 0 && `(${itemCount})`}
          </h2>
          <button
            onClick={closeDrawer}
            aria-label="Close cart"
            className="rounded-full p-2 hover:bg-gray-100"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          {lines.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
              <ShoppingBag className="h-12 w-12 text-gray-300" aria-hidden="true" />
              <p className="text-sm font-medium text-gray-600">Your cart is empty</p>
              <p className="text-xs text-gray-400">
                Browse our shop and add products to get started.
              </p>
              <Link href="/shop" onClick={closeDrawer} className="btn-primary mt-2">
                Shop Now
              </Link>
            </div>
          ) : (
            <ul className="flex flex-col gap-4">
              {lines.map(({ product, quantity }) => (
                <li key={product.id} className="flex gap-3">
                  <Link
                    href={`/products/${product.slug}`}
                    onClick={closeDrawer}
                    className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-brand-50"
                  >
                    <Image src={product.image} alt={product.name} fill className="object-cover" />
                  </Link>
                  <div className="flex flex-1 flex-col gap-1">
                    <Link
                      href={`/products/${product.slug}`}
                      onClick={closeDrawer}
                      className="line-clamp-2 text-sm font-medium text-gray-900 hover:text-brand-700"
                    >
                      {product.name}
                    </Link>
                    <span className="text-xs text-gray-500">
                      {formatPrice(effectivePrice(product.price, product.salePrice))} each
                    </span>
                    <div className="mt-1 flex items-center justify-between">
                      <QuantitySelector
                        size="sm"
                        quantity={quantity}
                        max={product.stock}
                        onChange={(q) => updateQuantity(product.id, q)}
                      />
                      <span className="text-sm font-semibold text-brand-800">
                        {formatPrice(
                          effectivePrice(product.price, product.salePrice) * quantity
                        )}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => removeFromCart(product.id)}
                    aria-label={`Remove ${product.name} from cart`}
                    className="h-fit shrink-0 rounded-full p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-500"
                  >
                    <Trash2 className="h-4 w-4" aria-hidden="true" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {lines.length > 0 && (
          <div className="border-t border-gray-100 px-5 py-4">
            <div className="flex flex-col gap-1.5 text-sm">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal</span>
                <span>{formatPrice(subtotal)}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Delivery Fee</span>
                <span>{deliveryFee === 0 ? "Free" : formatPrice(deliveryFee)}</span>
              </div>
              <div className="flex justify-between border-t border-gray-100 pt-1.5 text-base font-bold text-gray-900">
                <span>Total</span>
                <span>{formatPrice(total)}</span>
              </div>
            </div>

            <div className="mt-4 flex flex-col gap-2">
              <Link href="/checkout" onClick={closeDrawer} className="btn-primary w-full">
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
              <button onClick={closeDrawer} className="btn-secondary w-full">
                Continue Shopping
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
