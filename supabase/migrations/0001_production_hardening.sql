-- ============================================================================
-- SAB QUICK — Production Hardening Migration  (0001)
-- ----------------------------------------------------------------------------
-- Fixes discovered in the production-readiness audit:
--   1. Missing columns the app reads but the schema never created
--      (users.is_active, users.permissions, categories.product_count).
--   2. RLS gaps: tables with RLS enabled but NO policies (inventory,
--      transactions, banners, analytics_events) => totally inaccessible.
--   3. RLS gaps: staff/manager/owner cannot read customer rows, the staff
--      list, or delivery-partner list (users SELECT policy was self-only).
--   4. RLS gaps: order_items had NO insert policy => checkout INSERT fails.
--   5. RLS gaps: delivery partners cannot update their assigned orders.
--   6. Price-manipulation hole: client sends `total`; nothing recomputes it.
--   7. Missing `decrement_stock` RPC referenced by the app (stock never moved).
--   8. Missing indexes on every foreign key / filter column.
--   9. Recursive-RLS footgun: a policy ON users that sub-selects users.
--
-- Apply in the Supabase SQL editor AFTER schema.sql. Idempotent / re-runnable.
-- ============================================================================

-- ─── 0. SECURITY DEFINER role helper (avoids recursive RLS on users) ─────────
create or replace function public.auth_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select role from public.users where id = auth.uid();
$$;

revoke all on function public.auth_role() from public;
grant execute on function public.auth_role() to authenticated, anon;

-- ─── 1. Missing columns ──────────────────────────────────────────────────────
alter table public.users        add column if not exists is_active   boolean default true;
alter table public.users        add column if not exists permissions text[]  default '{}';
alter table public.users        add column if not exists updated_at  timestamptz default now();
alter table public.products     add column if not exists updated_at  timestamptz default now();
alter table public.categories   add column if not exists product_count int default 0;
-- Soft-delete flag (audit recommends; nothing is ever truly deleted in retail)
alter table public.orders       add column if not exists updated_at  timestamptz default now();
alter table public.products     add column if not exists deleted_at  timestamptz;

-- ─── 2. Indexes (every FK + every column used in a filter) ───────────────────
create index if not exists idx_orders_user_id          on public.orders(user_id);
create index if not exists idx_orders_status           on public.orders(status);
create index if not exists idx_orders_partner_id       on public.orders(delivery_partner_id);
create index if not exists idx_orders_created_at       on public.orders(created_at desc);
create index if not exists idx_order_items_order_id    on public.order_items(order_id);
create index if not exists idx_order_items_product_id  on public.order_items(product_id);
create index if not exists idx_products_category_id    on public.products(category_id);
create index if not exists idx_products_is_active      on public.products(is_active);
create index if not exists idx_addresses_user_id       on public.addresses(user_id);
create index if not exists idx_notifications_user      on public.notifications(user_id, is_read);
create index if not exists idx_transactions_user_id    on public.transactions(user_id);
create index if not exists idx_transactions_order_id   on public.transactions(order_id);
create index if not exists idx_deliveries_partner_id   on public.deliveries(partner_id);
create index if not exists idx_deliveries_order_id     on public.deliveries(order_id);
create index if not exists idx_analytics_user_created  on public.analytics_events(user_id, created_at desc);
create index if not exists idx_users_role              on public.users(role);

-- ─── 3. USERS policies — let staff+ read, owner manage ───────────────────────
drop policy if exists "Staff+ can view all users"  on public.users;
drop policy if exists "Owner can manage users"     on public.users;
create policy "Staff+ can view all users" on public.users
  for select using ( public.auth_role() in ('staff','manager','owner','admin') );
create policy "Owner can manage users" on public.users
  for update using ( public.auth_role() in ('owner','admin') );

-- ─── 4. ORDER_ITEMS — insert by order owner + manage by staff ────────────────
drop policy if exists "Owner can insert own order items"    on public.order_items;
drop policy if exists "Staff+ can manage order items"        on public.order_items;
create policy "Owner can insert own order items" on public.order_items
  for insert with check (
    exists (select 1 from public.orders o
            where o.id = order_items.order_id and o.user_id = auth.uid())
  );
create policy "Staff+ can manage order items" on public.order_items
  for all using ( public.auth_role() in ('staff','manager','owner','admin') )
  with check ( public.auth_role() in ('staff','manager','owner','admin') );

-- ─── 5. DELIVERY partners can update their assigned orders ───────────────────
drop policy if exists "Delivery can view assigned orders"   on public.orders;
drop policy if exists "Delivery can update assigned orders"  on public.orders;
create policy "Delivery can view assigned orders" on public.orders
  for select using ( delivery_partner_id = auth.uid() );
create policy "Delivery can update assigned orders" on public.orders
  for update using ( delivery_partner_id = auth.uid() );
-- deliveries table: partner can update own delivery rows
drop policy if exists "Delivery can update own deliveries" on public.deliveries;
create policy "Delivery can update own deliveries" on public.deliveries
  for update using ( partner_id = auth.uid() );

-- ─── 6. INVENTORY policies (was RLS-on / no-policy = locked) ─────────────────
drop policy if exists "Staff+ can view inventory"   on public.inventory;
drop policy if exists "Staff+ can manage inventory"  on public.inventory;
create policy "Staff+ can view inventory" on public.inventory
  for select using ( public.auth_role() in ('staff','manager','owner','admin') );
create policy "Staff+ can manage inventory" on public.inventory
  for all using ( public.auth_role() in ('staff','manager','owner','admin') )
  with check ( public.auth_role() in ('staff','manager','owner','admin') );

-- ─── 7. TRANSACTIONS policies ────────────────────────────────────────────────
drop policy if exists "Users view own transactions"  on public.transactions;
drop policy if exists "Owner manage transactions"     on public.transactions;
create policy "Users view own transactions" on public.transactions
  for select using ( user_id = auth.uid() or public.auth_role() in ('owner','admin') );
create policy "Owner manage transactions" on public.transactions
  for all using ( public.auth_role() in ('owner','admin') )
  with check ( public.auth_role() in ('owner','admin') );

-- ─── 8. BANNERS policies ─────────────────────────────────────────────────────
drop policy if exists "Everyone view active banners" on public.banners;
drop policy if exists "Manager+ manage banners"       on public.banners;
create policy "Everyone view active banners" on public.banners
  for select using ( is_active = true );
create policy "Manager+ manage banners" on public.banners
  for all using ( public.auth_role() in ('manager','owner','admin') )
  with check ( public.auth_role() in ('manager','owner','admin') );

-- ─── 9. ANALYTICS — anyone authed inserts events, owner reads ────────────────
drop policy if exists "Authed can insert events" on public.analytics_events;
drop policy if exists "Owner can read events"     on public.analytics_events;
create policy "Authed can insert events" on public.analytics_events
  for insert with check ( auth.uid() is not null );
create policy "Owner can read events" on public.analytics_events
  for select using ( public.auth_role() in ('owner','admin') );

-- ─── 10. Atomic, guarded stock decrement (referenced by the app) ─────────────
create or replace function public.decrement_stock(p_id uuid, qty int)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.products
     set stock = stock - qty,
         updated_at = now()
   where id = p_id and stock >= qty;
  if not found then
    raise exception 'Insufficient stock for product %', p_id
      using errcode = 'check_violation';
  end if;
end;
$$;
grant execute on function public.decrement_stock(uuid, int) to authenticated;

-- ─── 11. SECURE order placement RPC (fixes price-manipulation) ───────────────
-- Computes subtotal/total SERVER-SIDE from products.price. The client may no
-- longer dictate the amount it pays. Validates stock and writes items + stock
-- atomically. Switch the client to call this instead of inserting directly
-- (see src/lib/orders.ts change shipped alongside this migration).
create or replace function public.place_order(
  p_items          jsonb,          -- [{ "product_id": uuid, "quantity": int }]
  p_address_line1  text,
  p_address_city   text,
  p_address_pincode text,
  p_payment_method text,
  p_coupon_code    text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id   uuid := auth.uid();
  v_order_id  uuid;
  v_subtotal  numeric(10,2) := 0;
  v_discount  numeric(10,2) := 0;
  v_delivery  numeric(10,2) := 0;
  v_item      jsonb;
  v_price     numeric(10,2);
  v_pid       uuid;
  v_qty       int;
  v_coupon    public.coupons%rowtype;
begin
  if v_user_id is null then
    raise exception 'Not authenticated' using errcode = '28000';
  end if;
  if p_items is null or jsonb_array_length(p_items) = 0 then
    raise exception 'Cart is empty';
  end if;

  v_order_id := gen_random_uuid();

  -- compute subtotal from trusted prices + lock rows
  for v_item in select * from jsonb_array_elements(p_items) loop
    v_pid := (v_item->>'product_id')::uuid;
    v_qty := (v_item->>'quantity')::int;
    if v_qty <= 0 then raise exception 'Invalid quantity'; end if;

    select price into v_price from public.products
      where id = v_pid and is_active = true for update;
    if not found then raise exception 'Product % unavailable', v_pid; end if;

    v_subtotal := v_subtotal + (v_price * v_qty);
  end loop;

  -- optional coupon (server-validated)
  if p_coupon_code is not null then
    select * into v_coupon from public.coupons
      where code = upper(p_coupon_code) and is_active = true
        and (valid_until is null or valid_until > now())
        and v_subtotal >= min_order;
    if found then
      v_discount := least(
        case when v_coupon.type = 'percent'
             then v_subtotal * v_coupon.value / 100 else v_coupon.value end,
        coalesce(v_coupon.max_discount, 1e9));
    end if;
  end if;

  v_delivery := case when v_subtotal >= 199 then 0 else 25 end;

  insert into public.orders (
    id, user_id, status, subtotal, discount, delivery_fee, total,
    coupon_code, payment_method, payment_status,
    address_line1, address_city, address_pincode)
  values (
    v_order_id, v_user_id, 'new', v_subtotal, v_discount, v_delivery,
    v_subtotal - v_discount + v_delivery,
    nullif(upper(coalesce(p_coupon_code,'')),''), p_payment_method,
    case when p_payment_method = 'cod' then 'pending' else 'pending' end,
    p_address_line1, p_address_city, p_address_pincode);

  -- items + atomic stock decrement
  for v_item in select * from jsonb_array_elements(p_items) loop
    v_pid := (v_item->>'product_id')::uuid;
    v_qty := (v_item->>'quantity')::int;
    select price into v_price from public.products where id = v_pid;

    insert into public.order_items
      (order_id, product_id, quantity, unit_price, total_price)
    values (v_order_id, v_pid, v_qty, v_price, v_price * v_qty);

    perform public.decrement_stock(v_pid, v_qty);
  end loop;

  return v_order_id;
end;
$$;
grant execute on function public.place_order(jsonb, text, text, text, text, text) to authenticated;

-- NOTE: once the client calls place_order(), revoke direct order writes so the
-- price can never be set by the client. Uncomment after deploying the new client:
-- revoke insert on public.orders      from authenticated;
-- revoke insert on public.order_items from authenticated;
