import Image from "next/image";
import Link from "next/link";
import { AlertTriangle, Package, PackageX, Plus, Star, Tags, type LucideIcon } from "lucide-react";
import { requireAdminPage } from "@/lib/admin-auth";
import { adminListCategories, adminListProducts, LOW_STOCK_THRESHOLD } from "@/lib/admin-data";
import { formatPrice } from "@/lib/utils";
import PageHeader from "./_components/PageHeader";

export const dynamic = "force-dynamic";

function StatCard({
  label,
  value,
  icon: Icon,
  tone = "brand",
  href,
}: {
  label: string;
  value: number;
  icon: LucideIcon;
  tone?: "brand" | "amber" | "red" | "blue";
  href?: string;
}) {
  const tones = {
    brand: "bg-brand-50 text-brand-700",
    amber: "bg-amber-50 text-amber-700",
    red: "bg-red-50 text-red-700",
    blue: "bg-accent-50 text-accent-700",
  };
  const body = (
    <div className="card flex items-center gap-4 p-5 transition-shadow hover:shadow-card-hover">
      <span className={`flex h-11 w-11 items-center justify-center rounded-xl ${tones[tone]}`}>
        <Icon className="h-5 w-5" aria-hidden="true" />
      </span>
      <div>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
        <p className="text-sm text-gray-500">{label}</p>
      </div>
    </div>
  );
  return href ? <Link href={href}>{body}</Link> : body;
}

export default async function AdminDashboardPage() {
  const supabase = await requireAdminPage();
  const [products, categories] = await Promise.all([
    adminListProducts(supabase),
    adminListCategories(supabase),
  ]);

  const outOfStock = products.filter((p) => p.stock <= 0);
  const lowStock = products
    .filter((p) => p.stock > 0 && p.stock <= LOW_STOCK_THRESHOLD)
    .sort((a, b) => a.stock - b.stock);
  const featured = products.filter((p) => p.featured);
  const demoCount = products.filter((p) => p.isDemo).length;
  const recent = products.slice(0, 5);

  const countByCategory = products.reduce<Record<string, number>>((acc, p) => {
    acc[p.category] = (acc[p.category] ?? 0) + 1;
    return acc;
  }, {});
  const maxCount = Math.max(1, ...Object.values(countByCategory));

  return (
    <div>
      <PageHeader
        title="Dashboard"
        description="An overview of your store's catalog and stock."
        actions={
          <Link href="/admin/products/new" className="btn-primary !py-2.5">
            <Plus className="h-4 w-4" aria-hidden="true" />
            Add product
          </Link>
        }
      />

      {demoCount > 0 && (
        <div className="mb-6 flex items-start gap-3 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-800 ring-1 ring-amber-200">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <p>
            <strong>{demoCount}</strong> demo {demoCount === 1 ? "product is" : "products are"} still
            live on the store. Edit or delete them from{" "}
            <Link href="/admin/products?filter=demo" className="font-semibold underline">
              Products
            </Link>
            .
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Products" value={products.length} icon={Package} href="/admin/products" />
        <StatCard label="Categories" value={categories.length} icon={Tags} tone="blue" href="/admin/categories" />
        <StatCard
          label={`Low stock (≤ ${LOW_STOCK_THRESHOLD})`}
          value={lowStock.length}
          icon={AlertTriangle}
          tone="amber"
          href="/admin/products?filter=low"
        />
        <StatCard
          label="Out of stock"
          value={outOfStock.length}
          icon={PackageX}
          tone="red"
          href="/admin/products?filter=out"
        />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-3">
        <section className="card p-5 xl:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-semibold text-gray-900">Recently added</h2>
            <Link href="/admin/products" className="text-sm font-medium text-brand-700 hover:underline">
              View all
            </Link>
          </div>
          {recent.length === 0 ? (
            <p className="text-sm text-gray-500">No products yet.</p>
          ) : (
            <ul className="divide-y">
              {recent.map((p) => (
                <li key={p.id}>
                  <Link
                    href={`/admin/products/${p.id}/edit`}
                    className="flex items-center gap-3 py-3 hover:bg-gray-50"
                  >
                    <span className="relative h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-gray-100">
                      <Image src={p.image} alt="" fill sizes="40px" className="object-cover" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium text-gray-900">{p.name}</span>
                      <span className="block text-xs text-gray-500">{p.brand}</span>
                    </span>
                    <span className="text-sm font-semibold text-gray-900">
                      {formatPrice(p.salePrice ?? p.price)}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="card p-5">
          <h2 className="mb-4 font-semibold text-gray-900">Needs restocking</h2>
          {outOfStock.length + lowStock.length === 0 ? (
            <p className="text-sm text-gray-500">Everything is well stocked.</p>
          ) : (
            <ul className="space-y-2">
              {[...outOfStock, ...lowStock].slice(0, 8).map((p) => (
                <li key={p.id} className="flex items-center justify-between gap-3 text-sm">
                  <Link href={`/admin/products/${p.id}/edit`} className="truncate text-gray-800 hover:underline">
                    {p.name}
                  </Link>
                  <span
                    className={`badge shrink-0 ${
                      p.stock <= 0 ? "bg-red-50 text-red-700" : "bg-amber-50 text-amber-700"
                    }`}
                  >
                    {p.stock <= 0 ? "Out" : `${p.stock} left`}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="card p-5 xl:col-span-2">
          <h2 className="mb-4 font-semibold text-gray-900">Products per category</h2>
          <ul className="space-y-3">
            {categories.map((c) => {
              const count = countByCategory[c.slug] ?? 0;
              return (
                <li key={c.slug} className="grid grid-cols-[9rem_1fr_2rem] items-center gap-3 text-sm">
                  <span className="truncate text-gray-700">{c.name}</span>
                  <span className="h-2 overflow-hidden rounded-full bg-gray-100">
                    <span
                      className="block h-full rounded-full bg-brand-500"
                      style={{ width: `${(count / maxCount) * 100}%` }}
                    />
                  </span>
                  <span className="text-right font-medium text-gray-900">{count}</span>
                </li>
              );
            })}
          </ul>
        </section>

        <section className="card p-5">
          <h2 className="mb-1 flex items-center gap-2 font-semibold text-gray-900">
            <Star className="h-4 w-4 text-amber-500" aria-hidden="true" />
            Featured on homepage
          </h2>
          <p className="mb-3 text-xs text-gray-500">{featured.length} products</p>
          <ul className="space-y-1.5 text-sm">
            {featured.slice(0, 8).map((p) => (
              <li key={p.id} className="truncate">
                <Link href={`/admin/products/${p.id}/edit`} className="text-gray-800 hover:underline">
                  {p.name}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
