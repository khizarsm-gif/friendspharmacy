"use server";

import { redirect } from "next/navigation";
import { requireAdminAction } from "@/lib/admin-auth";
import { refreshStorefront, removeStoredImage, slugify } from "@/lib/admin-utils";

export interface ActionState {
  error: string | null;
}

const PLACEHOLDER_IMAGE = "/images/products/placeholder.svg";

interface ParsedFields {
  name: string;
  slug: string;
  brand: string;
  category: string;
  description: string;
  keyInfo: string[];
  price: number;
  salePrice: number | null;
  stock: number;
  sku: string;
  featured: boolean;
  prescriptionRequired: boolean;
  image: string;
}

function parseProductFields(formData: FormData): ParsedFields {
  const text = (key: string) => String(formData.get(key) ?? "").trim();

  const name = text("name");
  const slug = slugify(text("slug") || name);
  const keyInfoRaw = text("keyInfo");
  const price = Number(text("price"));
  const salePriceRaw = text("salePrice");
  const salePrice = salePriceRaw ? Number(salePriceRaw) : null;
  const stock = Number(text("stock") || 0);
  const image = text("image");

  if (!name) throw new Error("Product name is required.");
  if (!slug) throw new Error("Couldn't generate a URL slug. Check the product name.");
  if (!text("brand")) throw new Error("Brand is required.");
  if (!text("category")) throw new Error("Category is required.");
  if (!text("description")) throw new Error("Description is required.");
  if (!text("sku")) throw new Error("SKU is required.");
  if (!Number.isFinite(price) || price < 0) throw new Error("Price must be a valid number, 0 or more.");
  if (salePrice != null && (!Number.isFinite(salePrice) || salePrice < 0)) {
    throw new Error("Sale price must be a valid number, 0 or more.");
  }
  if (salePrice != null && salePrice >= price) {
    throw new Error("Sale price must be lower than the regular price.");
  }
  if (!Number.isInteger(stock) || stock < 0) throw new Error("Stock must be a whole number, 0 or more.");
  // Only allow our own relative paths or https URLs (blocks javascript:/data: URLs).
  if (image && !image.startsWith("/") && !/^https:\/\//i.test(image)) {
    throw new Error("Image must be an uploaded photo or an https:// link.");
  }

  return {
    name,
    slug,
    brand: text("brand"),
    category: text("category"),
    description: text("description"),
    keyInfo: keyInfoRaw ? keyInfoRaw.split("\n").map((s) => s.trim()).filter(Boolean) : [],
    price,
    salePrice,
    stock,
    sku: text("sku"),
    featured: formData.get("featured") === "on",
    prescriptionRequired: formData.get("prescriptionRequired") === "on",
    image,
  };
}

function toRow(fields: ParsedFields) {
  return {
    name: fields.name,
    slug: fields.slug,
    brand: fields.brand,
    category: fields.category,
    description: fields.description,
    key_info: fields.keyInfo,
    price: fields.price,
    sale_price: fields.salePrice,
    image: fields.image || PLACEHOLDER_IMAGE,
    stock: fields.stock,
    sku: fields.sku,
    featured: fields.featured,
    prescription_required: fields.prescriptionRequired,
  };
}

function friendlyDbError(message: string): string {
  if (message.includes("products_slug_key")) {
    return "A product with that URL slug already exists. Choose a different name or slug.";
  }
  if (message.includes("products_category_fkey")) {
    return "That category doesn't exist. Pick one from the dropdown.";
  }
  if (message.includes("row-level security")) {
    return "This account isn't allowed to change products.";
  }
  return `Could not save product: ${message}`;
}

export async function createProduct(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const { supabase, error: authError } = await requireAdminAction();
  if (!supabase) return { error: authError };

  let fields: ParsedFields;
  try {
    fields = parseProductFields(formData);
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Invalid input." };
  }

  const { error } = await supabase.from("products").insert({ ...toRow(fields), is_demo: false });
  if (error) {
    console.error("[admin] createProduct:", error.message);
    return { error: friendlyDbError(error.message) };
  }

  refreshStorefront();
  redirect("/admin/products?saved=product-created");
}

export async function updateProduct(
  id: number,
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const { supabase, error: authError } = await requireAdminAction();
  if (!supabase) return { error: authError };

  let fields: ParsedFields;
  try {
    fields = parseProductFields(formData);
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Invalid input." };
  }

  const { data: existing } = await supabase.from("products").select("image").eq("id", id).maybeSingle();

  // Editing a demo product turns it into a real one.
  const { error } = await supabase
    .from("products")
    .update({ ...toRow(fields), is_demo: false })
    .eq("id", id);
  if (error) {
    console.error("[admin] updateProduct:", error.message);
    return { error: friendlyDbError(error.message) };
  }

  if (existing?.image && existing.image !== toRow(fields).image) {
    await removeStoredImage(supabase, existing.image);
  }

  refreshStorefront();
  redirect("/admin/products?saved=product-updated");
}

export async function deleteProduct(id: number): Promise<{ error: string | null }> {
  const { supabase, error: authError } = await requireAdminAction();
  if (!supabase) return { error: authError };

  const { data: existing } = await supabase.from("products").select("image").eq("id", id).maybeSingle();

  const { error } = await supabase.from("products").delete().eq("id", id);
  if (error) {
    console.error("[admin] deleteProduct:", error.message);
    return { error: `Could not delete product: ${error.message}` };
  }

  await removeStoredImage(supabase, existing?.image);
  refreshStorefront();
  return { error: null };
}
