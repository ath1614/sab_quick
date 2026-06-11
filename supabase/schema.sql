-- SAB QUICK Database Schema
-- Run in Supabase SQL Editor

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- USERS
create table if not exists users (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null,
  email text unique not null,
  phone text,
  role text not null check (role in ('customer','delivery','staff','manager','owner','admin')) default 'customer',
  avatar_url text,
  wallet_balance numeric(10,2) default 0,
  referral_code text unique,
  created_at timestamptz default now()
);

-- CATEGORIES
create table if not exists categories (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  slug text unique not null,
  emoji text,
  image_url text,
  sort_order int default 0
);

-- PRODUCTS
create table if not exists products (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  description text,
  price numeric(10,2) not null,
  mrp numeric(10,2) not null,
  image_url text,
  category_id uuid references categories(id),
  unit text not null,
  stock int default 0,
  eta_minutes int default 10,
  rating numeric(3,2) default 0,
  review_count int default 0,
  is_active boolean default true,
  created_at timestamptz default now()
);

-- ADDRESSES
create table if not exists addresses (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references users(id) on delete cascade,
  label text not null,
  line1 text not null,
  line2 text,
  city text not null,
  pincode text not null,
  lat numeric(10,7),
  lng numeric(10,7),
  is_default boolean default false
);

-- COUPONS
create table if not exists coupons (
  id uuid primary key default uuid_generate_v4(),
  code text unique not null,
  type text check (type in ('percent','flat')) not null,
  value numeric(10,2) not null,
  min_order numeric(10,2) default 0,
  max_discount numeric(10,2),
  usage_limit int,
  used_count int default 0,
  valid_from timestamptz default now(),
  valid_until timestamptz,
  is_active boolean default true,
  created_at timestamptz default now()
);

-- ORDERS
create table if not exists orders (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references users(id),
  address_id uuid references addresses(id),
  address_line1 text,
  address_city text,
  address_pincode text,
  delivery_partner_id uuid references users(id),
  status text not null default 'new'
    check (status in ('new','accepted','preparing','packed','out_for_delivery','delivered','rejected','cancelled')),
  subtotal numeric(10,2) not null,
  discount numeric(10,2) default 0,
  delivery_fee numeric(10,2) default 0,
  total numeric(10,2) not null,
  coupon_code text,
  coupon_id uuid references coupons(id),
  payment_method text,
  payment_status text default 'pending',
  eta_minutes int,
  notes text,
  created_at timestamptz default now(),
  delivered_at timestamptz
);

-- ORDER ITEMS
create table if not exists order_items (
  id uuid primary key default uuid_generate_v4(),
  order_id uuid references orders(id) on delete cascade,
  product_id uuid references products(id),
  quantity int not null,
  unit_price numeric(10,2) not null,
  total_price numeric(10,2) not null,
  status text default 'confirmed' check (status in ('confirmed','rejected'))
);

-- INVENTORY
create table if not exists inventory (
  id uuid primary key default uuid_generate_v4(),
  product_id uuid references products(id) unique,
  quantity int not null default 0,
  low_stock_threshold int default 10,
  expiry_date date,
  updated_at timestamptz default now()
);

-- TRANSACTIONS
create table if not exists transactions (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references users(id),
  order_id uuid references orders(id),
  type text check (type in ('payment','refund','wallet_credit','wallet_debit')),
  amount numeric(10,2) not null,
  status text default 'success',
  gateway_ref text,
  created_at timestamptz default now()
);

-- NOTIFICATIONS
create table if not exists notifications (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references users(id),
  title text not null,
  body text not null,
  type text,
  data jsonb,
  is_read boolean default false,
  created_at timestamptz default now()
);

-- ANALYTICS EVENTS
create table if not exists analytics_events (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references users(id),
  event text not null,
  properties jsonb,
  created_at timestamptz default now()
);

-- DELIVERIES
create table if not exists deliveries (
  id uuid primary key default uuid_generate_v4(),
  order_id uuid references orders(id),
  partner_id uuid references users(id),
  pickup_at timestamptz,
  delivered_at timestamptz,
  distance_km numeric(6,2),
  proof_image_url text,
  rating int check (rating between 1 and 5),
  created_at timestamptz default now()
);

-- BANNERS (CMS)
create table if not exists banners (
  id uuid primary key default uuid_generate_v4(),
  title text,
  image_url text not null,
  link text,
  sort_order int default 0,
  is_active boolean default true,
  created_at timestamptz default now()
);

-- RLS POLICIES

-- ENABLE RLS
alter table users enable row level security;
alter table orders enable row level security;
alter table order_items enable row level security;
alter table addresses enable row level security;
alter table notifications enable row level security;
alter table products enable row level security;
alter table categories enable row level security;
alter table coupons enable row level security;
alter table deliveries enable row level security;
alter table inventory enable row level security;
alter table transactions enable row level security;
alter table banners enable row level security;
alter table analytics_events enable row level security;

-- USERS POLICIES
drop policy if exists "Users can view own profile" on users;
drop policy if exists "Users can update own profile" on users;
create policy "Users can view own profile" on users for select using (auth.uid() = id);
create policy "Users can update own profile" on users for update using (auth.uid() = id);

-- ORDERS POLICIES
drop policy if exists "Users can view own orders" on orders;
drop policy if exists "Users can create orders" on orders;
drop policy if exists "Staff/Manager/Owner can view all orders" on orders;
drop policy if exists "Staff/Manager/Owner can update orders" on orders;
create policy "Users can view own orders" on orders for select using (auth.uid() = user_id);
create policy "Users can create orders" on orders for insert with check (auth.uid() = user_id);
create policy "Staff/Manager/Owner can view all orders" on orders for select using (
  exists (
    select 1 from users where id = auth.uid() and role in ('staff','manager','owner','admin')
  )
);
create policy "Staff/Manager/Owner can update orders" on orders for update using (
  exists (
    select 1 from users where id = auth.uid() and role in ('staff','manager','owner','admin')
  )
);

-- ORDER ITEMS POLICIES
drop policy if exists "Users can view own order items" on order_items;
drop policy if exists "Staff/Manager/Owner can view all order items" on order_items;
create policy "Users can view own order items" on order_items for select using (
  exists (
    select 1 from orders where orders.id = order_items.order_id and orders.user_id = auth.uid()
  )
);
create policy "Staff/Manager/Owner can view all order items" on order_items for select using (
  exists (
    select 1 from users where id = auth.uid() and role in ('staff','manager','owner','admin')
  )
);

-- ADDRESSES POLICIES
drop policy if exists "Users can view own addresses" on addresses;
drop policy if exists "Users can manage own addresses" on addresses;
create policy "Users can view own addresses" on addresses for select using (auth.uid() = user_id);
create policy "Users can manage own addresses" on addresses for all using (auth.uid() = user_id);

-- NOTIFICATIONS POLICIES
drop policy if exists "Users can view own notifications" on notifications;
drop policy if exists "Users can update own notifications" on notifications;
create policy "Users can view own notifications" on notifications for select using (auth.uid() = user_id);
create policy "Users can update own notifications" on notifications for update using (auth.uid() = user_id);

-- PRODUCTS AND CATEGORIES (PUBLIC READ)
drop policy if exists "Everyone can view active products" on products;
drop policy if exists "Everyone can view categories" on categories;
drop policy if exists "Manager/Owner can manage products" on products;
drop policy if exists "Manager/Owner can manage categories" on categories;
create policy "Everyone can view active products" on products for select using (is_active = true);
create policy "Everyone can view categories" on categories for select using (true);
create policy "Manager/Owner can manage products" on products for all using (
  exists (
    select 1 from users where id = auth.uid() and role in ('manager','owner','admin')
  )
);
create policy "Manager/Owner can manage categories" on categories for all using (
  exists (
    select 1 from users where id = auth.uid() and role in ('manager','owner','admin')
  )
);

-- COUPONS POLICIES
drop policy if exists "Everyone can view active coupons" on coupons;
drop policy if exists "Owner/Admin can manage coupons" on coupons;
create policy "Everyone can view active coupons" on coupons for select using (is_active = true);
create policy "Owner/Admin can manage coupons" on coupons for all using (
  exists (
    select 1 from users where id = auth.uid() and role in ('owner','admin')
  )
);

-- DELIVERIES POLICIES
drop policy if exists "Delivery partners can view own deliveries" on deliveries;
drop policy if exists "Manager/Owner can manage deliveries" on deliveries;
create policy "Delivery partners can view own deliveries" on deliveries for select using (auth.uid() = partner_id);
create policy "Manager/Owner can manage deliveries" on deliveries for all using (
  exists (
    select 1 from users where id = auth.uid() and role in ('manager','owner','admin')
  )
);

-- FUNCTION: Handle new user creation
drop function if exists public.handle_new_user() cascade;
create function public.handle_new_user()
returns trigger as $$
begin
  insert into public.users (id, name, email, role)
  values (new.id, new.raw_user_meta_data->>'name', new.email, coalesce(new.raw_user_meta_data->>'role', 'customer'))
  on conflict (id) do update set 
    name = excluded.name,
    email = excluded.email,
    role = excluded.role;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- SEED DEMO DATA (only if not exists)
insert into categories (name, slug, emoji)
select 'Groceries','groceries','🛒'
where not exists (select 1 from categories where slug = 'groceries')
union all
select 'Vegetables','vegetables','🥦'
where not exists (select 1 from categories where slug = 'vegetables')
union all
select 'Dairy','dairy','🥛'
where not exists (select 1 from categories where slug = 'dairy')
union all
select 'Snacks','snacks','🍿'
where not exists (select 1 from categories where slug = 'snacks')
union all
select 'Fruits','fruits','🍎'
where not exists (select 1 from categories where slug = 'fruits')
union all
select 'Household','household','🏠'
where not exists (select 1 from categories where slug = 'household')
union all
select 'Offers','offers','🏷️'
where not exists (select 1 from categories where slug = 'offers');

-- SEED DEMO COUPON
insert into coupons (code, type, value, min_order, max_discount, is_active)
select 'SAVE10', 'percent', 10, 100, 50, true
where not exists (select 1 from coupons where code = 'SAVE10');
