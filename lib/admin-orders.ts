import type { createClient } from "@/lib/supabase-server";
import { isOrderStatus, ORDER_STATUSES } from "@/lib/orders";
import type {
  DeliveryMethod,
  Order,
  OrderItem,
  OrderStatus,
  OrderStatusHistoryEntry,
  PaymentMethod,
} from "@/types";

type ServerSupabase = Awaited<ReturnType<typeof createClient>>;

interface OrderRow {
  id: string;
  order_number: string;
  status: string;
  customer_name: string;
  phone: string;
  whatsapp: string;
  email: string | null;
  delivery_method: string;
  payment_method: string;
  address: string | null;
  city: string | null;
  notes: string | null;
  internal_notes: string | null;
  subtotal: string | number;
  delivery_fee: string | number;
  total: string | number;
  created_at: string;
  updated_at: string;
}

function mapOrder(row: OrderRow): Order {
  return {
    id: row.id,
    orderNumber: row.order_number,
    status: isOrderStatus(row.status) ? row.status : "new",
    customerName: row.customer_name,
    phone: row.phone,
    whatsapp: row.whatsapp,
    email: row.email,
    deliveryMethod: row.delivery_method as DeliveryMethod,
    paymentMethod: row.payment_method as PaymentMethod,
    address: row.address,
    city: row.city,
    notes: row.notes,
    internalNotes: row.internal_notes,
    subtotal: Number(row.subtotal),
    deliveryFee: Number(row.delivery_fee),
    total: Number(row.total),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export const ORDERS_PAGE_LIMIT = 100;

/** Removes characters that would break a PostgREST `or(...)` filter value. */
function sanitizeSearch(q: string): string {
  return q.replace(/[,()*%\\]/g, " ").trim().slice(0, 60);
}

export async function adminListOrders(
  supabase: ServerSupabase,
  opts: { status?: string; q?: string } = {}
): Promise<Order[]> {
  let query = supabase
    .from("orders")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(ORDERS_PAGE_LIMIT);

  if (opts.status && isOrderStatus(opts.status)) query = query.eq("status", opts.status);

  const q = sanitizeSearch(opts.q ?? "");
  if (q) {
    query = query.or(`order_number.ilike.%${q}%,customer_name.ilike.%${q}%,phone.ilike.%${q}%`);
  }

  const { data, error } = await query;
  if (error) throw new Error(`Could not load orders: ${error.message}`);
  return (data as OrderRow[]).map(mapOrder);
}

/** Order counts per status (plus "all"), for the filter tabs and dashboard. */
export async function adminOrderCounts(
  supabase: ServerSupabase
): Promise<Record<OrderStatus | "all", number>> {
  const entries = await Promise.all(
    ORDER_STATUSES.map(async (status) => {
      const { count, error } = await supabase
        .from("orders")
        .select("id", { count: "exact", head: true })
        .eq("status", status);
      if (error) throw new Error(`Could not count orders: ${error.message}`);
      return [status, count ?? 0] as const;
    })
  );
  const counts = Object.fromEntries(entries) as Record<OrderStatus, number>;
  const all = entries.reduce((sum, [, n]) => sum + n, 0);
  return { ...counts, all };
}

export async function adminGetOrder(
  supabase: ServerSupabase,
  id: string
): Promise<{ order: Order; items: OrderItem[]; history: OrderStatusHistoryEntry[] } | null> {
  // Order ids are UUIDs; reject anything else before querying.
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;

  const { data: row, error } = await supabase.from("orders").select("*").eq("id", id).maybeSingle();
  if (error) throw new Error(`Could not load order: ${error.message}`);
  if (!row) return null;

  const [itemsRes, historyRes] = await Promise.all([
    supabase.from("order_items").select("*").eq("order_id", id).order("id", { ascending: true }),
    supabase
      .from("order_status_history")
      .select("*")
      .eq("order_id", id)
      .order("created_at", { ascending: true }),
  ]);
  if (itemsRes.error) throw new Error(`Could not load order items: ${itemsRes.error.message}`);
  if (historyRes.error) throw new Error(`Could not load order history: ${historyRes.error.message}`);

  return {
    order: mapOrder(row as OrderRow),
    items: (itemsRes.data ?? []).map((i) => ({
      id: i.id,
      productId: i.product_id,
      productName: i.product_name,
      sku: i.sku,
      unitPrice: Number(i.unit_price),
      quantity: i.quantity,
      lineTotal: Number(i.line_total),
    })),
    history: (historyRes.data ?? []).map((h) => ({
      id: h.id,
      fromStatus: isOrderStatus(h.from_status) ? h.from_status : null,
      toStatus: (isOrderStatus(h.to_status) ? h.to_status : "new") as OrderStatus,
      note: h.note,
      createdAt: h.created_at,
    })),
  };
}

/** Number of orders still in "new" status. Returns null if orders aren't set up yet. */
export async function adminNewOrderCount(supabase: ServerSupabase): Promise<number | null> {
  const { count, error } = await supabase
    .from("orders")
    .select("id", { count: "exact", head: true })
    .eq("status", "new");
  if (error) {
    console.error("[admin] could not count new orders:", error.message);
    return null;
  }
  return count ?? 0;
}
