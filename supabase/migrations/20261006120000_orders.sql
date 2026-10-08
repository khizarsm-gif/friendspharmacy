-- Applied to the Friends Pharmacy Supabase project on 2026-10-08.
--
-- Orders: customer orders placed at checkout, tracked by staff in the admin portal.
--
-- Design notes
--  * The public site never writes to these tables directly. Checkout calls the
--    create_order() function through the server-side service role key, so the
--    anon/authenticated roles have no insert access at all.
--  * Prices are read from public.products inside create_order(); client-sent
--    prices are never trusted.
--  * Product stock is NOT modified (by request). create_order() only checks
--    that enough stock is listed, so an order cannot exceed what the catalog shows.
--  * Staff (public.is_admin(): owners and purchasers) can read orders. Status
--    and internal-note changes go through set_order_status() and
--    set_order_internal_notes(), which also write the status history, so the
--    audit trail cannot be skipped.
--  * Orders contain customer personal data (name, phone, address). RLS is
--    enabled and there are no public policies.

create sequence if not exists public.order_number_seq start 1001;

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  order_number text not null unique default ('FP-' || nextval('public.order_number_seq')::text),
  status text not null default 'new'
    check (status in ('new', 'confirmed', 'out_for_delivery', 'ready_for_pickup', 'completed', 'cancelled')),
  customer_name text not null check (char_length(customer_name) between 1 and 120),
  phone text not null check (char_length(phone) between 5 and 30),
  whatsapp text not null check (char_length(whatsapp) between 5 and 30),
  email text check (email is null or char_length(email) <= 254),
  delivery_method text not null check (delivery_method in ('delivery', 'pickup')),
  payment_method text not null check (payment_method in ('cod', 'pay-at-pharmacy')),
  address text check (address is null or char_length(address) <= 500),
  city text check (city is null or char_length(city) <= 100),
  notes text check (notes is null or char_length(notes) <= 1000),
  internal_notes text check (internal_notes is null or char_length(internal_notes) <= 2000),
  subtotal numeric(10, 2) not null check (subtotal >= 0),
  delivery_fee numeric(10, 2) not null check (delivery_fee >= 0),
  total numeric(10, 2) not null check (total >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists orders_status_created_idx on public.orders (status, created_at desc);
create index if not exists orders_created_idx on public.orders (created_at desc);
create index if not exists orders_phone_created_idx on public.orders (phone, created_at desc);

-- Line items keep a snapshot of name, SKU and price at the time of the order,
-- so later catalog edits never rewrite order history.
create table if not exists public.order_items (
  id bigint generated always as identity primary key,
  order_id uuid not null references public.orders (id) on delete cascade,
  product_id bigint references public.products (id) on delete set null,
  product_name text not null,
  sku text,
  unit_price numeric(10, 2) not null check (unit_price >= 0),
  quantity integer not null check (quantity between 1 and 99),
  line_total numeric(10, 2) not null check (line_total >= 0)
);
create index if not exists order_items_order_idx on public.order_items (order_id);

create table if not exists public.order_status_history (
  id bigint generated always as identity primary key,
  order_id uuid not null references public.orders (id) on delete cascade,
  from_status text,
  to_status text not null,
  changed_by uuid references auth.users (id) on delete set null,
  note text check (note is null or char_length(note) <= 500),
  created_at timestamptz not null default now()
);
create index if not exists order_status_history_order_idx on public.order_status_history (order_id, created_at);

alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.order_status_history enable row level security;

-- Defense in depth: no direct table access for public roles beyond staff reads.
revoke all on public.orders, public.order_items, public.order_status_history from anon, authenticated;
grant select on public.orders, public.order_items, public.order_status_history to authenticated;

create policy "Staff can read orders" on public.orders
  for select to authenticated using ((select public.is_admin()));
create policy "Staff can read order items" on public.order_items
  for select to authenticated using ((select public.is_admin()));
create policy "Staff can read order status history" on public.order_status_history
  for select to authenticated using ((select public.is_admin()));

-- ---------------------------------------------------------------------------
-- create_order: called only by the Next.js server (service role).
-- p_items is a JSON array of {"product_id": <int>, "quantity": <int>}.
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
  p_items jsonb
) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  v_item record;
  v_product record;
  v_unit_price numeric(10, 2);
  v_subtotal numeric(10, 2) := 0;
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

  v_order_id := gen_random_uuid();

  -- Insert the order first with zero totals; totals are filled in after the
  -- authoritative prices are read from public.products (same transaction).
  insert into public.orders (
    id, customer_name, phone, whatsapp, email, delivery_method, payment_method,
    address, city, notes, subtotal, delivery_fee, total
  ) values (
    v_order_id, p_customer_name, p_phone, p_whatsapp, nullif(p_email, ''), p_delivery_method, p_payment_method,
    case when p_delivery_method = 'delivery' then nullif(p_address, '') end,
    case when p_delivery_method = 'delivery' then nullif(p_city, '') end,
    nullif(p_notes, ''), 0, 0, 0
  ) returning order_number into v_order_number;

  -- Merge duplicate product ids, then price each line from the catalog.
  for v_item in
    select (e ->> 'product_id')::bigint as product_id, sum((e ->> 'quantity')::integer) as quantity
    from jsonb_array_elements(p_items) as e
    group by 1
  loop
    if v_item.quantity < 1 or v_item.quantity > 99 then
      raise exception 'invalid_quantity';
    end if;

    select id, name, sku, price, sale_price, stock, prescription_required
      into v_product
      from public.products where id = v_item.product_id;

    if not found then
      raise exception 'unknown_product';
    end if;
    if v_product.prescription_required then
      raise exception 'prescription_required:%', v_product.name;
    end if;
    if v_product.stock < v_item.quantity then
      raise exception 'insufficient_stock:%', v_product.name;
    end if;

    v_unit_price := case
      when v_product.sale_price is not null and v_product.sale_price > 0 and v_product.sale_price < v_product.price
        then v_product.sale_price
      else v_product.price
    end;

    insert into public.order_items (order_id, product_id, product_name, sku, unit_price, quantity, line_total)
    values (v_order_id, v_product.id, v_product.name, v_product.sku, v_unit_price, v_item.quantity,
            v_unit_price * v_item.quantity);

    v_subtotal := v_subtotal + v_unit_price * v_item.quantity;
    v_lines := v_lines || jsonb_build_object(
      'name', v_product.name,
      'quantity', v_item.quantity,
      'unit_price', v_unit_price,
      'line_total', v_unit_price * v_item.quantity
    );
  end loop;

  v_fee := case
    when p_delivery_method = 'pickup' then 0
    when v_subtotal >= p_free_delivery_threshold then 0
    else p_delivery_fee
  end;

  update public.orders
    set subtotal = v_subtotal, delivery_fee = v_fee, total = v_subtotal + v_fee
    where id = v_order_id;

  insert into public.order_status_history (order_id, from_status, to_status, note)
  values (v_order_id, null, 'new', 'Order placed on the website');

  return jsonb_build_object(
    'order_id', v_order_id,
    'order_number', v_order_number,
    'subtotal', v_subtotal,
    'delivery_fee', v_fee,
    'total', v_subtotal + v_fee,
    'items', v_lines
  );
end;
$$;
revoke execute on function public.create_order(text, text, text, text, text, text, text, text, text, numeric, numeric, jsonb)
  from public, anon, authenticated;
grant execute on function public.create_order(text, text, text, text, text, text, text, text, text, numeric, numeric, jsonb)
  to service_role;

-- ---------------------------------------------------------------------------
-- set_order_status: staff only. Updates the order and records the history.
-- ---------------------------------------------------------------------------
create or replace function public.set_order_status(p_order_id uuid, p_status text, p_note text default null)
returns void
language plpgsql security definer set search_path = '' as $$
declare
  v_order record;
begin
  if not (select public.is_admin()) then
    raise exception 'not_authorized';
  end if;
  if p_status not in ('new', 'confirmed', 'out_for_delivery', 'ready_for_pickup', 'completed', 'cancelled') then
    raise exception 'invalid_status';
  end if;

  select id, status, delivery_method into v_order from public.orders where id = p_order_id for update;
  if not found then
    raise exception 'order_not_found';
  end if;
  if v_order.status = p_status then
    raise exception 'status_unchanged';
  end if;
  if p_status = 'out_for_delivery' and v_order.delivery_method <> 'delivery' then
    raise exception 'invalid_status_for_pickup';
  end if;
  if p_status = 'ready_for_pickup' and v_order.delivery_method <> 'pickup' then
    raise exception 'invalid_status_for_delivery';
  end if;

  update public.orders set status = p_status, updated_at = now() where id = p_order_id;
  insert into public.order_status_history (order_id, from_status, to_status, changed_by, note)
  values (p_order_id, v_order.status, p_status, (select auth.uid()), nullif(left(p_note, 500), ''));
end;
$$;
revoke execute on function public.set_order_status(uuid, text, text) from public, anon;
grant execute on function public.set_order_status(uuid, text, text) to authenticated;

-- ---------------------------------------------------------------------------
-- set_order_internal_notes: staff-only private notes (never shown to customers).
-- ---------------------------------------------------------------------------
create or replace function public.set_order_internal_notes(p_order_id uuid, p_notes text)
returns void
language plpgsql security definer set search_path = '' as $$
begin
  if not (select public.is_admin()) then
    raise exception 'not_authorized';
  end if;
  update public.orders
    set internal_notes = nullif(left(p_notes, 2000), ''), updated_at = now()
    where id = p_order_id;
  if not found then
    raise exception 'order_not_found';
  end if;
end;
$$;
revoke execute on function public.set_order_internal_notes(uuid, text) from public, anon;
grant execute on function public.set_order_internal_notes(uuid, text) to authenticated;
