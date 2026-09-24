import type { createClient } from "@/lib/supabase-server";
import { mapRow, type ProductRow } from "@/data/products";
import { mapCategoryRow } from "@/data/categories";
import type { Category, Product } from "@/types";

type ServerSupabase = Awaited<ReturnType<typeof createClient>>;

/**
 * Uncached reads for the admin portal, so admins always see the latest data
 * (the storefront uses the cached reads in data/*.ts instead).
 */
export async function adminListProducts(supabase: ServerSupabase): Promise<Product[]> {
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw new Error(`Could not load products: ${error.message}`);
  return (data as ProductRow[]).map(mapRow);
}

export async function adminGetProduct(
  supabase: ServerSupabase,
  id: number
): Promise<Product | undefined> {
  const { data, error } = await supabase.from("products").select("*").eq("id", id).maybeSingle();
  if (error) throw new Error(`Could not load product: ${error.message}`);
  return data ? mapRow(data as ProductRow) : undefined;
}

export async function adminListCategories(supabase: ServerSupabase): Promise<Category[]> {
  const { data, error } = await supabase
    .from("categories")
    .select("slug,name,icon,description,sort_order")
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true });
  if (error) throw new Error(`Could not load categories: ${error.message}`);
  return (data ?? []).map(mapCategoryRow);
}

export async function adminGetCategory(
  supabase: ServerSupabase,
  slug: string
): Promise<Category | undefined> {
  const { data, error } = await supabase
    .from("categories")
    .select("slug,name,icon,description,sort_order")
    .eq("slug", slug)
    .maybeSingle();
  if (error) throw new Error(`Could not load category: ${error.message}`);
  return data ? mapCategoryRow(data) : undefined;
}

export const LOW_STOCK_THRESHOLD = 5;
