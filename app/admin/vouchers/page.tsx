import Link from "next/link";
import { Pencil, Plus } from "lucide-react";
import { requireOwnerPage } from "@/lib/admin-auth";
import { adminListCategories } from "@/lib/admin-data";
import { adminListVouchers, voucherStatus } from "@/lib/admin-vouchers";
import { formatPrice } from "@/lib/utils";
import PageHeader from "../_components/PageHeader";
import Flash from "../_components/Flash";
import ConfirmDeleteButton from "../_components/ConfirmDeleteButton";
import VoucherActiveToggle from "./VoucherActiveToggle";
import { deleteVoucher } from "./actions";

export const dynamic = "force-dynamic";

const STATUS_BADGE = {
  active: { label: "Active", tone: "bg-brand-50 text-brand-700" },
  off: { label: "Switched off", tone: "bg-gray-100 text-gray-600" },
  expired: { label: "Expired", tone: "bg-amber-50 text-amber-700" },
} as const;

export default async function AdminVouchersPage({ searchParams }: { searchParams: { saved?: string } }) {
  const { supabase } = await requireOwnerPage();
  const [vouchers, categories] = await Promise.all([adminListVouchers(supabase), adminListCategories(supabase)]);
  const categoryName = new Map(categories.map((c) => [c.slug, c.name]));

  return (
    <div>
      <PageHeader
        title="Vouchers"
        description="Discount codes for regular customers. They type the code at checkout and the discount comes off their bill."
        actions={
          <Link href="/admin/vouchers/new" className="btn-primary !py-2.5">
            <Plus className="h-4 w-4" aria-hidden="true" />
            Add voucher
          </Link>
        }
      />
      <Flash saved={searchParams.saved} />

      <div className="card overflow-hidden">
        {vouchers.length === 0 ? (
          <p className="px-5 py-12 text-center text-sm text-gray-500">
            No vouchers yet. Add one for a regular customer and give them the code.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
                <tr>
                  <th className="px-4 py-3 font-semibold">Customer</th>
                  <th className="px-4 py-3 font-semibold">Code</th>
                  <th className="px-4 py-3 font-semibold">Discount</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold">Used</th>
                  <th className="px-4 py-3 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {vouchers.map((v) => {
                  const status = STATUS_BADGE[voucherStatus(v)];
                  return (
                    <tr key={v.id} className="align-top hover:bg-gray-50/60">
                      <td className="px-4 py-3 font-medium text-gray-900">{v.customerName}</td>
                      <td className="px-4 py-3 font-mono text-gray-800">{v.code}</td>
                      <td className="px-4 py-3 text-gray-700">
                        <span className="block font-semibold">{v.discountPercent}% off</span>
                        <span className="block text-xs text-gray-500">
                          {v.categories.length > 0
                            ? v.categories.map((s) => categoryName.get(s) ?? s).join(", ")
                            : "No categories (does nothing)"}
                          {v.excludeSaleItems ? " · not on sale items" : ""}
                        </span>
                        {v.expiresOn && <span className="block text-xs text-gray-500">Until {v.expiresOn}</span>}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`badge ${status.tone}`}>{status.label}</span>
                      </td>
                      <td className="px-4 py-3 text-gray-700">
                        {v.ordersCount === 0 ? (
                          <span className="text-gray-400">Not used yet</span>
                        ) : (
                          <>
                            <span className="block">
                              {v.ordersCount} {v.ordersCount === 1 ? "order" : "orders"}
                            </span>
                            <span className="block text-xs text-gray-500">{formatPrice(v.discountTotal)} given</span>
                          </>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-start justify-end gap-1">
                          <VoucherActiveToggle id={v.id} active={v.active} />
                          <Link
                            href={`/admin/vouchers/${v.id}/edit`}
                            className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-sm font-medium text-brand-700 hover:bg-brand-50"
                          >
                            <Pencil className="h-4 w-4" aria-hidden="true" />
                            Edit
                          </Link>
                          <ConfirmDeleteButton
                            action={deleteVoucher.bind(null, v.id)}
                            confirmText={`Delete the code ${v.code}? Past orders keep their discount.`}
                            iconOnly
                            label={`Delete ${v.code}`}
                          />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
