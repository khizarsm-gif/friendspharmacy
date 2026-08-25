"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export interface ActionState {
  error: string | null;
}

function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-+|-+$)/g, "");
}

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
  imageUrl: string;
}

function parseProductFields(formData: FormData): ParsedFields {
  const name = String(formData.get("name") || "").trim();
  const slugInput = String(formData.get("slug") || "").trim();
  const slug = slugify(slugInput || name);
  const brand = String(formData.get("brand") || "").trim();
  const category = String(formData.get("category") || "").trim();
  const description = String(formData.get("description") || "").trim();
  const keyInfoRaw = String(formData.get("keyInfo") || "").trim();
  const keyInfo = keyInfoRaw
    ? keyInfoRaw.split("\n").map((s) => s.trim()).filter(Boolean)
    : [];
  const price = Number(formData.get("price"));
  const salePriceRaw = String(formData.get("salePrice") || "").trim();
  const salePrice = salePriceRaw ? Number(salePriceRaw) : null;
  const stockRaw = Number(formData.get("stock"));
  const stock = Number.isFinite(stockRaw) ? stockRaw : 0;
  const sku = String(formData.get("sku") || "").trim();
  const featured = formData.get("featured") === "on";
  const prescriptionRequired = formData.get("prescriptionRequired") === "on";
  const imageUrl = String(formData.get("imageUrl") || "").trim();

  if (!name) throw new Error("Product name is required.");
  if (!slug) throw new Error("Couldn't generate a URL slug — check the product name.");
  if (!brand) throw new Error("Brand is required.");
  if (!category) throw new Error("Category is required.");
  if (!description) throw new Error("Description is required.");
  if (!sku) throw new Error("SKU is required.");
  if (!Number.isFinite(price) || price < 0) {
    throw new Error("Price must be a valid non-negative number.");
  }
  if (salePrice != null && (!Number.isFinite(salePrice) || salePrice < 0)) {
    throw new Error("Sale price must be a valid non-negative number.");
  }
  if (salePrice != null && salePrice >= price) {
    throw new Error("Sale price must be lower than the regular price.");
  }
  if (stock < 0) throw new Error("Stock cannot be negative.");

  return {
    name,
    slug,
    brand,
    category,
    description,
    keyInfo,
    price,
    salePrice,
    stock,
    sku,
    featured,
    prescriptionRequired,
    imageUrl,
  };
}

/**
 * Uploads a new product photo to the `product-images` Storage bucket, if
 * the admin selected a file. Returns null (no-op) when the file input was
 * left empty — browsers still submit an empty File entry in that case, so
 * this checks `size === 0` rather than just truthiness.
 */
async function uploadImageIfProvided(
  supabase: Awaited<ReturnType<typeof createClient>>,
  file: File | null,
  slug: string
): Promise<string | null> {
  if (!file || file.size === 0) return null;

  const extension = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const path = `${slug}-${Date.now()}.${extension}`;

  const { error } = await supabase.storage.from("product-images").upload(path, file, {
    cacheControl: "3600",
    upsert: false,
  });
  if (error) throw new Error(`Photo upload failed: ${error.message}`);

  const { data } = supabase.storage.from("product-images").getPublicUrl(path);
  return data.publicUrl;
}

function friendlyDbError(message: string): string {
  if (message.includes("products_slug_key")) {
    return "A product with that URL slug already exists — choose a different name or slug.";
  }
  if (message.includes("products_category_fkey")) {
    return "That category doesn't exist. Pick one from the dropdown.";
  }
  return `Could not save product: ${message}`;
}

export async function createProduct(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Your session expired — please sign in again." };

  let fields: ParsedFields;
  try {
    fields = parseProductFields(formData);
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Invalid input." };
  }

  let uploadedUrl: string | null;
  try {
    uploadedUrl = await uploadImageIfProvided(
      supabase,
      formData.get("imageFile") as File | null,
      fields.slug
    );
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Photo upload failed." };
  }

  const image = uploadedUrl || fields.imageUrl || "/images/products/placeholder.svg";

  const { error } = await supabase.from("products").insert({
    name: fields.name,
    slug: fields.slug,
    brand: fields.brand,
    category: fields.category,
    description: fields.description,
    key_info: fields.keyInfo,
    price: fields.price,
    sale_price: fields.salePrice,
    image,
    stock: fields.stock,
    sku: fields.sku,
    featured: fields.featured,
    prescription_required: fields.prescriptionRequired,
    is_demo: false,
  });
  if (error) return { error: friendlyDbError(error.message) };

  revalidatePath("/admin/products");
  revalidatePath("/shop");
  revalidatePath("/");
  redirect("/admin/products");
}

export async function updateProduct(
  id: number,
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Your session expired — please sign in again." };

  let fields: ParsedFields;
  try {
    fields = parseProductFields(formData);
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Invalid input." };
  }

  let uploadedUrl: string | null;
  try {
    uploadedUrl = await uploadImageIfProvided(
      supabase,
      formData.get("imageFile") as File | null,
      fields.slug
    );
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Photo upload failed." };
  }

  const updatePayload: Record<string, unknown> = {
    name: fields.name,
    slug: fields.slug,
    brand: fields.brand,
    category: fields.category,
    description: fields.description,
    key_info: fields.keyInfo,
    price: fields.price,
    sale_price: fields.salePrice,
    stock: fields.stock,
    sku: fields.sku,
    featured: fields.featured,
    prescription_required: fields.prescriptionRequired,
  };
  if (uploadedUrl) {
    updatePayload.image = uploadedUrl;
  } else if (fields.imageUrl) {
    updatePayload.image = fields.imageUrl;
  }

  const { error } = await supabase.from("products").update(updatePayload).eq("id", id);
  if (error) return { error: friendlyDbError(error.message) };

  revalidatePath("/admin/products");
  revalidatePath(`/products/${fields.slug}`);
  revalidatePath("/shop");
  revalidatePath("/");
  redirect("/admin/products");
}

export async function deleteProduct(id: number): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Your session expired — please sign in again.");

  const { error } = await supabase.from("products").delete().eq("id", id);
  if (error) throw new Error(`Could not delete product: ${error.message}`);

  revalidatePath("/admin/products");
  revalidatePath("/shop");
  revalidatePath("/");
}
