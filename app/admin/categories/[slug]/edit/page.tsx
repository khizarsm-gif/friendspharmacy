import { notFound } from "next/navigation";
import { requireAdminPage } from "@/lib/admin-auth";
import { adminGetCategory } from "@/lib/admin-data";
import PageHeader from "../../../_components/PageHeader";
import CategoryForm from "../../CategoryForm";

export const dynamic = "force-dynamic";

export default async function EditCategoryPage({ params }: { params: { slug: string } }) {
  const slug = decodeURIComponent(params.slug);
  const supabase = await requireAdminPage();
  const [category, { count }] = await Promise.all([
    adminGetCategory(supabase, slug),
    supabase.from("products").select("id", { count: "exact", head: true }).eq("category", slug),
  ]);
  if (!category) notFound();

  return (
    <div>
      <PageHeader title="Edit category" description={category.name} />
      <CategoryForm category={category} productCount={count ?? 0} />
    </div>
  );
}
