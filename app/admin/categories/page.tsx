import Link from "next/link";
import { Pencil, Plus } from "lucide-react";
import { getAdminSession, requireAdminPage } from "@/lib/admin-auth";
import { adminListCategories } from "@/lib/admin-data";
import { getCategoryIcon } from "@/lib/category-icons";
import PageHeader from "../_components/PageHeader";
import Flash from "../_components/Flash";
import ConfirmDeleteButton from "../_components/ConfirmDeleteButton";
import { deleteCategory } from "./actions";

export const dynamic = "force-dynamic";

export default async function AdminCategoriesPage({
  searchParams,
}: {
  searchParams: { saved?: string };
}) {
  const supabase = await requireAdminPage();
  const { role } = await getAdminSession();
  const isOwner = role === "owner";
  const [categories, { data: productRows }] = await Promise.all([
    adminListCategories(supabase),
    supabase.from("products").select("category"),
  ]);
  const counts = (productRows ?? []).reduce<Record<string, number>>((acc, row) => {
    acc[row.category] = (acc[row.category] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <div>
      <PageHeader
        title="Categories"
        description={
            isOwner
              ? "Categories appear on the homepage, in shop filters and in the footer."
              : "View only. Ask an owner to add or change categories."
        }
        actions={
          isOwner && (
          <Link href="/admin/categories/new" className="btn-primary !py-2.5">
            <Plus className="h-4 w-4" aria-hidden="true" />
            Add category
          </Link>
          )
        }
      />
      <Flash saved={searchParams.saved} />

      {categories.length === 0 ? (
        <div className="card p-10 text-center text-sm text-gray-500">No categories yet.</div>
      ) : (
        <ul className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {categories.map((c) => {
            const Icon = getCategoryIcon(c.icon);
            const count = counts[c.slug] ?? 0;
            return (
              <li key={c.slug} className="card flex flex-col p-5">
                <div className="flex items-start gap-4">
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
                    <Icon className="h-6 w-6" aria-hidden="true" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <h2 className="font-semibold text-gray-900">{c.name}</h2>
                    <p className="text-sm text-gray-500">{c.description}</p>
                    <p className="mt-1 text-xs text-gray-400">/{c.slug} · order {c.sortOrder}</p>
                  </div>
                </div>
                <div className="mt-4 flex items-center justify-between border-t pt-3">
                  <Link
                    href={`/admin/products?category=${encodeURIComponent(c.slug)}`}
                    className="text-sm text-gray-600 hover:underline"
                  >
                    {count} {count === 1 ? "product" : "products"}
                  </Link>
                  {isOwner && (
                  <div className="flex items-center gap-1">
                    <Link
                      href={`/admin/categories/${encodeURIComponent(c.slug)}/edit`}
                      className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-sm font-medium text-brand-700 hover:bg-brand-50"
                    >
                      <Pencil className="h-4 w-4" aria-hidden="true" />
                      Edit
                    </Link>
                    <ConfirmDeleteButton
                      action={deleteCategory.bind(null, c.slug)}
                      confirmText={`Delete the "${c.name}" category?`}
                      iconOnly
                      label={`Delete ${c.name}`}
                    />
                  </div>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
