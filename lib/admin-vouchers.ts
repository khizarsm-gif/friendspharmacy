import type { createClient } from "@/lib/supabase-server";

type ServerSupabase = Awaited<ReturnType<typeof createClient>>;

export interface AdminVoucher {
  id: number;
  code: string;
  customerName: string;
  discountPercent: number;
  excludeSaleItems: boolean;
  active: boolean;
  /** Last day the code works, as YYYY-MM-DD (Pakistan time), or null for no expiry. */
  expiresOn: string | null;
  categories: string[];
  createdAt: string;
  ordersCount: number;
  discountTotal: number;
}

interface VoucherRow {
  id: number;
  code: string;
  customer_name: string;
  discount_percent: number;
  exclude_sale_items: boolean;
  active: boolean;
  expires_on: string | null;
  created_at: string;
  voucher_categories: { category_slug: string }[] | null;
}

const COLUMNS =
  "id, code, customer_name, discount_percent, exclude_sale_items, active, expires_on, created_at, voucher_categories(category_slug)";

function mapVoucher(row: VoucherRow, usage?: { orders: number; discount: number }): AdminVoucher {
  return {
    id: row.id,
    code: row.code,
    customerName: row.customer_name,
    discountPercent: row.discount_percent,
    excludeSaleItems: row.exclude_sale_items,
    active: row.active,
    expiresOn: row.expires_on,
    categories: (row.voucher_categories ?? []).map((c) => c.category_slug),
    createdAt: row.created_at,
    ordersCount: usage?.orders ?? 0,
    discountTotal: usage?.discount ?? 0,
  };
}

/** Today's date in the pharmacy's time zone, as YYYY-MM-DD. */
export function todayInPakistan(): string {
  return new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Karachi" });
}

export function voucherStatus(v: Pick<AdminVoucher, "active" | "expiresOn">): "active" | "off" | "expired" {
  if (!v.active) return "off";
  if (v.expiresOn && v.expiresOn < todayInPakistan()) return "expired";
  return "active";
}

export async function adminListVouchers(supabase: ServerSupabase): Promise<AdminVoucher[]> {
  const [vouchersRes, usageRes] = await Promise.all([
    supabase.from("vouchers").select(COLUMNS).order("created_at", { ascending: false }),
    supabase.rpc("voucher_usage"),
  ]);
  if (vouchersRes.error) throw new Error(`Could not load vouchers: ${vouchersRes.error.message}`);
  // Usage counts are a nice extra: if they can't load, still show the list.
  if (usageRes.error) console.error("[admin] voucher_usage failed:", usageRes.error.message);
  const usage = new Map<number, { orders: number; discount: number }>();
  for (const u of (usageRes.data ?? []) as { voucher_id: number; orders_count: number; discount_total: number }[]) {
    usage.set(u.voucher_id, { orders: Number(u.orders_count), discount: Number(u.discount_total) });
  }
  return (vouchersRes.data as unknown as VoucherRow[]).map((r) => mapVoucher(r, usage.get(r.id)));
}

export async function adminGetVoucher(supabase: ServerSupabase, id: number): Promise<AdminVoucher | null> {
  const { data, error } = await supabase.from("vouchers").select(COLUMNS).eq("id", id).maybeSingle();
  if (error) throw new Error(`Could not load voucher: ${error.message}`);
  return data ? mapVoucher(data as unknown as VoucherRow) : null;
}
