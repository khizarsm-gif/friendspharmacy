"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { CheckCircle2, ClipboardCheck, Loader2, ShoppingBag, Tag, X } from "lucide-react";
import Breadcrumbs from "@/components/Breadcrumbs";
import CheckoutForm from "@/components/CheckoutForm";
import { businessConfig } from "@/config/business";
import { useCart } from "@/lib/cart-context";
import { formatPrice } from "@/lib/utils";
import type { CheckoutDetails, DeliveryMethod, PlacedOrder } from "@/types";
import { checkVoucher, placeOrder } from "./actions";

interface AppliedVoucher {
  code: string;
  percent: number;
  discount: number;
}

export default function CheckoutClient() {
  const { lines, subtotal, clearCart, isHydrated } = useCart();
  const [placed, setPlaced] = useState<PlacedOrder | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deliveryMethod, setDeliveryMethod] = useState<DeliveryMethod>("delivery");

  // Voucher: the customer types a code and presses Apply. The server (database) works out
  // the discount; the amount below is only for display and is recalculated when the order is placed.
  const [voucherInput, setVoucherInput] = useState("");
  const [voucher, setVoucher] = useState<AppliedVoucher | null>(null);
  const [voucherError, setVoucherError] = useState<string | null>(null);
  const [checkingVoucher, setCheckingVoucher] = useState(false);

  const cartItems = useMemo(
    () => lines.map((l) => ({ productId: l.product.id, optionLabel: l.optionLabel, quantity: l.quantity })),
    [lines]
  );
  // Changes whenever the cart changes, so an applied voucher can be re-checked.
  const cartSignature = useMemo(
    () => cartItems.map((i) => `${i.productId}:${i.optionLabel ?? ""}:${i.quantity}`).join("|"),
    [cartItems]
  );

  const applyVoucher = async () => {
    setCheckingVoucher(true);
    setVoucherError(null);
    try {
      const result = await checkVoucher({ code: voucherInput, items: cartItems });
      if (!result.ok) {
        setVoucher(null);
        setVoucherError(result.error);
        return;
      }
      setVoucher({ code: result.code, percent: result.percent, discount: result.discount });
      setVoucherInput("");
    } catch (err) {
      console.error("[checkout] checkVoucher threw:", err instanceof Error ? err.message : err);
      setVoucherError("We couldn't check the voucher. Please try again.");
    } finally {
      setCheckingVoucher(false);
    }
  };

  const removeVoucher = () => {
    setVoucher(null);
    setVoucherError(null);
  };

  // If the cart changes while a voucher is applied, re-check it so the discount shown stays right.
  const appliedCode = voucher?.code;
  useEffect(() => {
    if (!appliedCode || cartItems.length === 0) return;
    let cancelled = false;
    checkVoucher({ code: appliedCode, items: cartItems })
      .then((result) => {
        if (cancelled) return;
        if (result.ok) setVoucher({ code: result.code, percent: result.percent, discount: result.discount });
        else {
          setVoucher(null);
          setVoucherError(result.error);
        }
      })
      .catch(() => {
        // Keep what is shown; the database still decides the real discount when the order is placed.
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cartSignature]);

  // Pickup orders pay no delivery fee, and free delivery is judged on the amount after the
  // voucher. This mirrors create_order() in the database, which decides the saved total.
  const discount = voucher?.discount ?? 0;
  const payable = Math.max(0, subtotal - discount);
  const deliveryFee =
    deliveryMethod === "pickup" || lines.length === 0
      ? 0
      : payable >= businessConfig.freeDeliveryThreshold
        ? 0
        : businessConfig.deliveryFee;
  const total = payable + deliveryFee;

  const handleSubmit = async (details: CheckoutDetails) => {
    setSubmitting(true);
    setError(null);
    try {
      const result = await placeOrder({
        details,
        items: cartItems,
        voucherCode: voucher?.code ?? null,
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
          {placed.discount > 0 && (
            <p className="text-sm font-medium text-brand-700">
              Voucher {placed.voucherCode} saved you {formatPrice(placed.discount)}.
            </p>
          )}
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
            {lines.map(({ key, product, quantity, optionDisplay, unitPrice }) => (
              <li key={key} className="flex gap-3">
                <span className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-brand-50">
                  <Image src={product.image} alt={product.name} fill className="object-cover" />
                </span>
                <span className="flex-1">
                  <span className="block line-clamp-1 text-sm font-medium text-gray-900">
                    {product.name}
                  </span>
                  {optionDisplay && (
                    <span className="block text-xs font-medium text-brand-700">{optionDisplay}</span>
                  )}
                  <span className="block text-xs text-gray-500">Qty: {quantity}</span>
                </span>
                <span className="shrink-0 text-sm font-semibold text-gray-900">
                  {formatPrice(unitPrice * quantity)}
                </span>
              </li>
            ))}
          </ul>

          <div className="mb-4 border-t border-gray-100 pt-4">
            {voucher ? (
              <div className="flex items-center justify-between gap-2 rounded-xl bg-brand-50 px-3 py-2 text-sm">
                <span className="flex items-center gap-2 font-medium text-brand-800">
                  <Tag className="h-4 w-4" aria-hidden="true" />
                  {voucher.code} applied ({voucher.percent}% off eligible items)
                </span>
                <button
                  type="button"
                  onClick={removeVoucher}
                  aria-label="Remove voucher"
                  className="rounded-lg p-1 text-gray-500 hover:bg-white hover:text-gray-800"
                >
                  <X className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>
            ) : (
              <div>
                <label htmlFor="voucher" className="mb-1 block text-sm font-medium text-gray-700">
                  Voucher code
                </label>
                <div className="flex gap-2">
                  <input
                    id="voucher"
                    value={voucherInput}
                    onChange={(e) => setVoucherInput(e.target.value.toUpperCase())}
                    onKeyDown={(e) => {
                      // Enter applies the code instead of submitting the order form.
                      if (e.key === "Enter") {
                        e.preventDefault();
                        if (voucherInput.trim() && !checkingVoucher) void applyVoucher();
                      }
                    }}
                    maxLength={30}
                    autoComplete="off"
                    spellCheck={false}
                    placeholder="Enter code"
                    className="input flex-1 uppercase"
                  />
                  <button
                    type="button"
                    onClick={applyVoucher}
                    disabled={checkingVoucher || !voucherInput.trim()}
                    className="btn-secondary !py-2"
                  >
                    {checkingVoucher && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
                    Apply
                  </button>
                </div>
                {voucherError && (
                  <p role="alert" className="mt-1.5 text-xs text-red-600">
                    {voucherError}
                  </p>
                )}
              </div>
            )}
          </div>

          <div className="flex flex-col gap-2 border-t border-gray-100 pt-3 text-sm">
            <div className="flex justify-between text-gray-600">
              <span>Subtotal</span>
              <span>{formatPrice(subtotal)}</span>
            </div>
            {discount > 0 && (
              <div className="flex justify-between font-medium text-brand-700">
                <span>Voucher discount</span>
                <span>-{formatPrice(discount)}</span>
              </div>
            )}
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
