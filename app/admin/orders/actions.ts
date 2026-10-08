"use server";

import { revalidatePath } from "next/cache";
import { requireAdminAction } from "@/lib/admin-auth";
import { isOrderStatus } from "@/lib/orders";

export interface OrderActionState {
  error: string | null;
  success: string | null;
}

const UUID_RE = /^[0-9a-f-]{36}$/i;

function friendlyError(message: string): string {
  if (message.includes("status_unchanged")) return "The order already has that status.";
  if (message.includes("invalid_status_for_pickup")) return "Pickup orders can't be marked out for delivery.";
  if (message.includes("invalid_status_for_delivery")) return "Delivery orders can't be marked ready for pickup.";
  if (message.includes("not_authorized")) return "You don't have permission to update orders.";
  if (message.includes("order_not_found")) return "That order no longer exists.";
  return "Could not save the change. Please try again.";
}

/**
 * Moves an order to a new status. The set_order_status() database function
 * re-checks that the caller is staff and writes the history row, so the
 * audit trail is kept even if this action were bypassed.
 */
export async function updateOrderStatus(
  _prev: OrderActionState,
  formData: FormData
): Promise<OrderActionState> {
  const auth = await requireAdminAction();
  if (!auth.supabase) return { error: auth.error ?? "You are not signed in.", success: null };

  const orderId = String(formData.get("orderId") ?? "");
  const status = String(formData.get("status") ?? "");
  const note = String(formData.get("note") ?? "").trim().slice(0, 500);
  if (!UUID_RE.test(orderId) || !isOrderStatus(status)) {
    return { error: "Invalid request.", success: null };
  }

  const { error } = await auth.supabase.rpc("set_order_status", {
    p_order_id: orderId,
    p_status: status,
    p_note: note || null,
  });
  if (error) {
    console.error("[admin] set_order_status failed:", error.message);
    return { error: friendlyError(error.message), success: null };
  }

  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${orderId}`);
  revalidatePath("/admin");
  return { error: null, success: "Status updated." };
}

export async function saveInternalNotes(
  _prev: OrderActionState,
  formData: FormData
): Promise<OrderActionState> {
  const auth = await requireAdminAction();
  if (!auth.supabase) return { error: auth.error ?? "You are not signed in.", success: null };

  const orderId = String(formData.get("orderId") ?? "");
  const notes = String(formData.get("notes") ?? "").trim().slice(0, 2000);
  if (!UUID_RE.test(orderId)) return { error: "Invalid request.", success: null };

  const { error } = await auth.supabase.rpc("set_order_internal_notes", {
    p_order_id: orderId,
    p_notes: notes,
  });
  if (error) {
    console.error("[admin] set_order_internal_notes failed:", error.message);
    return { error: friendlyError(error.message), success: null };
  }

  revalidatePath(`/admin/orders/${orderId}`);
  return { error: null, success: "Notes saved." };
}
