import { revalidatePath, revalidateTag } from "next/cache";
import { CATALOG_TAG } from "@/lib/supabase";
import type { createClient } from "@/lib/supabase-server";

type ServerSupabase = Awaited<ReturnType<typeof createClient>>;

export const PRODUCT_IMAGES_BUCKET = "product-images";

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-+|-+$)/g, "");
}

/** Purges cached storefront data after any admin change. */
export function refreshStorefront(): void {
  revalidateTag(CATALOG_TAG);
  revalidatePath("/", "layout");
}

/**
 * Deletes a photo from Supabase Storage if the URL points at our bucket.
 * Failures are logged, not thrown: a leftover file is harmless, but a failed
 * save because of it would not be.
 */
export async function removeStoredImage(supabase: ServerSupabase, url: string | null | undefined) {
  if (!url) return;
  const marker = `/storage/v1/object/public/${PRODUCT_IMAGES_BUCKET}/`;
  const index = url.indexOf(marker);
  if (index === -1) return;
  const path = decodeURIComponent(url.slice(index + marker.length));
  const { error } = await supabase.storage.from(PRODUCT_IMAGES_BUCKET).remove([path]);
  if (error) console.error("[admin] Could not delete old image:", error.message);
}
