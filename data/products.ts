import { getSupabaseClient } from "@/lib/supabase";
import type { Product } from "@/types";

/**
 * ============================================================================
 * PRODUCT DATA ACCESS — backed by Supabase (PostgreSQL)
 * ============================================================================
 * Product data lives in the `products` table in Supabase, seeded from the
 * original 21 demo products (see the "create_categories_and_products"
 * migration). Categories remain a small static file (data/categories.ts) —
 * they're a fixed taxonomy that rarely changes, so there's no real benefit
 * to a database round-trip for them.
 *
 * Every page/component reads through the functions below rather than
 * querying Supabase directly, so the schema or query approach can change
 * (e.g. adding filters, pagination, a search index) without touching every
 * call site.
 *
 * Row Level Security only allows SELECT for the anon/authenticated roles —
 * there is no insert/update/delete access with the publishable key used
 * here. A future admin dashboard for adding/editing products or updating
 * stock would use the Supabase service role key from server-only code
 * (an API route or Server Action), never exposed to the browser.
 *
 * TO ADD / EDIT A PRODUCT RIGHT NOW: use the Supabase dashboard's Table
 * Editor (Table Editor -> products), or run SQL directly against the
 * `products` table. `slug` powers the URL at /products/[slug] and must be
 * unique; `category` must match a `slug` in data/categories.ts.
 * ============================================================================
 */

interface ProductRow {
  id: number;
  name: string;
  slug: string;
  brand: string;
  category: string;
  description: string;
  key_info: string[] | null;
  price: string | number;
  sale_price: string | number | null;
  image: string;
  stock: number;
  sku: string;
  featured: boolean;
  prescription_required: boolean;
  created_at: string;
  is_demo: boolean;
}

function mapRow(row: ProductRow): Product {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    brand: row.brand,
    category: row.category as Product["category"],
    description: row.description,
    keyInfo: row.key_info ?? [],
    price: Number(row.price),
    salePrice: row.sale_price != null ? Number(row.sale_price) : undefined,
    image: row.image,
    stock: row.stock,
    sku: row.sku,
    featured: row.featured,
    prescriptionRequired: row.prescription_required,
    createdAt: row.created_at,
    isDemo: row.is_demo,
  };
}

export async function getAllProducts(): Promise<Product[]> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .order("id", { ascending: true });

  if (error) throw new Error(`getAllProducts: ${error.message}`);
  return (data as ProductRow[]).map(mapRow);
}

export async function getProductById(id: number): Promise<Product | undefined> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) throw new Error(`getProductById: ${error.message}`);
  return data ? mapRow(data as ProductRow) : undefined;
}

export async function getProductBySlug(slug: string): Promise<Product | undefined> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();

  if (error) throw new Error(`getProductBySlug: ${error.message}`);
  return data ? mapRow(data as ProductRow) : undefined;
}

export async function getProductsByCategory(category: string): Promise<Product[]> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("category", category)
    .order("id", { ascending: true });

  if (error) throw new Error(`getProductsByCategory: ${error.message}`);
  return (data as ProductRow[]).map(mapRow);
}

export async function getFeaturedProducts(): Promise<Product[]> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("featured", true)
    .order("id", { ascending: true });

  if (error) throw new Error(`getFeaturedProducts: ${error.message}`);
  return (data as ProductRow[]).map(mapRow);
}

export async function getRelatedProducts(product: Product, limit = 4): Promise<Product[]> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("category", product.category)
    .neq("id", product.id)
    .order("id", { ascending: true })
    .limit(limit);

  if (error) throw new Error(`getRelatedProducts: ${error.message}`);
  return (data as ProductRow[]).map(mapRow);
}

/**
 * Server-side text search (name/brand/category) via Postgres ILIKE. Used as
 * an async alternative to filtering an already-fetched product list —
 * client components like SearchBar instead fetch the full catalog once
 * and filter it in memory for instant-as-you-type results, since the demo
 * catalog is small; this function is here for API completeness and for any
 * future server-rendered search page.
 */
export async function searchProducts(query: string): Promise<Product[]> {
  const q = query.trim();
  if (!q) return [];

  const supabase = getSupabaseClient();
  const escaped = q.replace(/[%_]/g, "\\$&");
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .or(`name.ilike.%${escaped}%,brand.ilike.%${escaped}%,category.ilike.%${escaped}%`)
    .order("id", { ascending: true });

  if (error) throw new Error(`searchProducts: ${error.message}`);
  return (data as ProductRow[]).map(mapRow);
}
