-- Pack options: sell the same product as a single unit, a strip, a box, etc.
--
-- Review before applying: this changes the production database.
--  * products.unit_label   name of the base unit, e.g. "Tablet" (optional).
--  * products.pack_options list of extra pack sizes: [{"label":"Strip of 10","price":80}, ...].
--                          The product's own price stays the base-unit price.
--  * order_items.option_label records which size was ordered (null = base unit).
--  * create_order() now prices each line from the chosen option and no longer
--    compares quantity to stock. Stock 0 still means "out of stock" and blocks orders.
--    Stock is never reduced by an order (unchanged).
-- Safe to run once; existing products, prices and orders are unaffected.

alter table public.products
  add column if not exists unit_label text,
  add column if not exists pack_options jsonb not null default '[]'::jsonb;

alter table public.products
  drop constraint if exists products_pack_options_is_array,
  add constraint products_pack_options_is_array check (jsonb_typeof(pack_options) = 'array');

alter table public.order_items
  add column if not exists option_label text;

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
  v_option jsonb;
  v_option_label text;
  v_display_name text;
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

    select id, name, sku, price, sale_price, stock, prescription_required, unit_label, pack_options
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
    if v_item.option_label = '' then
      -- Base unit: the product's own price (sale-aware).
      v_option_label := nullif(v_product.unit_label, '');
      v_unit_price := case
        when v_product.sale_price is not null and v_product.sale_price > 0 and v_product.sale_price < v_product.price
          then v_product.sale_price
        else v_product.price
      end;
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

    v_display_name := v_product.name;

    insert into public.order_items (order_id, product_id, product_name, option_label, sku, unit_price, quantity, line_total)
    values (v_order_id, v_product.id, v_display_name, v_option_label, v_product.sku, v_unit_price, v_item.quantity,
            v_unit_price * v_item.quantity);

    v_subtotal := v_subtotal + v_unit_price * v_item.quantity;
    v_lines := v_lines || jsonb_build_object(
      'name', v_product.name,
      'option_label', v_option_label,
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
