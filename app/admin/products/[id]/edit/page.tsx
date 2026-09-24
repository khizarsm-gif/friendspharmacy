import Link from "next/link";
import { notFound } from "next/navigation";
import { ExternalLink } from "lucide-react";
import { requireAdminPage } from "@/lib/admin-auth";
import { adminGetProduct, adminListCategories } from "@/lib/admin-data";
import PageHeader from "../../../_components/PageHeader";
import ProductForm from "../../ProductForm";

export const dynamic = "force-dynamic";

export default async function EditProductPage({ params }: { params: { id: string } }) {
  const id = Number(params.id);
  if (!Number.isInteger(id)) notFound();

  const supabase = await requireAdminPage();
  const [product, categories] = await Promise.all([
    adminGetProduct(supabase, id),
    adminListCategories(supabase),
  ]);
  if (!product) notFound();

  return (
    <div>
      <PageHeader
        title="Edit product"
        description={product.name}
        actions={
          <Link href={`/products/${product.slug}`} target="_blank" className="btn-secondary !py-2.5">
            <ExternalLink className="h-4 w-4" aria-hidden="true" />
            View on store
          </Link>
        }
      />
      <ProductForm categories={categories} mode="edit" product={product} />
    </div>
  );
}
