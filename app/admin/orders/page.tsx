import Link from "next/link";
import { Search } from "lucide-react";
import { requireAdminPage } from "@/lib/admin-auth";
import { adminListOrders, adminOrderCounts, ORDERS_PAGE_LIMIT } from "@/lib/admin-orders";
import {
  DELIVERY_LABELS,
  formatDateTime,
  isOrderStatus,
  ORDER_STATUSES,
  STATUS_LABELS,
  STATUS_TONES,
} from "@/lib/orders";
import { classNames, formatPrice } from "@/lib/utils";
import Flash from "../_components/Flash";
import PageHeader from "../_components/PageHeader";

export const dynamic = "force-dynamic";

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: { status?: string; q?: string; saved?: string };
}) {
  const supabase = await requireAdminPage();
  const status = isOrderStatus(searchParams.status) ? searchParams.status : undefined;
  const q = (searchParams.q ?? "").slice(0, 60);

  let loadError: string | null = null;
  let orders: Awaited<ReturnType<typeof adminListOrders>> = [];
  let counts: Awaited<ReturnType<typeof adminOrderCounts>> | null = null;
  try {
    [orders, counts] = await Promise.all([
      adminListOrders(supabase, { status, q }),
      adminOrderCounts(supabase),
    ]);
  } catch (err) {
    // Most likely the orders migration hasn't been applied to the database yet.
    console.error("[admin] orders page failed:", err instanceof Error ? err.message : err);
    loadError = "Orders could not be loaded. The orders tables may not be set up in the database yet.";
  }

  const tabHref = (s?: string) => {
    const params = new URLSearchParams();
    if (s) params.set("status", s);
    if (q) params.set("q", q);
    const qs = params.toString();
    return qs ? `/admin/orders?${qs}` : "/admin/orders";
  };

  return (
    <div>
      <PageHeader
        title="Orders"
        description="Orders placed on the website. Open an order to update its status."
      />
      <Flash saved={searchParams.saved} />

      {loadError ? (
        <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700 ring-1 ring-red-200">
          {loadError}
        </p>
      ) : (
        <>
          <div className="mb-4 flex flex-wrap gap-2" aria-label="Filter by status">
            {[undefined, ...ORDER_STATUSES].map((s) => {
              const active = s === status;
              const label = s ? STATUS_LABELS[s] : "All";
              const n = counts ? counts[s ?? "all"] : 0;
              return (
                <Link
                  key={s ?? "all"}
                  href={tabHref(s)}
                  aria-current={active ? "page" : undefined}
                  className={classNames(
                    "rounded-full px-3.5 py-1.5 text-sm font-medium ring-1 ring-inset transition-colors",
                    active
                      ? "bg-brand-600 text-white ring-brand-600"
                      : "bg-white text-gray-700 ring-gray-200 hover:bg-gray-50"
                  )}
                >
                  {label} <span className={active ? "text-brand-100" : "text-gray-400"}>{n}</span>
                </Link>
              );
            })}
          </div>

          <form method="get" action="/admin/orders" role="search" className="mb-4 flex max-w-md gap-2">
            {status && <input type="hidden" name="status" value={status} />}
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" aria-hidden="true" />
              <label htmlFor="order-search" className="sr-only">Search orders</label>
              <input
                id="order-search"
                name="q"
                defaultValue={q}
                placeholder="Order number, name or phone"
                className="input pl-9"
              />
            </div>
            <button type="submit" className="btn-secondary !py-2.5">Search</button>
          </form>

          <div className="card overflow-hidden">
            {orders.length === 0 ? (
              <p className="px-5 py-12 text-center text-sm text-gray-500">
                {status || q ? "No orders match this filter." : "No orders yet. They will appear here as customers check out."}
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[640px] text-left text-sm">
                  <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
                    <tr>
                      <th className="px-4 py-3 font-semibold">Order</th>
                      <th className="px-4 py-3 font-semibold">Customer</th>
                      <th className="px-4 py-3 font-semibold">Fulfilment</th>
                      <th className="px-4 py-3 font-semibold">Total</th>
                      <th className="px-4 py-3 font-semibold">Status</th>
                      <th className="px-4 py-3 font-semibold">Placed</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {orders.map((o) => (
                      <tr key={o.id} className="hover:bg-gray-50/60">
                        <td className="px-4 py-3">
                          <Link href={`/admin/orders/${o.id}`} className="font-semibold text-brand-700 hover:underline">
                            {o.orderNumber}
                          </Link>
                        </td>
                        <td className="px-4 py-3">
                          <span className="block font-medium text-gray-900">{o.customerName}</span>
                          <span className="block text-xs text-gray-500">{o.phone}</span>
                        </td>
                        <td className="px-4 py-3 text-gray-600">{DELIVERY_LABELS[o.deliveryMethod]}</td>
                        <td className="px-4 py-3 font-semibold text-gray-900">{formatPrice(o.total)}</td>
                        <td className="px-4 py-3">
                          <span className={`badge ${STATUS_TONES[o.status]}`}>{STATUS_LABELS[o.status]}</span>
                        </td>
                        <td className="px-4 py-3 text-gray-600">{formatDateTime(o.createdAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
          {orders.length === ORDERS_PAGE_LIMIT && (
            <p className="mt-3 text-xs text-gray-500">
              Showing the latest {ORDERS_PAGE_LIMIT} orders. Use search or a status filter to narrow down.
            </p>
          )}
        </>
      )}
    </div>
  );
}
