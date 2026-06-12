-- ============================================================================
-- SAB QUICK — Bulletproof RLS reset for orders & order_items  (0005)
-- ----------------------------------------------------------------------------
-- 0004 didn't close the hole — either it rolled back, or a leftover PERMISSIVE
-- policy (e.g. a dashboard "Enable read for all users" USING(true)) is still
-- granting anon access even with RLS enabled. This drops EVERY policy on both
-- tables dynamically (by name), enables RLS, then creates only the correct set.
-- Run this whole file in the Supabase SQL editor. Idempotent.
-- ============================================================================

-- 1. Make sure the role helper exists (no-op if 0001 already created it).
create or replace function public.auth_role()
returns text language sql stable security definer set search_path = public as $$
  select role from public.users where id = auth.uid();
$$;

-- 2. Drop ALL existing policies on both tables, whatever they're named.
do $$
declare p record;
begin
  for p in select policyname from pg_policies
           where schemaname = 'public' and tablename = 'orders' loop
    execute format('drop policy if exists %I on public.orders', p.policyname);
  end loop;
  for p in select policyname from pg_policies
           where schemaname = 'public' and tablename = 'order_items' loop
    execute format('drop policy if exists %I on public.order_items', p.policyname);
  end loop;
end $$;

-- 3. Enable RLS (now that no permissive policy survives).
alter table public.orders enable row level security;
alter table public.order_items enable row level security;

-- 4. Correct policies — ORDERS.
create policy "orders_select_own" on public.orders
  for select using (auth.uid() = user_id);
create policy "orders_insert_own" on public.orders
  for insert with check (auth.uid() = user_id);
create policy "orders_select_staff" on public.orders
  for select using (public.auth_role() in ('staff','manager','owner','admin'));
create policy "orders_update_staff" on public.orders
  for update using (public.auth_role() in ('staff','manager','owner','admin'));
create policy "orders_select_delivery" on public.orders
  for select using (delivery_partner_id = auth.uid());
create policy "orders_update_delivery" on public.orders
  for update using (delivery_partner_id = auth.uid());

-- 5. Correct policies — ORDER ITEMS.
create policy "order_items_select_own" on public.order_items
  for select using (
    exists (select 1 from public.orders o
            where o.id = order_items.order_id and o.user_id = auth.uid())
  );
create policy "order_items_select_staff" on public.order_items
  for select using (public.auth_role() in ('staff','manager','owner','admin'));
create policy "order_items_insert_own" on public.order_items
  for insert with check (
    exists (select 1 from public.orders o
            where o.id = order_items.order_id and o.user_id = auth.uid())
  );
create policy "order_items_manage_staff" on public.order_items
  for all using (public.auth_role() in ('staff','manager','owner','admin'))
  with check (public.auth_role() in ('staff','manager','owner','admin'));

-- 6. Verify: RLS must be ON for both tables.
select relname as table, relrowsecurity as rls_enabled
from pg_class
where relname in ('orders','order_items');

-- 7. And the policies that now exist.
select tablename, policyname, cmd
from pg_policies
where schemaname = 'public' and tablename in ('orders','order_items')
order by tablename, policyname;
