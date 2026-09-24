import Link from "next/link";
import { Plus } from "lucide-react";
import { requireAdminPage } from "@/lib/admin-auth";
import { adminListCategories, adminListProducts } from "@/lib/admin-data";
import PageHeader from "../_components/PageHeader";
import Flash from "../_components/Flash";
import ProductsTable from "./ProductsTable";

export const dynamic = "force-dynamic";

export default async function AdminProductsPage({
  searchParams,
}: {
  searchParams: { saved?: string; filter?: string; category?: string };
}) {
  const supabase = await requireAdminPage();
  const [products, categories] = await Promise.all([
    adminListProducts(supabase),
    adminListCategories(supabase),
  ]);

  return (
    <div>
      <PageHeader
        title="Products"
        description={`${products.length} products in your catalog`}
        actions={
          <Link href="/admin/products/new" className="btn-primary !py-2.5">
            <Plus className="h-4 w-4" aria-hidden="true" />
            Add product
          </Link>
        }
      />
      <Flash saved={searchParams.saved} />
      <ProductsTable products={products} categories={categories} initialFilter={searchParams.filter}
        initialCategory={searchParams.category}
      />
    </div>
  );
}
