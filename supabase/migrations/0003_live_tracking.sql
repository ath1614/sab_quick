-- ============================================================================
-- SAB QUICK — Live delivery tracking foundation (0003)
-- ----------------------------------------------------------------------------
-- Provider-agnostic backend for real-time tracking. The driver app upserts its
-- current GPS position per active order; the customer subscribes via Supabase
-- realtime. The visual map (Mapbox/Google) renders these coordinates — that
-- part needs a NEXT_PUBLIC_MAPBOX_TOKEN, but the data layer here does not.
-- Apply after 0002. Idempotent.
-- ============================================================================

create table if not exists public.delivery_locations (
  order_id   uuid primary key references public.orders(id) on delete cascade,
  partner_id uuid references public.users(id),
  lat        numeric(10, 7) not null,
  lng        numeric(10, 7) not null,
  heading    numeric(5, 2),
  updated_at timestamptz default now()
);

create index if not exists idx_delivery_locations_partner on public.delivery_locations(partner_id);

alter table public.delivery_locations enable row level security;

-- Assigned delivery partner can write their own location for their orders.
drop policy if exists "Partner upserts own order location" on public.delivery_locations;
create policy "Partner upserts own order location" on public.delivery_locations
  for all using ( partner_id = auth.uid() )
  with check ( partner_id = auth.uid() );

-- The order's customer, and staff+, can read the live location.
drop policy if exists "Customer/staff read order location" on public.delivery_locations;
create policy "Customer/staff read order location" on public.delivery_locations
  for select using (
    public.auth_role() in ('staff','manager','owner','admin')
    or exists (
      select 1 from public.orders o
      where o.id = delivery_locations.order_id and o.user_id = auth.uid()
    )
  );

-- Add the table to the realtime publication (no-op if already present).
do $$
begin
  alter publication supabase_realtime add table public.delivery_locations;
exception when duplicate_object then null;
end $$;
