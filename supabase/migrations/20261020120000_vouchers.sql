-- Discount vouchers for regular customers.
--
-- Review before applying: this changes the production database.
--  * public.vouchers            one row per code (for example one code per customer).
--  * public.voucher_categories  which product categories a code discounts (for example Medicines only).
--  * orders.voucher_code / discount_amount / voucher_id record what was applied to an order.
--  * create_order() gets an optional p_voucher_code. The discount is worked out
--    inside the database from the saved prices; the browser never sends an amount.
--  * Only owners can see or change vouchers (RLS). The public site checks a code
--    through the server (service role) only, so codes cannot be listed by customers.
--
-- Rules (agreed with the owner):
--  * Percent off the items whose category the code covers.
--  * Items currently on sale (a sale price below the normal price on the single
--    unit) are skipped when exclude_sale_items is true (the default).
--  * Delivery fee and the free delivery threshold use the amount after the discount.
--  * Codes work any number of times until switched off or past their expiry date.
--
-- Safe to run once. Existing orders, products and prices are unaffected, and the
-- previous website code keeps working because the old create_order() stays in place.

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------
create table if not exists public.vouchers (
  id bigint generated always as identity primary key,
  code text not null unique check (code ~ '^[A-Z0-9-]{4,30}$'),
  customer_name text not null check (char_length(btrim(customer_name)) between 1 and 120),
  discount_percent integer not null check (discount_percent between 1 and 100),
  exclude_sale_items boolean not null default true,
  active boolean not null default true,
  expires_on date,
  created_at timestamptz not null default now()
);

create table if not exists public.voucher_categories (
  voucher_id bigint not null references public.vouchers (id) on delete cascade,
  category_slug text not null references public.categories (slug) on update cascade on delete cascade,
  primary key (voucher_id, category_slug)
);

alter table public.vouchers enable row level security;
alter table public.voucher_categories enable row level security;
revoke all on public.vouchers, public.voucher_categories from anon, authenticated;
grant select, insert, update, delete on public.vouchers, public.voucher_categories to authenticated;

drop policy if exists "Owners manage vouchers" on public.vouchers;
create policy "Owners manage vouchers" on public.vouchers
  for all to authenticated
  using ((select public.is_owner())) with check ((select public.is_owner()));

drop policy if exists "Owners manage voucher categories" on public.voucher_categories;
create policy "Owners manage voucher categories" on public.voucher_categories
  for all to authenticated
  using ((select public.is_owner())) with check ((select public.is_owner()));

alter table public.orders
  add column if not exists voucher_id bigint references public.vouchers (id) on delete set null,
  add column if not exists voucher_code text,
  add column if not exists discount_amount numeric(10, 2) not null default 0 check (discount_amount >= 0);
create index if not exists orders_voucher_idx on public.orders (voucher_id) where voucher_id is not null;

-- ---------------------------------------------------------------------------
-- price_cart: the one place that prices a cart from the catalog.
-- p_items: [{"product_id": 1, "option_label": "", "quantity": 2}, ...]
-- Returns a JSON array of priced lines. Raises the same errors create_order always did.
-- ---------------------------------------------------------------------------
create or replace function public.price_cart(p_items jsonb) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  v_item record;
  v_product record;
  v_option jsonb;
  v_option_label text;
  v_unit_price numeric(10, 2);
  v_is_sale boolean;
  v_lines jsonb := '[]'::jsonb;
begin
  -- Merge duplicate (product, pack option) pairs, then price each line from the catalog.
  -- An empty option_label means the product's base unit (for example a single tablet).
  for v_item in
    select (e ->> 'product_id')::bigint as product_id,
           coalesce(nullif(btrim(e ->> 'option_label'), ''), '') as option_label,
           sum((e ->> 'quantity')::integer) as quantity
    from jsonb_array_elements(p_items) as e
    group by 1, 2
    order by 1, 2
  loop
    if v_item.quantity < 1 or v_item.quantity > 99 then
      raise exception 'invalid_quantity';
    end if;

    select id, name, sku, category, price, sale_price, stock, prescription_required, unit_label, pack_options
      into v_product
      from public.products where id = v_item.product_id;

    if not found then
      raise exception 'unknown_product';
    end if;
    if v_product.prescription_required then
      raise exception 'prescription_required:%', v_product.name;
    end if;
    -- Stock is not tracked per order. A stock of 0 means "out of stock" and
    -- blocks new orders; any other number only means "available".
    if v_product.stock <= 0 then
      raise exception 'out_of_stock:%', v_product.name;
    end if;

    v_option := null;
    v_is_sale := false;
    if v_item.option_label = '' then
      -- Base unit: the product's own price (sale-aware).
      v_option_label := nullif(v_product.unit_label, '');
      v_is_sale := v_product.sale_price is not null and v_product.sale_price > 0 and v_product.sale_price < v_product.price;
      v_unit_price := case when v_is_sale then v_product.sale_price else v_product.price end;
    else
      -- Pack option: price comes from the product's pack_options list, never from the browser.
      select e.value into v_option
        from jsonb_array_elements(v_product.pack_options) as e
        where e.value ->> 'label' = v_item.option_label
        limit 1;
      if v_option is null then
        raise exception 'unknown_option:%', v_product.name;
      end if;
      v_option_label := v_item.option_label;
      v_unit_price := (v_option ->> 'price')::numeric;
    end if;

    v_lines := v_lines || jsonb_build_object(
      'product_id', v_product.id,
      'name', v_product.name,
      'sku', v_product.sku,
      'category', v_product.category,
      'option_label', v_option_label,
      'unit_price', v_unit_price,
      'quantity', v_item.quantity,
      'line_total', v_unit_price * v_item.quantity,
      'is_sale', v_is_sale
    );
  end loop;

  return v_lines;
end;
$$;

-- ---------------------------------------------------------------------------
-- apply_voucher_to_lines: looks up a code and works out the discount on priced lines.
-- Never reveals why a code failed beyond "invalid" or "not_applicable" (valid code,
-- but nothing in the cart qualifies), so codes cannot be probed for status.
-- ---------------------------------------------------------------------------
create or replace function public.apply_voucher_to_lines(p_code text, p_lines jsonb) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  v_code text := upper(btrim(coalesce(p_code, '')));
  v public.vouchers%rowtype;
  v_eligible numeric(10, 2);
begin
  select * into v from public.vouchers
    where code = v_code
      and active
      and (expires_on is null or expires_on >= (now() at time zone 'Asia/Karachi')::date);
  if not found then
    return jsonb_build_object('valid', false, 'reason', 'invalid');
  end if;

  select coalesce(sum((l ->> 'line_total')::numeric), 0) into v_eligible
    from jsonb_array_elements(p_lines) as l
    where (l ->> 'category') in (select vc.category_slug from public.voucher_categories vc where vc.voucher_id = v.id)
      and not (v.exclude_sale_items and (l ->> 'is_sale')::boolean);

  if v_eligible <= 0 then
    return jsonb_build_object('valid', false, 'reason', 'not_applicable');
  end if;

  return jsonb_build_object(
    'valid', true,
    'voucher_id', v.id,
    'code', v.code,
    'percent', v.discount_percent,
    'eligible_subtotal', v_eligible,
    'discount', round(v_eligible * v.discount_percent / 100.0, 2)
  );
end;
$$;

-- Used by the checkout page to show the discount before the order is placed.
create or replace function public.preview_voucher(p_code text, p_items jsonb) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  v_lines jsonb;
  v_result jsonb;
  v_subtotal numeric(10, 2);
begin
  if p_items is null or jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) not between 1 and 50 then
    raise exception 'empty_order';
  end if;
  v_lines := public.price_cart(p_items);
  v_result := public.apply_voucher_to_lines(p_code, v_lines);
  select coalesce(sum((l ->> 'line_total')::numeric), 0) into v_subtotal from jsonb_array_elements(v_lines) as l;
  return v_result || jsonb_build_object('subtotal', v_subtotal);
end;
$$;

-- ---------------------------------------------------------------------------
-- create_order: a new 13-argument version that takes the voucher code (null = none).
-- The old 12-argument version is deliberately left in place, so the website keeps
-- working while this is rolled out. The new parameter has no default, so a call
-- with 12 arguments can only reach the old function and a call with 13 only the new one.
-- Once the new website code is live the old one is unused and can be removed:
--   drop function public.create_order(text, text, text, text, text, text, text, text, text, numeric, numeric, jsonb);
-- ---------------------------------------------------------------------------

create or replace function public.create_order(
  p_customer_name text,
  p_phone text,
  p_whatsapp text,
  p_email text,
  p_delivery_method text,
  p_payment_method text,
  p_address text,
  p_city text,
  p_notes text,
  p_delivery_fee numeric,
  p_free_delivery_threshold numeric,
  p_items jsonb,
  p_voucher_code text
) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  v_line jsonb;
  v_priced jsonb;
  v_voucher jsonb;
  v_subtotal numeric(10, 2);
  v_discount numeric(10, 2) := 0;
  v_voucher_id bigint;
  v_voucher_code text;
  v_fee numeric(10, 2);
  v_order_id uuid;
  v_order_number text;
  v_lines jsonb := '[]'::jsonb;
  v_item_count integer;
begin
  if p_delivery_method not in ('delivery', 'pickup') then
    raise exception 'invalid_delivery_method';
  end if;
  if p_payment_method not in ('cod', 'pay-at-pharmacy') then
    raise exception 'invalid_payment_method';
  end if;
  if p_items is null or jsonb_typeof(p_items) <> 'array' then
    raise exception 'empty_order';
  end if;
  v_item_count := jsonb_array_length(p_items);
  if v_item_count < 1 or v_item_count > 50 then
    raise exception 'invalid_item_count';
  end if;

  -- Simple abuse guard: at most 5 orders per phone number per hour.
  if (select count(*) from public.orders
        where phone = p_phone and created_at > now() - interval '1 hour') >= 5 then
    raise exception 'rate_limited';
  end if;

  -- Price every line from the catalog (raises on unknown product, option, stock 0, prescription).
  v_priced := public.price_cart(p_items);
  select coalesce(sum((l ->> 'line_total')::numeric), 0) into v_subtotal from jsonb_array_elements(v_priced) as l;

  -- Optional voucher. A bad code fails the order so the customer is never charged
  -- a different amount than the one they saw.
  if nullif(btrim(coalesce(p_voucher_code, '')), '') is not null then
    v_voucher := public.apply_voucher_to_lines(p_voucher_code, v_priced);
    if not (v_voucher ->> 'valid')::boolean then
      if v_voucher ->> 'reason' = 'not_applicable' then
        raise exception 'voucher_not_applicable';
      end if;
      raise exception 'invalid_voucher';
    end if;
    v_discount := (v_voucher ->> 'discount')::numeric;
    v_voucher_id := (v_voucher ->> 'voucher_id')::bigint;
    v_voucher_code := v_voucher ->> 'code';
  end if;

  -- Delivery is free once the amount payable for goods (after any discount) reaches the threshold.
  v_fee := case
    when p_delivery_method = 'pickup' then 0
    when v_subtotal - v_discount >= p_free_delivery_threshold then 0
    else p_delivery_fee
  end;

  v_order_id := gen_random_uuid();

  insert into public.orders (
    id, customer_name, phone, whatsapp, email, delivery_method, payment_method,
    address, city, notes, subtotal, delivery_fee, total,
    voucher_id, voucher_code, discount_amount
  ) values (
    v_order_id, p_customer_name, p_phone, p_whatsapp, nullif(p_email, ''), p_delivery_method, p_payment_method,
    case when p_delivery_method = 'delivery' then nullif(p_address, '') end,
    case when p_delivery_method = 'delivery' then nullif(p_city, '') end,
    nullif(p_notes, ''), v_subtotal, v_fee, v_subtotal - v_discount + v_fee,
    v_voucher_id, v_voucher_code, v_discount
  ) returning order_number into v_order_number;

  for v_line in select * from jsonb_array_elements(v_priced) loop
    insert into public.order_items (order_id, product_id, product_name, option_label, sku, unit_price, quantity, line_total)
    values (
      v_order_id,
      (v_line ->> 'product_id')::bigint,
      v_line ->> 'name',
      v_line ->> 'option_label',
      v_line ->> 'sku',
      (v_line ->> 'unit_price')::numeric,
      (v_line ->> 'quantity')::integer,
      (v_line ->> 'line_total')::numeric
    );
    v_lines := v_lines || jsonb_build_object(
      'name', v_line ->> 'name',
      'option_label', v_line -> 'option_label',
      'quantity', (v_line ->> 'quantity')::integer,
      'unit_price', (v_line ->> 'unit_price')::numeric,
      'line_total', (v_line ->> 'line_total')::numeric
    );
  end loop;

  insert into public.order_status_history (order_id, from_status, to_status, note)
  values (v_order_id, null, 'new', 'Order placed on the website');

  return jsonb_build_object(
    'order_id', v_order_id,
    'order_number', v_order_number,
    'subtotal', v_subtotal,
    'discount', v_discount,
    'voucher_code', v_voucher_code,
    'delivery_fee', v_fee,
    'total', v_subtotal - v_discount + v_fee,
    'items', v_lines
  );
end;
$$;

-- ---------------------------------------------------------------------------
-- voucher_usage: how many orders used each code (cancelled orders ignored). Owners only.
-- ---------------------------------------------------------------------------
create or replace function public.voucher_usage()
returns table (voucher_id bigint, orders_count bigint, discount_total numeric)
language plpgsql stable security definer set search_path = '' as $$
begin
  if not (select public.is_owner()) then
    raise exception 'not_allowed';
  end if;
  return query
    select o.voucher_id, count(*)::bigint, coalesce(sum(o.discount_amount), 0)
    from public.orders o
    where o.voucher_id is not null and o.status <> 'cancelled'
    group by o.voucher_id;
end;
$$;

-- Internal functions: server (service role) only. voucher_usage is for signed-in owners.
revoke execute on function public.price_cart(jsonb) from public, anon, authenticated;
revoke execute on function public.apply_voucher_to_lines(text, jsonb) from public, anon, authenticated;
revoke execute on function public.preview_voucher(text, jsonb) from public, anon, authenticated;
revoke execute on function public.create_order(text, text, text, text, text, text, text, text, text, numeric, numeric, jsonb, text)
  from public, anon, authenticated;
revoke execute on function public.voucher_usage() from public, anon;
grant execute on function public.price_cart(jsonb) to service_role;
grant execute on function public.apply_voucher_to_lines(text, jsonb) to service_role;
grant execute on function public.preview_voucher(text, jsonb) to service_role;
grant execute on function public.create_order(text, text, text, text, text, text, text, text, text, numeric, numeric, jsonb, text)
  to service_role;
grant execute on function public.voucher_usage() to authenticated;

-- Make the API pick up the changed function signatures right away.
notify pgrst, 'reload schema';
