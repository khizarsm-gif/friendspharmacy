import { requireOwnerPage } from "@/lib/admin-auth";
import { adminListCategories } from "@/lib/admin-data";
import PageHeader from "../../_components/PageHeader";
import CategoryForm from "../CategoryForm";

export const dynamic = "force-dynamic";

export default async function NewCategoryPage() {
  const { supabase } = await requireOwnerPage();
  const categories = await adminListCategories(supabase);
  const nextSortOrder = Math.max(0, ...categories.map((c) => c.sortOrder)) + 1;

  return (
    <div>
      <PageHeader title="Add category" />
      <CategoryForm nextSortOrder={nextSortOrder} />
    </div>
  );
}
