-- ============================================================================
-- SAB QUICK — Restore order_items FK + let permitted staff manage products (0006)
-- ----------------------------------------------------------------------------
-- A role-by-role E2E found:
--  1. The FK order_items.order_id -> orders is MISSING, so PostgREST can't embed
--     order_items in the orders query the whole app uses
--     (orders.select("*,order_items(*,products(*))")) -> every dashboard's order
--     list silently failed and fell back to demo data. THIS is the big one.
--  2. Staff (even with manage_stock/manage_products permission) were blocked by
--     RLS from updating products/stock — the products policy only allowed
--     manager/owner/admin.
-- Run the whole file in the Supabase SQL editor. Idempotent.
-- ============================================================================

-- ─── 1. Restore the missing FK (remove any orphans first so it can be added) ──
delete from public.order_items oi
  where not exists (select 1 from public.orders o where o.id = oi.order_id);

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.order_items'::regclass
      and confrelid = 'public.orders'::regclass
      and contype = 'f'
  ) then
    alter table public.order_items
      add constraint order_items_order_id_fkey
      foreign key (order_id) references public.orders(id) on delete cascade;
  end if;
end $$;

-- ─── 2. Permission-aware product management for staff ────────────────────────
create or replace function public.has_perm(perms text[])
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.users
    where id = auth.uid() and permissions && perms
  );
$$;
grant execute on function public.has_perm(text[]) to authenticated;

drop policy if exists "Manager/Owner can manage products" on public.products;
drop policy if exists "Staff+ manage products" on public.products;
create policy "Staff+ manage products" on public.products
  for all
  using (
    public.auth_role() in ('manager','owner','admin')
    or public.has_perm(array['manage_products','manage_stock'])
  )
  with check (
    public.auth_role() in ('manager','owner','admin')
    or public.has_perm(array['manage_products','manage_stock'])
  );

-- ─── 3. Tell PostgREST to reload its schema cache (so the new FK is visible) ──
notify pgrst, 'reload schema';

-- Verify the FK now exists:
select conname, conrelid::regclass as on_table, confrelid::regclass as references
from pg_constraint
where conrelid = 'public.order_items'::regclass and contype = 'f';
