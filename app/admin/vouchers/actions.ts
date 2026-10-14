"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireOwnerAction } from "@/lib/admin-auth";

export interface VoucherActionState {
  error: string | null;
}

const CODE_RE = /^[A-Z0-9-]{4,30}$/;

function parseVoucher(formData: FormData) {
  const text = (key: string) => String(formData.get(key) ?? "").trim();
  const code = text("code").toUpperCase();
  const customerName = text("customerName");
  const percent = Number(text("discountPercent"));
  const categories = Array.from(new Set(formData.getAll("category").map((c) => String(c)).filter(Boolean)));
  const expiresOn = text("expiresOn");

  if (!customerName) throw new Error("Enter the customer's name so you can recognize this code later.");
  if (customerName.length > 120) throw new Error("The customer name is too long (120 characters max).");
  if (!CODE_RE.test(code)) {
    throw new Error("The code must be 4 to 30 characters: letters, numbers and dashes only (for example AHMED-7K3Q).");
  }
  if (!Number.isInteger(percent) || percent < 1 || percent > 100) {
    throw new Error("The discount must be a whole number from 1 to 100.");
  }
  if (categories.length === 0) throw new Error("Pick at least one category the discount applies to.");
  if (expiresOn && !/^\d{4}-\d{2}-\d{2}$/.test(expiresOn)) throw new Error("Enter the expiry date as a valid date.");

  return {
    row: {
      code,
      customer_name: customerName,
      discount_percent: percent,
      exclude_sale_items: formData.get("excludeSaleItems") === "on",
      active: formData.get("active") === "on",
      expires_on: expiresOn || null,
    },
    categories,
  };
}

function friendlyError(message: string): string {
  if (message.includes("vouchers_code_key") || message.includes("duplicate key")) {
    return "Another voucher already uses that code. Pick a different one.";
  }
  if (message.includes("voucher_categories_category_slug_fkey")) return "One of the chosen categories no longer exists.";
  if (message.includes("row-level security")) return "Only an owner can change vouchers.";
  if (message.includes('relation "public.vouchers"') || message.includes("does not exist")) {
    return "Vouchers are not set up in the database yet. Ask the developer to apply the vouchers update first.";
  }
  return `Could not save the voucher: ${message}`;
}

export async function createVoucher(
  _prev: VoucherActionState,
  formData: FormData
): Promise<VoucherActionState> {
  const { supabase, error: authError } = await requireOwnerAction();
  if (!supabase) return { error: authError };

  let parsed;
  try {
    parsed = parseVoucher(formData);
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Invalid input." };
  }

  const { data, error } = await supabase.from("vouchers").insert(parsed.row).select("id").single();
  if (error || !data) {
    console.error("[admin] createVoucher:", error?.message);
    return { error: friendlyError(error?.message ?? "") };
  }

  const { error: catError } = await supabase
    .from("voucher_categories")
    .insert(parsed.categories.map((category_slug) => ({ voucher_id: data.id, category_slug })));
  if (catError) {
    // Don't leave a code behind that applies to nothing.
    console.error("[admin] createVoucher categories:", catError.message);
    await supabase.from("vouchers").delete().eq("id", data.id);
    return { error: friendlyError(catError.message) };
  }

  revalidatePath("/admin/vouchers");
  redirect("/admin/vouchers?saved=voucher-created");
}

export async function updateVoucher(
  id: number,
  _prev: VoucherActionState,
  formData: FormData
): Promise<VoucherActionState> {
  const { supabase, error: authError } = await requireOwnerAction();
  if (!supabase) return { error: authError };

  let parsed;
  try {
    parsed = parseVoucher(formData);
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Invalid input." };
  }

  const { error } = await supabase.from("vouchers").update(parsed.row).eq("id", id);
  if (error) {
    console.error("[admin] updateVoucher:", error.message);
    return { error: friendlyError(error.message) };
  }

  // Change only what differs, so a failure part-way never leaves the code with no categories.
  const { data: existing, error: readError } = await supabase
    .from("voucher_categories")
    .select("category_slug")
    .eq("voucher_id", id);
  if (readError) return { error: friendlyError(readError.message) };
  const current = new Set((existing ?? []).map((c) => c.category_slug as string));
  const wanted = new Set(parsed.categories);
  const toAdd = parsed.categories.filter((c) => !current.has(c));
  const toRemove = Array.from(current).filter((c) => !wanted.has(c));

  if (toAdd.length > 0) {
    const { error: addError } = await supabase
      .from("voucher_categories")
      .insert(toAdd.map((category_slug) => ({ voucher_id: id, category_slug })));
    if (addError) return { error: friendlyError(addError.message) };
  }
  if (toRemove.length > 0) {
    const { error: removeError } = await supabase
      .from("voucher_categories")
      .delete()
      .eq("voucher_id", id)
      .in("category_slug", toRemove);
    if (removeError) return { error: friendlyError(removeError.message) };
  }

  revalidatePath("/admin/vouchers");
  redirect("/admin/vouchers?saved=voucher-updated");
}

/** Quick switch on the list page: stops or restarts a code without losing it. */
export async function setVoucherActive(id: number, active: boolean): Promise<{ error: string | null }> {
  const { supabase, error: authError } = await requireOwnerAction();
  if (!supabase) return { error: authError };
  const { error } = await supabase.from("vouchers").update({ active }).eq("id", id);
  if (error) {
    console.error("[admin] setVoucherActive:", error.message);
    return { error: friendlyError(error.message) };
  }
  revalidatePath("/admin/vouchers");
  return { error: null };
}

export async function deleteVoucher(id: number): Promise<{ error: string | null }> {
  const { supabase, error: authError } = await requireOwnerAction();
  if (!supabase) return { error: authError };
  // Orders that used the code keep its text and discount; only the link is cleared.
  const { error } = await supabase.from("vouchers").delete().eq("id", id);
  if (error) {
    console.error("[admin] deleteVoucher:", error.message);
    return { error: friendlyError(error.message) };
  }
  revalidatePath("/admin/vouchers");
  return { error: null };
}
