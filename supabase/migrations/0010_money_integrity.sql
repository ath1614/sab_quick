-- ============================================================================
-- SAB QUICK — P0 money & stock integrity  (0010)
-- ----------------------------------------------------------------------------
--  * place_order now enforces coupon valid_from + usage_limit, increments
--    used_count, records coupon_id, and floors the discount at subtotal
--    (no more negative totals, no more infinite coupon reuse).
--  * reject_order / reject_order_item RPCs restock + recompute totals
--    (staff rejection used to leak stock forever and never re-price).
--  * cancel_order made idempotent (row lock, skip rejected items, refund coupon).
-- Run after 0009. Idempotent.
-- ============================================================================

-- ─── 1. place_order with full coupon enforcement ────────────────────────────
create or replace function public.place_order(
  p_items          jsonb,
  p_address_line1  text,
  p_address_city   text,
  p_address_pincode text,
  p_payment_method text,
  p_coupon_code    text default null
)
returns uuid
language plpgsql security definer set search_path = public
as $$
declare
  v_user_id  uuid := auth.uid();
  v_order_id uuid;
  v_subtotal numeric(10,2) := 0;
  v_discount numeric(10,2) := 0;
  v_delivery numeric(10,2) := 0;
  v_item     jsonb;
  v_price    numeric(10,2);
  v_pid      uuid;
  v_qty      int;
  v_coupon   public.coupons%rowtype;
begin
  if v_user_id is null then raise exception 'Not authenticated' using errcode = '28000'; end if;
  if p_items is null or jsonb_array_length(p_items) = 0 then raise exception 'Cart is empty'; end if;

  v_order_id := gen_random_uuid();

  for v_item in select * from jsonb_array_elements(p_items) loop
    v_pid := (v_item->>'product_id')::uuid;
    v_qty := (v_item->>'quantity')::int;
    if v_qty <= 0 then raise exception 'Invalid quantity'; end if;
    select price into v_price from public.products where id = v_pid and is_active = true for update;
    if not found then raise exception 'Product % unavailable', v_pid; end if;
    v_subtotal := v_subtotal + (v_price * v_qty);
  end loop;

  -- coupon: validate active + window + min_order + usage_limit, lock the row
  if p_coupon_code is not null and length(trim(p_coupon_code)) > 0 then
    select * into v_coupon from public.coupons
      where code = upper(p_coupon_code)
        and is_active = true
        and (valid_from  is null or valid_from  <= now())
        and (valid_until is null or valid_until >  now())
        and v_subtotal >= coalesce(min_order, 0)
        and (usage_limit is null or used_count < usage_limit)
      for update;
    if found then
      v_discount := least(
        case when v_coupon.type = 'percent' then v_subtotal * v_coupon.value / 100
             else v_coupon.value end,
        coalesce(v_coupon.max_discount, 1e9));
      v_discount := least(v_discount, v_subtotal);          -- never below 0
    end if;
  end if;

  v_delivery := case when v_subtotal >= 199 then 0 else 25 end;

  insert into public.orders (
    id, user_id, status, subtotal, discount, delivery_fee, total,
    coupon_code, coupon_id, payment_method, payment_status,
    address_line1, address_city, address_pincode)
  values (
    v_order_id, v_user_id, 'new', v_subtotal, v_discount, v_delivery,
    greatest(0, v_subtotal - v_discount) + v_delivery,
    nullif(upper(coalesce(p_coupon_code,'')),''), v_coupon.id,
    p_payment_method, 'pending',
    p_address_line1, p_address_city, p_address_pincode);

  if v_coupon.id is not null then
    update public.coupons set used_count = coalesce(used_count,0) + 1 where id = v_coupon.id;
  end if;

  for v_item in select * from jsonb_array_elements(p_items) loop
    v_pid := (v_item->>'product_id')::uuid;
    v_qty := (v_item->>'quantity')::int;
    select price into v_price from public.products where id = v_pid;
    insert into public.order_items (order_id, product_id, quantity, unit_price, total_price)
    values (v_order_id, v_pid, v_qty, v_price, v_price * v_qty);
    perform public.decrement_stock(v_pid, v_qty);
  end loop;

  return v_order_id;
end;
$$;
grant execute on function public.place_order(jsonb, text, text, text, text, text) to authenticated;

-- ─── 2. cancel_order — idempotent restock + coupon refund ────────────────────
create or replace function public.cancel_order(p_order_id uuid)
returns void language plpgsql security definer set search_path = public as $$
declare v_order public.orders%rowtype;
begin
  select * into v_order from public.orders where id = p_order_id for update;
  if not found then raise exception 'Order not found'; end if;
  if v_order.user_id <> auth.uid() then raise exception 'Not your order' using errcode = '42501'; end if;
  if v_order.status not in ('new','accepted') then raise exception 'This order can no longer be cancelled'; end if;

  update public.products p set stock = stock + oi.quantity
    from public.order_items oi
   where oi.order_id = p_order_id and oi.product_id = p.id and oi.status <> 'rejected';

  if v_order.coupon_id is not null then
    update public.coupons set used_count = greatest(0, coalesce(used_count,0) - 1) where id = v_order.coupon_id;
  end if;

  update public.orders set status = 'cancelled' where id = p_order_id;
end; $$;
grant execute on function public.cancel_order(uuid) to authenticated;

-- ─── 3. reject_order — staff rejects whole order: restock + refund coupon ────
create or replace function public.reject_order(p_order_id uuid, p_reason text default null)
returns void language plpgsql security definer set search_path = public as $$
declare v_order public.orders%rowtype;
begin
  if not (public.auth_role() in ('manager','owner','admin') or public.has_perm(array['reject_orders'])) then
    raise exception 'Not allowed' using errcode = '42501';
  end if;
  select * into v_order from public.orders where id = p_order_id for update;
  if not found then raise exception 'Order not found'; end if;
  if v_order.status in ('delivered','rejected','cancelled') then
    raise exception 'Order can no longer be rejected';
  end if;

  update public.products p set stock = stock + oi.quantity
    from public.order_items oi
   where oi.order_id = p_order_id and oi.product_id = p.id and oi.status <> 'rejected';

  if v_order.coupon_id is not null then
    update public.coupons set used_count = greatest(0, coalesce(used_count,0) - 1) where id = v_order.coupon_id;
  end if;

  update public.orders set status = 'rejected', notes = p_reason where id = p_order_id;
end; $$;
grant execute on function public.reject_order(uuid, text) to authenticated;

-- ─── 4. reject_order_item — restock one item + recompute order total ─────────
create or replace function public.reject_order_item(p_order_id uuid, p_product_id uuid, p_reason text default null)
returns void language plpgsql security definer set search_path = public as $$
declare
  v_item     public.order_items%rowtype;
  v_subtotal numeric(10,2);
  v_discount numeric(10,2);
  v_delivery numeric(10,2);
begin
  if not (public.auth_role() in ('manager','owner','admin') or public.has_perm(array['reject_items'])) then
    raise exception 'Not allowed' using errcode = '42501';
  end if;
  select * into v_item from public.order_items where order_id = p_order_id and product_id = p_product_id for update;
  if not found then raise exception 'Item not found'; end if;
  if v_item.status = 'rejected' then raise exception 'Item already rejected'; end if;

  update public.order_items set status = 'rejected', rejection_reason = p_reason
    where order_id = p_order_id and product_id = p_product_id;
  update public.products set stock = stock + v_item.quantity where id = p_product_id;

  -- recompute order totals from remaining (non-rejected) items.
  -- Flag this as a trusted re-price so the order-guard trigger allows the
  -- financial change (a direct client update would still be blocked).
  perform set_config('sabquick.trusted', '1', true);
  select coalesce(sum(total_price),0) into v_subtotal
    from public.order_items where order_id = p_order_id and status <> 'rejected';
  select discount, delivery_fee into v_discount, v_delivery from public.orders where id = p_order_id;
  update public.orders
     set subtotal = v_subtotal,
         total = greatest(0, v_subtotal - least(coalesce(v_discount,0), v_subtotal)) + coalesce(v_delivery,0)
   where id = p_order_id;
  perform set_config('sabquick.trusted', '0', true);
end; $$;
grant execute on function public.reject_order_item(uuid, uuid, text) to authenticated;
