-- Nexora MVP şeması — Supabase SQL Editor veya CLI ile çalıştırın.

-- Genişletmeler
create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- public.users (auth.users ile eşleşen profil)
-- ---------------------------------------------------------------------------
create table if not exists public.users (
  id uuid primary key references auth.users (id) on delete cascade,
  email text,
  full_name text,
  product_description text,
  product_image_path text,
  onboarding_completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists users_onboarding_idx on public.users (onboarding_completed_at);

-- Yeni kullanıcıda satır oluştur
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.users (id, email, full_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(coalesce(new.email, ''), '@', 1))
  )
  on conflict (id) do update
    set email = excluded.email,
        updated_at = now();
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- updated_at tetikleyici
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists users_set_updated_at on public.users;
create trigger users_set_updated_at
  before update on public.users
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- growth_goals
-- ---------------------------------------------------------------------------
create table if not exists public.growth_goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  goal_key text not null,
  created_at timestamptz not null default now(),
  unique (user_id)
);

-- ---------------------------------------------------------------------------
-- connected_accounts
-- ---------------------------------------------------------------------------
create table if not exists public.connected_accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  platform text not null check (platform in ('instagram', 'tiktok')),
  handle text,
  status text not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, platform)
);

drop trigger if exists connected_accounts_set_updated_at on public.connected_accounts;
create trigger connected_accounts_set_updated_at
  before update on public.connected_accounts
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- ai_generations
-- ---------------------------------------------------------------------------
create table if not exists public.ai_generations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  goal text,
  product_description text,
  product_image_path text,
  caption text not null default '',
  hashtags text[] not null default '{}',
  content_idea text not null default '',
  short_video_idea text not null default '',
  model text not null default 'gpt-4o-mini',
  created_at timestamptz not null default now()
);

create index if not exists ai_generations_user_created_idx
  on public.ai_generations (user_id, created_at desc);

-- ---------------------------------------------------------------------------
-- scheduled_posts
-- ---------------------------------------------------------------------------
create table if not exists public.scheduled_posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  platform text not null,
  title text not null,
  body_preview text,
  scheduled_for timestamptz not null,
  status text not null default 'scheduled',
  source_ai_generation_id uuid references public.ai_generations (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists scheduled_posts_user_scheduled_idx
  on public.scheduled_posts (user_id, scheduled_for);

drop trigger if exists scheduled_posts_set_updated_at on public.scheduled_posts;
create trigger scheduled_posts_set_updated_at
  before update on public.scheduled_posts
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- analytics
-- ---------------------------------------------------------------------------
create table if not exists public.analytics (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  platform text not null,
  metric_date date not null default ((now() at time zone 'utc'))::date,
  impressions bigint not null default 0,
  reach bigint not null default 0,
  engagements bigint not null default 0,
  followers bigint not null default 0,
  meta jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique (user_id, platform, metric_date)
);

create index if not exists analytics_user_date_idx
  on public.analytics (user_id, metric_date desc);

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
alter table public.users enable row level security;
alter table public.growth_goals enable row level security;
alter table public.connected_accounts enable row level security;
alter table public.ai_generations enable row level security;
alter table public.scheduled_posts enable row level security;
alter table public.analytics enable row level security;

drop policy if exists "users_select_own" on public.users;
drop policy if exists "users_update_own" on public.users;
create policy "users_select_own" on public.users for select using (auth.uid() = id);
create policy "users_update_own" on public.users for update using (auth.uid() = id);

drop policy if exists "growth_goals_all_own" on public.growth_goals;
create policy "growth_goals_all_own" on public.growth_goals
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "connected_accounts_all_own" on public.connected_accounts;
create policy "connected_accounts_all_own" on public.connected_accounts
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "ai_generations_all_own" on public.ai_generations;
create policy "ai_generations_all_own" on public.ai_generations
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "scheduled_posts_all_own" on public.scheduled_posts;
create policy "scheduled_posts_all_own" on public.scheduled_posts
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "analytics_all_own" on public.analytics;
create policy "analytics_all_own" on public.analytics
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- Storage: product-images bucket (özel; signed URL ile erişim)
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', false)
on conflict (id) do nothing;

-- Mevcut politikaları temizle (idempotent tekrar çalıştırma)
drop policy if exists "product_images_select_own" on storage.objects;
drop policy if exists "product_images_insert_own" on storage.objects;
drop policy if exists "product_images_update_own" on storage.objects;
drop policy if exists "product_images_delete_own" on storage.objects;

create policy "product_images_select_own"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'product-images'
    and split_part(name, '/', 1) = auth.uid()::text
  );

create policy "product_images_insert_own"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'product-images'
    and split_part(name, '/', 1) = auth.uid()::text
  );

create policy "product_images_update_own"
  on storage.objects for update to authenticated
  using (
    bucket_id = 'product-images'
    and split_part(name, '/', 1) = auth.uid()::text
  );

create policy "product_images_delete_own"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'product-images'
    and split_part(name, '/', 1) = auth.uid()::text
  );
