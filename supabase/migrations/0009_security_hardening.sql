-- ============================================================================
-- SAB QUICK — P0 security hardening  (0009)
-- ----------------------------------------------------------------------------
-- Closes verified-exploitable holes:
--  * Any user could `update users set role='owner'` on themselves (RLS only
--    checked id, not the changed columns).
--  * A delivery driver/staff could rewrite ANY order field (total=0,
--    payment_status='paid') because the orders UPDATE policy had no column limit.
--  * Deactivated users (is_active=false) kept full access.
--  * Recursive-RLS in coupons/deliveries policies could break owner writes.
-- Run after 0008. Idempotent.
-- ============================================================================

-- ─── 0. auth_role() now respects is_active (inactive user -> no role) ────────
create or replace function public.auth_role()
returns text language sql stable security definer set search_path = public as $$
  select role from public.users
   where id = auth.uid() and coalesce(is_active, true);
$$;

-- ─── 1. Guard users: only owner/admin (or the service role) may change
--        role / permissions / is_active / wallet_balance ─────────────────────
create or replace function public.guard_user_update()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then return new; end if;          -- service role / triggers
  if public.auth_role() in ('owner','admin') then return new; end if;
  if new.role          is distinct from old.role
     or new.permissions   is distinct from old.permissions
     or new.is_active     is distinct from old.is_active
     or new.wallet_balance is distinct from old.wallet_balance then
    raise exception 'You may not change role, permissions or status'
      using errcode = '42501';
  end if;
  return new;
end; $$;

drop trigger if exists trg_guard_user_update on public.users;
create trigger trg_guard_user_update
  before update on public.users
  for each row execute function public.guard_user_update();

-- ─── 2. Guard orders: non-owners may only change workflow columns, must follow
--        a legal status transition, and can't progress an unpaid online order.
--        Owner/admin and the service role (webhook) are unrestricted. ─────────
create or replace function public.guard_order_update()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  -- stamp delivered_at on the delivered transition (everyone)
  if new.status = 'delivered' and old.status is distinct from 'delivered' then
    new.delivered_at = now();
  end if;

  if auth.uid() is null then return new; end if;           -- service role / webhook
  if public.auth_role() in ('owner','admin') then return new; end if;

  -- no tampering with money / ownership
  if new.total        is distinct from old.total
     or new.subtotal     is distinct from old.subtotal
     or new.discount     is distinct from old.discount
     or new.delivery_fee is distinct from old.delivery_fee
     or new.payment_status is distinct from old.payment_status
     or new.payment_method is distinct from old.payment_method
     or new.user_id      is distinct from old.user_id
     or new.coupon_id    is distinct from old.coupon_id
     or new.coupon_code  is distinct from old.coupon_code then
    raise exception 'You may not modify order financials' using errcode = '42501';
  end if;

  -- legal forward transitions only
  if new.status is distinct from old.status then
    if (old.status, new.status) not in (
        ('new','accepted'), ('new','rejected'), ('new','cancelled'),
        ('accepted','preparing'), ('accepted','rejected'), ('accepted','cancelled'),
        ('preparing','packed'), ('preparing','rejected'),
        ('packed','out_for_delivery'), ('packed','rejected'),
        ('out_for_delivery','delivered')
    ) then
      raise exception 'Illegal status transition % -> %', old.status, new.status
        using errcode = '42501';
    end if;

    -- unpaid online orders can't progress past 'accepted'
    if new.status in ('preparing','packed','out_for_delivery','delivered')
       and new.payment_method <> 'cod'
       and coalesce(new.payment_status,'pending') <> 'paid' then
      raise exception 'Order is not paid yet' using errcode = '42501';
    end if;
  end if;

  return new;
end; $$;

drop trigger if exists trg_guard_order_update on public.orders;
create trigger trg_guard_order_update
  before update on public.orders
  for each row execute function public.guard_order_update();

-- ─── 3. De-recurse coupons & deliveries policies (use auth_role helper) ──────
drop policy if exists "Owner/Admin can manage coupons" on public.coupons;
create policy "Owner/Admin can manage coupons" on public.coupons
  for all using (public.auth_role() in ('owner','admin'))
  with check (public.auth_role() in ('owner','admin'));

drop policy if exists "Manager/Owner can manage deliveries" on public.deliveries;
create policy "Manager/Owner can manage deliveries" on public.deliveries
  for all using (public.auth_role() in ('manager','owner','admin'))
  with check (public.auth_role() in ('manager','owner','admin'));

-- ─── 4. Let a delivery partner read the customer rows of orders assigned to
--        them (so the dashboard can show name + phone to contact). ───────────
drop policy if exists "Delivery can read assigned customers" on public.users;
create policy "Delivery can read assigned customers" on public.users
  for select using (
    exists (
      select 1 from public.orders o
      where o.user_id = users.id and o.delivery_partner_id = auth.uid()
    )
  );

-- ─── 5. New public signups are ALWAYS 'customer' — a self-signup can no longer
--        pass role:'owner' in user_metadata. Privileged accounts are created by
--        the service role (/api/staff/create), which sets role explicitly. ───
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.users (id, name, email, role)
  values (new.id, new.raw_user_meta_data->>'name', new.email, 'customer')
  on conflict (id) do update set
    name = excluded.name,
    email = excluded.email;   -- note: role is intentionally NOT updated here
  return new;
end; $$;
