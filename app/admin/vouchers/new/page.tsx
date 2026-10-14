import { requireOwnerPage } from "@/lib/admin-auth";
import { adminListCategories } from "@/lib/admin-data";
import PageHeader from "../../_components/PageHeader";
import VoucherForm from "../VoucherForm";

export const dynamic = "force-dynamic";

export default async function NewVoucherPage() {
  const { supabase } = await requireOwnerPage();
  const categories = await adminListCategories(supabase);

  return (
    <div>
      <PageHeader title="Add voucher" description="One code per customer. They enter it at checkout." />
      <VoucherForm categories={categories} />
    </div>
  );
}
