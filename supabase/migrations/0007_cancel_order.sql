-- ============================================================================
-- SAB QUICK — Customer order cancellation  (0007)
-- ----------------------------------------------------------------------------
-- Lets a customer cancel their OWN order while it is still 'new' or 'accepted'
-- (before it's prepared). SECURITY DEFINER so it can flip the status + restock
-- without granting customers a broad UPDATE policy on orders. Run after 0006.
-- ============================================================================

create or replace function public.cancel_order(p_order_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order public.orders%rowtype;
begin
  select * into v_order from public.orders where id = p_order_id;
  if not found then
    raise exception 'Order not found';
  end if;
  if v_order.user_id <> auth.uid() then
    raise exception 'Not your order' using errcode = '42501';
  end if;
  if v_order.status not in ('new', 'accepted') then
    raise exception 'This order can no longer be cancelled';
  end if;

  -- Return stock that place_order() decremented.
  update public.products p
     set stock = stock + oi.quantity
    from public.order_items oi
   where oi.order_id = p_order_id and oi.product_id = p.id;

  update public.orders
     set status = 'cancelled'
   where id = p_order_id;
end;
$$;

grant execute on function public.cancel_order(uuid) to authenticated;
