-- Run this once after the main schema to enable shared admin state syncing.
create table if not exists public.admin_users (
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

create table if not exists public.app_public_state (
  id text primary key check (id = 'main'),
  state jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create table if not exists public.app_private_state (
  id text primary key check (id = 'main'),
  state jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.app_public_state enable row level security;
alter table public.app_private_state enable row level security;

create policy "public reads app state" on public.app_public_state
  for select using (true);

create policy "admin manages public app state" on public.app_public_state
  for all using (public.is_admin()) with check (public.is_admin());

create policy "admin manages private app state" on public.app_private_state
  for all using (public.is_admin()) with check (public.is_admin());

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'app_public_state'
  ) then
    alter publication supabase_realtime add table public.app_public_state;
  end if;
end $$;
