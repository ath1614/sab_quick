-- ============================================================================
-- SAB QUICK — order_items.status + role-based reject  (0011)
-- ----------------------------------------------------------------------------
-- The live order_items table is missing the `status` column that schema.sql
-- intended, so cancel_order / reject_order / reject_order_item (which reference
-- oi.status) errored. Add the column, and make the reject RPCs allowed for any
-- internal role (staff/manager/owner/admin) — DB permission arrays are often
-- empty; the granular permission stays a UI concern. Run after 0010. Idempotent.
-- ============================================================================

alter table public.order_items add column if not exists status text default 'confirmed';
update public.order_items set status = 'confirmed' where status is null;

-- ─── reject_order: restock + refund coupon (role-gated) ─────────────────────
create or replace function public.reject_order(p_order_id uuid, p_reason text default null)
returns void language plpgsql security definer set search_path = public as $$
declare v_order public.orders%rowtype;
begin
  if public.auth_role() not in ('staff','manager','owner','admin') then
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

-- ─── reject_order_item: restock one item + recompute order total (role-gated) ─
create or replace function public.reject_order_item(p_order_id uuid, p_product_id uuid, p_reason text default null)
returns void language plpgsql security definer set search_path = public as $$
declare
  v_item     public.order_items%rowtype;
  v_subtotal numeric(10,2);
  v_discount numeric(10,2);
  v_delivery numeric(10,2);
begin
  if public.auth_role() not in ('staff','manager','owner','admin') then
    raise exception 'Not allowed' using errcode = '42501';
  end if;
  select * into v_item from public.order_items where order_id = p_order_id and product_id = p_product_id for update;
  if not found then raise exception 'Item not found'; end if;
  if v_item.status = 'rejected' then raise exception 'Item already rejected'; end if;

  update public.order_items set status = 'rejected', rejection_reason = p_reason
    where order_id = p_order_id and product_id = p_product_id;
  update public.products set stock = stock + v_item.quantity where id = p_product_id;

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
