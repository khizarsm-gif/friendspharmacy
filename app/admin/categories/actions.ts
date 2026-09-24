"use server";

import { redirect } from "next/navigation";
import { requireOwnerAction } from "@/lib/admin-auth";
import { refreshStorefront, slugify } from "@/lib/admin-utils";
import { CATEGORY_ICON_NAMES } from "@/lib/category-icons";

export interface CategoryActionState {
  error: string | null;
}

function parseCategory(formData: FormData) {
  const text = (key: string) => String(formData.get(key) ?? "").trim();
  const name = text("name");
  const slug = slugify(text("slug") || name);
  const icon = text("icon");
  const description = text("description");
  const sortOrder = Number(text("sortOrder") || 0);

  if (!name) throw new Error("Category name is required.");
  if (!slug) throw new Error("Couldn't generate a URL slug. Check the name.");
  if (!description) throw new Error("A short description is required.");
  if (!CATEGORY_ICON_NAMES.includes(icon)) throw new Error("Pick an icon.");
  if (!Number.isInteger(sortOrder)) throw new Error("Display order must be a whole number.");

  return { slug, name, icon, description, sort_order: sortOrder };
}

function friendlyError(message: string): string {
  if (message.includes("categories_pkey") || message.includes("duplicate key")) {
    return "A category with that slug already exists.";
  }
  if (message.includes("row-level security")) return "This account isn't allowed to change categories.";
  return `Could not save category: ${message}`;
}

export async function createCategory(
  _prev: CategoryActionState,
  formData: FormData
): Promise<CategoryActionState> {
  const { supabase, error: authError } = await requireOwnerAction();
  if (!supabase) return { error: authError };

  let row;
  try {
    row = parseCategory(formData);
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Invalid input." };
  }

  const { error } = await supabase.from("categories").insert(row);
  if (error) {
    console.error("[admin] createCategory:", error.message);
    return { error: friendlyError(error.message) };
  }

  refreshStorefront();
  redirect("/admin/categories?saved=category-created");
}

export async function updateCategory(
  originalSlug: string,
  _prev: CategoryActionState,
  formData: FormData
): Promise<CategoryActionState> {
  const { supabase, error: authError } = await requireOwnerAction();
  if (!supabase) return { error: authError };

  let row;
  try {
    row = parseCategory(formData);
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Invalid input." };
  }

  // Renaming the slug cascades to products (ON UPDATE CASCADE on the FK).
  const { error } = await supabase.from("categories").update(row).eq("slug", originalSlug);
  if (error) {
    console.error("[admin] updateCategory:", error.message);
    return { error: friendlyError(error.message) };
  }

  refreshStorefront();
  redirect("/admin/categories?saved=category-updated");
}

export async function deleteCategory(slug: string): Promise<{ error: string | null }> {
  const { supabase, error: authError } = await requireOwnerAction();
  if (!supabase) return { error: authError };

  const { count, error: countError } = await supabase
    .from("products")
    .select("id", { count: "exact", head: true })
    .eq("category", slug);
  if (countError) return { error: `Could not check products: ${countError.message}` };
  if (count && count > 0) {
    return {
      error: `This category still has ${count} product${count === 1 ? "" : "s"}. Move or delete them first.`,
    };
  }

  const { error } = await supabase.from("categories").delete().eq("slug", slug);
  if (error) {
    console.error("[admin] deleteCategory:", error.message);
    return { error: `Could not delete category: ${error.message}` };
  }

  refreshStorefront();
  return { error: null };
}
