import { getSupabaseClient } from "@/lib/supabase";
import type { Category } from "@/types";

/**
 * CATEGORY DATA ACCESS, backed by the Supabase `categories` table.
 * Categories are managed in the admin portal at /admin/categories.
 */

interface CategoryRow {
  slug: string;
  name: string;
  icon: string;
  description: string;
  sort_order: number;
}

export function mapCategoryRow(row: CategoryRow): Category {
  return {
    slug: row.slug,
    name: row.name,
    icon: row.icon,
    description: row.description,
    sortOrder: row.sort_order ?? 0,
  };
}

export async function getCategories(): Promise<Category[]> {
  const { data, error } = await getSupabaseClient()
    .from("categories")
    .select("slug,name,icon,description,sort_order")
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true });

  if (error) throw new Error(`getCategories: ${error.message}`);
  return (data as CategoryRow[]).map(mapCategoryRow);
}

export async function getCategoryBySlug(slug: string): Promise<Category | undefined> {
  const { data, error } = await getSupabaseClient()
    .from("categories")
    .select("slug,name,icon,description,sort_order")
    .eq("slug", slug)
    .maybeSingle();

  if (error) throw new Error(`getCategoryBySlug: ${error.message}`);
  return data ? mapCategoryRow(data as CategoryRow) : undefined;
}
