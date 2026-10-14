import { notFound } from "next/navigation";
import { requireOwnerPage } from "@/lib/admin-auth";
import { adminListCategories } from "@/lib/admin-data";
import { adminGetVoucher } from "@/lib/admin-vouchers";
import PageHeader from "../../../_components/PageHeader";
import VoucherForm from "../../VoucherForm";

export const dynamic = "force-dynamic";

export default async function EditVoucherPage({ params }: { params: { id: string } }) {
  const id = Number(params.id);
  if (!Number.isInteger(id) || id < 1) notFound();
  const { supabase } = await requireOwnerPage();
  const [voucher, categories] = await Promise.all([adminGetVoucher(supabase, id), adminListCategories(supabase)]);
  if (!voucher) notFound();

  return (
    <div>
      <PageHeader title="Edit voucher" description={`${voucher.customerName} · ${voucher.code}`} />
      <VoucherForm voucher={voucher} categories={categories} />
    </div>
  );
}
