-- Supabase SQL schema for "Compra Ya!" marketplace
-- Run in Supabase SQL editor or CLI. Includes tables, policies, and RPC functions.

-- Extensions
create extension if not exists pgcrypto;
create extension if not exists "uuid-ossp";

-- Types
create type order_status as enum ('recibido', 'procesado', 'entregado', 'cancelado');
create type shipping_method as enum ('recogida', 'domicilio');

-- Categories
create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  created_at timestamptz not null default now()
);

-- Products
create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  price numeric(10,2) not null check (price >= 0),
  category_id uuid references public.categories(id) on delete set null,
  image_url text,
  stock integer not null default 0 check (stock >= 0),
  agotado boolean not null default false,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.set_products_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  -- Auto-mark agotado when stock hits 0
  if new.stock = 0 then
    new.agotado := true;
  end if;
  return new;
end;
$$;

create trigger trg_products_updated_at
before update on public.products
for each row execute function public.set_products_updated_at();

-- Profiles (admin users)
create table if not exists public.profiles (
  id uuid primary key default gen_random_uuid(),
  username text not null unique,
  password_hash text not null,
  role text not null default 'admin', -- roles: admin, editor (future)
  is_active boolean not null default true,
  last_login_at timestamptz,
  created_at timestamptz not null default now()
);

-- Admin sessions (token-based for RPC auth)
create table if not exists public.admin_sessions (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  token uuid not null unique,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '24 hours'),
  revoked boolean not null default false
);

-- Orders
create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  customer_name text,
  customer_phone text,
  customer_address text,
  shipping_method shipping_method not null,
  delivery_zone text, -- zona/municipio/distrito
  shipping_fee numeric(10,2) not null default 0,
  status order_status not null default 'recibido',
  notes text,
  whatsapp_message text, -- mensaje enviado a WhatsApp
  whatsapp_url text, -- enlace wa.me usado
  items_count integer not null default 0,
  total_amount numeric(12,2) not null default 0
);

-- Order items
create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete restrict,
  name text not null,
  unit_price numeric(10,2) not null check (unit_price >= 0),
  quantity integer not null check (quantity > 0),
  subtotal numeric(12,2) not null
);

-- Auto subtotal
create or replace function public.order_items_set_subtotal()
returns trigger language plpgsql as $$
begin
  new.subtotal := new.unit_price * new.quantity;
  return new;
end;
$$;

create trigger trg_order_items_set_subtotal
before insert or update on public.order_items
for each row execute function public.order_items_set_subtotal();

-- Recompute order totals after changes to items
create or replace function public.orders_recompute_totals(p_order_id uuid)
returns void language plpgsql as $$
begin
  update public.orders o
  set items_count = coalesce((select sum(oi.quantity) from public.order_items oi where oi.order_id = p_order_id), 0),
      total_amount = coalesce((select sum(oi.subtotal) from public.order_items oi where oi.order_id = p_order_id), 0) + o.shipping_fee
  where o.id = p_order_id;
end;
$$;

create or replace function public.orders_recompute_totals_trigger()
returns trigger language plpgsql as $$
begin
  perform public.orders_recompute_totals(case when tg_op = 'DELETE' then old.order_id else new.order_id end);
  return null;
end;
$$;

create trigger trg_orders_recompute_after_items
after insert or update or delete on public.order_items
for each row execute function public.orders_recompute_totals_trigger();

-- RLS
alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.profiles enable row level security;
alter table public.admin_sessions enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;

-- Policies: public read for products/categories
create policy "Public read categories" on public.categories
  for select to anon using (true);
create policy "Public read products" on public.products
  for select to anon using (is_active = true);

-- Orders: anonymous inserts allowed; reads only via admin RPC
create policy "Anon insert orders" on public.orders
  for insert to anon with check (true);
create policy "Anon insert order_items" on public.order_items
  for insert to anon with check (true);

-- Deny all by default for select/update/delete on orders/order_items for anon
-- (No explicit policies added for these actions)

-- Profiles and admin_sessions: no direct access from anon
-- (No policies for anon; access only through security definer functions)

-- RPC: Verify admin login
create or replace function public.verify_admin_login(p_username text, p_password text)
returns table (token uuid, profile_id uuid, role text, username text) language plpgsql security definer as $$
declare
  v_profile public.profiles;
begin
  -- Fetch user
  select * into v_profile from public.profiles where username = p_username and is_active = true;
  if v_profile.id is null then
    return;
  end if;

  -- Verify password using pgcrypto's crypt()
  if v_profile.password_hash = crypt(p_password, v_profile.password_hash) then
    update public.profiles set last_login_at = now() where id = v_profile.id;
    -- Create session token
    insert into public.admin_sessions(profile_id, token)
    values (v_profile.id, gen_random_uuid())
    returning token, profile_id, role, username into token, profile_id, role, username;

    return next;
  end if;
  -- Wrong password -> return empty
  return;
end;
$$;

grant execute on function public.verify_admin_login(text, text) to anon;

-- Helper: validate admin token
create or replace function public.admin_is_valid(p_token uuid)
returns boolean language plpgsql security definer as $$
declare
  v_count integer;
begin
  select count(*) into v_count from public.admin_sessions s
  join public.profiles p on p.id = s.profile_id
  where s.token = p_token and s.revoked = false and s.expires_at > now() and p.is_active = true;
  return v_count > 0;
end;
$$;

grant execute on function public.admin_is_valid(uuid) to anon;

-- Admin: upsert category
create or replace function public.admin_upsert_category(p_token uuid, p_id uuid, p_name text)
returns uuid language plpgsql security definer as $$
declare
  v_id uuid;
begin
  if not public.admin_is_valid(p_token) then
    raise exception 'Token inválido';
  end if;

  if p_id is null then
    insert into public.categories(name) values(p_name) returning id into v_id;
  else
    update public.categories set name = p_name where id = p_id returning id into v_id;
  end if;
  return v_id;
end;
$$;

grant execute on function public.admin_upsert_category(uuid, uuid, text) to anon;

-- Admin: upsert product
create or replace function public.admin_upsert_product(
  p_token uuid,
  p_id uuid,
  p_name text,
  p_description text,
  p_price numeric,
  p_category_id uuid,
  p_image_url text,
  p_stock integer,
  p_agotado boolean,
  p_is_active boolean
) returns uuid language plpgsql security definer as $$
declare
  v_id uuid;
begin
  if not public.admin_is_valid(p_token) then
    raise exception 'Token inválido';
  end if;

  if p_id is null then
    insert into public.products(name, description, price, category_id, image_url, stock, agotado, is_active)
    values (p_name, p_description, p_price, p_category_id, p_image_url, p_stock, coalesce(p_agotado,false), coalesce(p_is_active,true))
    returning id into v_id;
  else
    update public.products
    set name = p_name,
        description = p_description,
        price = p_price,
        category_id = p_category_id,
        image_url = p_image_url,
        stock = p_stock,
        agotado = coalesce(p_agotado,false),
        is_active = coalesce(p_is_active,true)
    where id = p_id
    returning id into v_id;
  end if;
  return v_id;
end;
$$;

grant execute on function public.admin_upsert_product(uuid, uuid, text, text, numeric, uuid, text, integer, boolean, boolean) to anon;

-- Admin: update order status
create or replace function public.admin_update_order_status(p_token uuid, p_order_id uuid, p_status order_status)
returns void language plpgsql security definer as $$
begin
  if not public.admin_is_valid(p_token) then
    raise exception 'Token inválido';
  end if;
  update public.orders set status = p_status where id = p_order_id;
end;
$$;

grant execute on function public.admin_update_order_status(uuid, uuid, order_status) to anon;

-- Admin: delete order
create or replace function public.admin_delete_order(p_token uuid, p_order_id uuid)
returns void language plpgsql security definer as $$
begin
  if not public.admin_is_valid(p_token) then
    raise exception 'Token inválido';
  end if;
  delete from public.orders where id = p_order_id;
end;
$$;

grant execute on function public.admin_delete_order(uuid, uuid) to anon;

-- Admin: list orders (basic)
create or replace function public.admin_list_orders(p_token uuid, p_limit int default 100)
returns table (
  id uuid,
  created_at timestamptz,
  customer_name text,
  customer_phone text,
  customer_address text,
  shipping_method shipping_method,
  delivery_zone text,
  shipping_fee numeric,
  status order_status,
  items_count integer,
  total_amount numeric
) language sql security definer as $$
  select o.id, o.created_at, o.customer_name, o.customer_phone, o.customer_address,
         o.shipping_method, o.delivery_zone, o.shipping_fee, o.status, o.items_count, o.total_amount
  from public.orders o
  where public.admin_is_valid(p_token)
  order by o.created_at desc
  limit p_limit;
$$;

grant execute on function public.admin_list_orders(uuid, int) to anon;

-- Public: create order (inserts header and items atomically)
create or replace function public.create_order(
  p_customer_name text,
  p_customer_phone text,
  p_customer_address text,
  p_shipping_method shipping_method,
  p_delivery_zone text,
  p_shipping_fee numeric,
  p_whatsapp_message text,
  p_whatsapp_url text,
  p_items jsonb
) returns uuid language plpgsql security definer as $$
declare
  v_order_id uuid;
  v_item jsonb;
  v_product_id uuid;
  v_qty int;
  v_price numeric;
  v_name text;
begin
  -- Insert order
  insert into public.orders(customer_name, customer_phone, customer_address, shipping_method, delivery_zone, shipping_fee, whatsapp_message, whatsapp_url)
  values (p_customer_name, p_customer_phone, p_customer_address, p_shipping_method, p_delivery_zone, coalesce(p_shipping_fee,0), p_whatsapp_message, p_whatsapp_url)
  returning id into v_order_id;

  -- Iterate items
  for v_item in select jsonb_array_elements(p_items) loop
    v_product_id := (v_item->>'product_id')::uuid;
    v_qty := (v_item->>'quantity')::int;
    v_price := (v_item->>'unit_price')::numeric;
    v_name := (v_item->>'name');

    -- Validate stock and mark agotado if needed
    update public.products set stock = stock - v_qty, agotado = (stock - v_qty) <= 0
    where id = v_product_id and stock >= v_qty;
    if not found then
      raise exception 'Stock insuficiente para producto %', v_product_id;
    end if;

    insert into public.order_items(order_id, product_id, name, unit_price, quantity)
    values (v_order_id, v_product_id, v_name, v_price, v_qty);
  end loop;

  -- Recompute totals
  perform public.orders_recompute_totals(v_order_id);
  return v_order_id;
end;
$$;

grant execute on function public.create_order(text, text, text, shipping_method, text, numeric, text, text, jsonb) to anon;

-- Seed helpers (optional): create default categories and an admin user
-- Hash password with: select crypt('TU_PASSWORD', gen_salt('bf'));
insert into public.categories(name) values
  ('Electrodomésticos') on conflict do nothing,
  ('Electrónicos') on conflict do nothing,
  ('Hogar') on conflict do nothing;

-- Example admin (replace hash)
-- insert into public.profiles(username, password_hash, role)
-- values ('admin', '$2a$10$REEMPLAZA_CON_HASH_GENERADO', 'admin');

-- Storage bucket (optional, for product images)
-- Public read, uploads via client (simple setup). Adjust in Dashboard for stricter control.
insert into storage.buckets(id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do nothing;

-- Allow public read on product-images bucket objects
create policy if not exists "Public read product-images"
  on storage.objects for select to public
  using (bucket_id = 'product-images');

-- Allow public insert on product-images bucket objects (for admin panel uploads)
create policy if not exists "Public insert product-images"
  on storage.objects for insert to public
  with check (bucket_id = 'product-images');