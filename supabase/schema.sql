-- GO Manager schema for Supabase/Postgres.
-- The public anon role can discover open GOs and create claims/payment proofs.
-- Admin writes and private reads require the authenticated admin email.

create extension if not exists pgcrypto;

create table public.app_public_state (
  id text primary key check (id = 'main'),
  state jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create table public.app_private_state (
  id text primary key check (id = 'main'),
  state jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create table public.settings (
  id uuid primary key default gen_random_uuid(),
  organiser_name text not null default 'GO Manager',
  instagram_handle text not null default '@go.manager',
  currency text not null default 'NZD',
  secure_threshold numeric not null default 0.67 check (secure_threshold > 0 and secure_threshold <= 1),
  payment_methods jsonb not null default '[]'::jsonb,
  fee_rates jsonb not null default '{"stamped":4.50,"tracked":8.50,"per_card":0.35}'::jsonb,
  updated_at timestamptz not null default now()
);

create table public.group_orders (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  artist text not null,
  category text not null check (category in ('Photocard','Album','Merch')),
  description text not null default '',
  private_note text,
  deadline date not null,
  payment_deadline date not null,
  sets_on_hand integer not null default 0 check (sets_on_hand >= 0),
  status text not null default 'open' check (status in ('open','closed','archived')),
  auto_release_unsecured boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.go_items (
  id uuid primary key default gen_random_uuid(),
  group_order_id uuid not null references public.group_orders(id) on delete cascade,
  name text not null,
  kind text not null check (kind in ('set','batch','merch')),
  price numeric(10,2) not null check (price >= 0),
  stock integer,
  batch_size integer,
  minimum_slots integer,
  threshold numeric check (threshold is null or (threshold > 0 and threshold <= 1)),
  set_count integer check (set_count is null or set_count >= 0),
  close_date date,
  payment_date date,
  image_path text,
  options jsonb not null default '[]'::jsonb,
  sort_order integer not null default 0
);

create table public.claims (
  id uuid primary key default gen_random_uuid(),
  group_order_id uuid not null references public.group_orders(id) on delete cascade,
  go_item_id uuid not null references public.go_items(id) on delete cascade,
  instagram_username text not null,
  selections jsonb not null default '{}'::jsonb,
  amount numeric(10,2) not null default 0,
  status text not null default 'pending' check (status in ('pending','secured','not_secured','paid','ordered','arrived','ready','shipped','released')),
  private_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.shop_listings (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text not null check (category in ('Album','Photocard','Merch','Accessories')),
  description text not null default '',
  price numeric(10,2) not null check (price >= 0),
  stock integer not null default 0 check (stock >= 0),
  image_path text,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.shop_orders (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.shop_listings(id),
  instagram_username text not null,
  quantity integer not null check (quantity > 0),
  amount numeric(10,2) not null,
  status text not null default 'pending',
  created_at timestamptz not null default now()
);

create table public.payment_proofs (
  id uuid primary key default gen_random_uuid(),
  instagram_username text not null,
  amount numeric(10,2) not null check (amount > 0),
  method text not null,
  reference text not null,
  screenshot_path text,
  go_ids uuid[] not null default '{}',
  status text not null default 'pending' check (status in ('pending','confirmed','rejected')),
  submitted_at timestamptz not null default now(),
  reviewed_at timestamptz
);

create table public.credits (
  instagram_username text primary key,
  amount numeric(10,2) not null default 0 check (amount >= 0),
  updated_at timestamptz not null default now()
);

create table public.shipment_requests (
  id uuid primary key default gen_random_uuid(),
  instagram_username text not null,
  claim_ids uuid[] not null default '{}',
  shop_order_ids uuid[] not null default '{}',
  address jsonb not null,
  method text not null check (method in ('stamped','tracked')),
  combine_orders boolean not null default true,
  fee numeric(10,2) not null default 0,
  status text not null default 'requested',
  tracking_number text,
  created_at timestamptz not null default now()
);

create table public.store_orders (
  id uuid primary key default gen_random_uuid(),
  vendor text not null,
  description text not null,
  cost numeric(10,2) not null default 0,
  tracking_number text,
  arrival_status text not null default 'ordered',
  created_at timestamptz not null default now()
);

create table public.blocked_users (
  instagram_username text primary key,
  reason text not null,
  created_at timestamptz not null default now()
);

create table public.rules (
  id boolean primary key default true,
  markdown text not null default '',
  updated_at timestamptz not null default now()
);

create table public.claim_edit_log (
  id uuid primary key default gen_random_uuid(),
  claim_id uuid not null references public.claims(id) on delete cascade,
  action text not null,
  before_data jsonb,
  after_data jsonb,
  admin_email text not null default auth.email(),
  created_at timestamptz not null default now()
);

create table public.admin_users (
  email text primary key,
  created_at timestamptz not null default now()
);

alter table public.admin_users enable row level security;

create or replace function public.is_admin() returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.admin_users
    where lower(email) = lower(coalesce(auth.jwt() ->> 'email', ''))
  )
$$;

alter table public.settings enable row level security;
alter table public.app_public_state enable row level security;
alter table public.app_private_state enable row level security;
alter table public.group_orders enable row level security;
alter table public.go_items enable row level security;
alter table public.claims enable row level security;
alter table public.shop_listings enable row level security;
alter table public.shop_orders enable row level security;
alter table public.payment_proofs enable row level security;
alter table public.credits enable row level security;
alter table public.shipment_requests enable row level security;
alter table public.store_orders enable row level security;
alter table public.blocked_users enable row level security;
alter table public.rules enable row level security;
alter table public.claim_edit_log enable row level security;
alter table public.admin_users enable row level security;

create policy "public reads open orders" on public.group_orders for select using (status = 'open' or public.is_admin());
create policy "public reads app state" on public.app_public_state for select using (true);
create policy "admin manages public app state" on public.app_public_state for all using (public.is_admin()) with check (public.is_admin());
create policy "admin manages private app state" on public.app_private_state for all using (public.is_admin()) with check (public.is_admin());
create policy "public reads open items" on public.go_items for select using (exists (select 1 from public.group_orders g where g.id = group_order_id and (g.status = 'open' or public.is_admin())));
create policy "admin manages orders" on public.group_orders for all using (public.is_admin()) with check (public.is_admin());
create policy "admin manages items" on public.go_items for all using (public.is_admin()) with check (public.is_admin());
create policy "public creates claims" on public.claims for insert with check (not exists (select 1 from public.blocked_users b where lower(b.instagram_username) = lower(instagram_username)));
create policy "admin sees claims" on public.claims for select using (public.is_admin());
create policy "admin edits claims" on public.claims for update using (public.is_admin()) with check (public.is_admin());
create policy "public sees active shop" on public.shop_listings for select using (active = true or public.is_admin());
create policy "admin manages shop" on public.shop_listings for all using (public.is_admin()) with check (public.is_admin());
create policy "public creates shop orders" on public.shop_orders for insert with check (true);
create policy "admin manages shop orders" on public.shop_orders for all using (public.is_admin()) with check (public.is_admin());
create policy "public submits payment proof" on public.payment_proofs for insert with check (true);
create policy "admin manages payments" on public.payment_proofs for all using (public.is_admin()) with check (public.is_admin());
create policy "admin reads credits" on public.credits for select using (public.is_admin());
create policy "admin manages credits" on public.credits for all using (public.is_admin()) with check (public.is_admin());
create policy "public creates shipment requests" on public.shipment_requests for insert with check (true);
create policy "admin manages shipments" on public.shipment_requests for all using (public.is_admin()) with check (public.is_admin());
create policy "admin manages store orders" on public.store_orders for all using (public.is_admin()) with check (public.is_admin());
create policy "admin manages blocked users" on public.blocked_users for all using (public.is_admin()) with check (public.is_admin());
create policy "public reads rules" on public.rules for select using (true);
create policy "admin manages rules" on public.rules for all using (public.is_admin()) with check (public.is_admin());
create policy "admin reads edit log" on public.claim_edit_log for select using (public.is_admin());
create policy "admin writes edit log" on public.claim_edit_log for insert with check (public.is_admin());

insert into public.settings (organiser_name, instagram_handle) values ('GO Manager', '@go.manager') on conflict do nothing;
insert into public.rules (id, markdown) values (true, '# House rules') on conflict do nothing;
alter database postgres
set app.admin_email = 'shylajwalton@gmail.com';