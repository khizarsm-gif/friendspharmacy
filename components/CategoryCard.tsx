import Link from "next/link";
import type { Category } from "@/types";
import { getCategoryIcon } from "@/lib/category-icons";

export default function CategoryCard({ category, count }: { category: Category; count: number }) {
  const Icon = getCategoryIcon(category.icon);

  return (
    <Link
      href={`/shop?category=${category.slug}`}
      className="card group flex flex-col items-center gap-3 p-5 text-center transition-shadow hover:shadow-card-hover sm:p-6"
    >
      <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-50 text-brand-700 transition-colors group-hover:bg-brand-100">
        <Icon className="h-7 w-7" aria-hidden="true" />
      </span>
      <span className="text-sm font-semibold text-gray-900 sm:text-base">
        {category.name}
      </span>
      <span className="text-xs text-gray-500">
        {count} {count === 1 ? "product" : "products"}
      </span>
    </Link>
  );
}
