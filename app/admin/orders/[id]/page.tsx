import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Mail, MessageCircle, Phone } from "lucide-react";
import { requireAdminPage } from "@/lib/admin-auth";
import { adminGetOrder } from "@/lib/admin-orders";
import {
  DELIVERY_LABELS,
  formatDateTime,
  PAYMENT_LABELS,
  STATUS_LABELS,
  STATUS_TONES,
  whatsappDigits,
} from "@/lib/orders";
import { formatPrice } from "@/lib/utils";
import { InternalNotesForm, StatusForm } from "./OrderForms";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Order" };

export default async function AdminOrderDetailPage({ params }: { params: { id: string } }) {
  const supabase = await requireAdminPage();
  const result = await adminGetOrder(supabase, params.id);
  if (!result) notFound();
  const { order, items, history } = result;

  const waDigits = whatsappDigits(order.whatsapp);

  return (
    <div>
      <Link href="/admin/orders" className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-brand-700 hover:underline">
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        All orders
      </Link>

      <div className="mb-6 flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-bold text-gray-900">Order {order.orderNumber}</h1>
        <span className={`badge ${STATUS_TONES[order.status]}`}>{STATUS_LABELS[order.status]}</span>
        <span className="text-sm text-gray-500">Placed {formatDateTime(order.createdAt)}</span>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="space-y-6 xl:col-span-2">
          <section className="card overflow-hidden">
            <h2 className="px-5 pt-5 font-semibold text-gray-900">Items</h2>
            <div className="mt-3 overflow-x-auto">
              <table className="w-full min-w-[480px] text-left text-sm">
                <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
                  <tr>
                    <th className="px-5 py-2.5 font-semibold">Product</th>
                    <th className="px-3 py-2.5 text-right font-semibold">Price</th>
                    <th className="px-3 py-2.5 text-right font-semibold">Qty</th>
                    <th className="px-5 py-2.5 text-right font-semibold">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {items.map((i) => (
                    <tr key={i.id}>
                      <td className="px-5 py-3">
                        <span className="block font-medium text-gray-900">{i.productName}</span>
                        {i.sku && <span className="block text-xs text-gray-500">SKU {i.sku}</span>}
                      </td>
                      <td className="px-3 py-3 text-right text-gray-700">{formatPrice(i.unitPrice)}</td>
                      <td className="px-3 py-3 text-right text-gray-700">{i.quantity}</td>
                      <td className="px-5 py-3 text-right font-medium text-gray-900">{formatPrice(i.lineTotal)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <dl className="space-y-1.5 border-t px-5 py-4 text-sm">
              <div className="flex justify-between text-gray-600">
                <dt>Subtotal</dt>
                <dd>{formatPrice(order.subtotal)}</dd>
              </div>
              <div className="flex justify-between text-gray-600">
                <dt>Delivery fee</dt>
                <dd>{order.deliveryFee === 0 ? "Free" : formatPrice(order.deliveryFee)}</dd>
              </div>
              <div className="flex justify-between text-base font-bold text-gray-900">
                <dt>Total</dt>
                <dd>{formatPrice(order.total)}</dd>
              </div>
            </dl>
          </section>

          <section className="card p-5">
            <h2 className="mb-4 font-semibold text-gray-900">History</h2>
            <ol className="space-y-4">
              {history.map((h) => (
                <li key={h.id} className="flex gap-3 text-sm">
                  <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-brand-500" aria-hidden="true" />
                  <div>
                    <p className="text-gray-900">
                      {h.fromStatus ? (
                        <>
                          {STATUS_LABELS[h.fromStatus]} <span aria-hidden="true">&rarr;</span>{" "}
                          <strong>{STATUS_LABELS[h.toStatus]}</strong>
                        </>
                      ) : (
                        <strong>{STATUS_LABELS[h.toStatus]}</strong>
                      )}
                    </p>
                    {h.note && <p className="text-gray-600">{h.note}</p>}
                    <p className="text-xs text-gray-500">{formatDateTime(h.createdAt)}</p>
                  </div>
                </li>
              ))}
            </ol>
          </section>
        </div>

        <div className="space-y-6">
          <section className="card p-5">
            <h2 className="mb-4 font-semibold text-gray-900">Update order</h2>
            <StatusForm
              key={`${order.status}-${order.updatedAt}`}
              orderId={order.id}
              status={order.status}
              deliveryMethod={order.deliveryMethod}
            />
          </section>

          <section className="card p-5">
            <h2 className="mb-3 font-semibold text-gray-900">Customer</h2>
            <p className="font-medium text-gray-900">{order.customerName}</p>
            <ul className="mt-3 space-y-2 text-sm">
              <li className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-gray-400" aria-hidden="true" />
                <a href={`tel:${order.phone.replace(/[^\d+]/g, "")}`} className="text-brand-700 hover:underline">
                  {order.phone}
                </a>
              </li>
              <li className="flex items-center gap-2">
                <MessageCircle className="h-4 w-4 text-gray-400" aria-hidden="true" />
                {waDigits ? (
                  <a
                    href={`https://wa.me/${waDigits}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-brand-700 hover:underline"
                  >
                    {order.whatsapp} (WhatsApp)
                  </a>
                ) : (
                  <span>{order.whatsapp}</span>
                )}
              </li>
              {order.email && (
                <li className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-gray-400" aria-hidden="true" />
                  <a href={`mailto:${order.email}`} className="break-all text-brand-700 hover:underline">
                    {order.email}
                  </a>
                </li>
              )}
            </ul>
          </section>

          <section className="card p-5">
            <h2 className="mb-3 font-semibold text-gray-900">Fulfilment</h2>
            <dl className="space-y-2 text-sm">
              <div>
                <dt className="text-gray-500">Method</dt>
                <dd className="font-medium text-gray-900">{DELIVERY_LABELS[order.deliveryMethod]}</dd>
              </div>
              {order.deliveryMethod === "delivery" && (
                <div>
                  <dt className="text-gray-500">Address</dt>
                  <dd className="whitespace-pre-line font-medium text-gray-900">
                    {[order.address, order.city].filter(Boolean).join("\n")}
                  </dd>
                </div>
              )}
              <div>
                <dt className="text-gray-500">Payment</dt>
                <dd className="font-medium text-gray-900">
                  {PAYMENT_LABELS[order.paymentMethod] ?? order.paymentMethod}
                </dd>
              </div>
              {order.notes && (
                <div>
                  <dt className="text-gray-500">Customer notes</dt>
                  <dd className="whitespace-pre-line text-gray-900">{order.notes}</dd>
                </div>
              )}
            </dl>
          </section>

          <section className="card p-5">
            <InternalNotesForm orderId={order.id} notes={order.internalNotes ?? ""} />
          </section>
        </div>
      </div>
    </div>
  );
}
