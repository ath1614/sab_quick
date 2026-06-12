-- ============================================================================
-- SAB QUICK — CRITICAL: re-enable RLS on orders & order_items  (0004)
-- ----------------------------------------------------------------------------
-- An E2E audit found RLS was DISABLED on `orders` and `order_items` (a logged-
-- out user could read every order; any customer could read/update others'
-- orders). This re-enables + FORCEs RLS and re-asserts the full policy set so
-- it's correct regardless of prior state. Apply after 0003. Idempotent.
-- ============================================================================

-- ─── ORDERS ──────────────────────────────────────────────────────────────────
alter table public.orders enable row level security;
alter table public.orders force row level security;

drop policy if exists "Users can view own orders" on public.orders;
drop policy if exists "Users can create orders" on public.orders;
drop policy if exists "Staff/Manager/Owner can view all orders" on public.orders;
drop policy if exists "Staff/Manager/Owner can update orders" on public.orders;
drop policy if exists "Delivery can view assigned orders" on public.orders;
drop policy if exists "Delivery can update assigned orders" on public.orders;

create policy "Users can view own orders" on public.orders
  for select using (auth.uid() = user_id);
create policy "Users can create orders" on public.orders
  for insert with check (auth.uid() = user_id);
create policy "Staff/Manager/Owner can view all orders" on public.orders
  for select using (public.auth_role() in ('staff','manager','owner','admin'));
create policy "Staff/Manager/Owner can update orders" on public.orders
  for update using (public.auth_role() in ('staff','manager','owner','admin'));
create policy "Delivery can view assigned orders" on public.orders
  for select using (delivery_partner_id = auth.uid());
create policy "Delivery can update assigned orders" on public.orders
  for update using (delivery_partner_id = auth.uid());

-- ─── ORDER ITEMS ─────────────────────────────────────────────────────────────
alter table public.order_items enable row level security;
alter table public.order_items force row level security;

drop policy if exists "Users can view own order items" on public.order_items;
drop policy if exists "Staff/Manager/Owner can view all order items" on public.order_items;
drop policy if exists "Owner can insert own order items" on public.order_items;
drop policy if exists "Staff+ can manage order items" on public.order_items;

create policy "Users can view own order items" on public.order_items
  for select using (
    exists (select 1 from public.orders o
            where o.id = order_items.order_id and o.user_id = auth.uid())
  );
create policy "Staff/Manager/Owner can view all order items" on public.order_items
  for select using (public.auth_role() in ('staff','manager','owner','admin'));
create policy "Owner can insert own order items" on public.order_items
  for insert with check (
    exists (select 1 from public.orders o
            where o.id = order_items.order_id and o.user_id = auth.uid())
  );
create policy "Staff+ can manage order items" on public.order_items
  for all using (public.auth_role() in ('staff','manager','owner','admin'))
  with check (public.auth_role() in ('staff','manager','owner','admin'));

-- Note: place_order() is SECURITY DEFINER so it still writes orders/order_items
-- regardless of these policies — the customer's price can't be forged.
