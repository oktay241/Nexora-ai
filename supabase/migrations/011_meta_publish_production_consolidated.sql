-- ============================================================================
-- Nexora — Production Meta / Instagram publishing (consolidated, idempotent)
-- Safe for existing production: IF NOT EXISTS, additive only, no data drops.
-- Run once after 001–010 (or on greenfield). Ends with PostgREST schema reload.
-- ============================================================================

-- Migration bookkeeping (RLS: no policies — not readable via anon JWT)
create table if not exists public.nexora_schema_migrations (
  id text primary key,
  applied_at timestamptz not null default now()
);

alter table public.nexora_schema_migrations enable row level security;

insert into public.nexora_schema_migrations (id)
values ('011_meta_publish_production_consolidated')
on conflict (id) do nothing;

-- ---------------------------------------------------------------------------
-- public.connected_accounts — ensure base shape (001 may already exist)
-- ---------------------------------------------------------------------------
create table if not exists public.connected_accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  platform text not null,
  handle text,
  status text not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Legacy installs: add platform check only if not already present
do $$
begin
  if not exists (
    select 1 from pg_constraint c
    join pg_class t on c.conrelid = t.oid
    where t.relname = 'connected_accounts' and c.conname = 'connected_accounts_platform_check'
  ) then
    alter table public.connected_accounts
      add constraint connected_accounts_platform_check
      check (platform in ('instagram', 'tiktok'));
  end if;
exception
  when duplicate_object then null;
end $$;

-- Uniqueness (user_id, platform) is enforced by migrations 001 / 009 — do not duplicate here.

drop trigger if exists connected_accounts_set_updated_at on public.connected_accounts;
create trigger connected_accounts_set_updated_at
  before update on public.connected_accounts
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- public.connected_social_accounts
-- ---------------------------------------------------------------------------
create table if not exists public.connected_social_accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  platform text not null,
  platform_user_id text,
  username text,
  access_token text not null,
  refresh_token text,
  expires_at timestamptz,
  token_type text default 'Bearer',
  meta_page_id text,
  instagram_business_id text,
  account_type text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

do $$
begin
  if not exists (
    select 1 from pg_constraint c
    join pg_class t on c.conrelid = t.oid
    where t.relname = 'connected_social_accounts' and c.conname = 'connected_social_accounts_platform_check'
  ) then
    alter table public.connected_social_accounts
      add constraint connected_social_accounts_platform_check
      check (platform in ('instagram', 'tiktok'));
  end if;
exception
  when duplicate_object then null;
end $$;

-- Uniqueness (user_id, platform) from migration 009 — do not duplicate here.

-- New / aliased columns (production drift safety)
alter table public.connected_social_accounts
  add column if not exists token_expires_at timestamptz;

alter table public.connected_social_accounts
  add column if not exists instagram_business_account_id text;

alter table public.connected_social_accounts
  add column if not exists autopilot_enabled boolean not null default true;

alter table public.connected_social_accounts
  add column if not exists last_publish_at timestamptz;

alter table public.connected_social_accounts
  add column if not exists last_publish_status text;

-- Backfill mirrors
update public.connected_social_accounts
set token_expires_at = coalesce(token_expires_at, expires_at)
where token_expires_at is null and expires_at is not null;

update public.connected_social_accounts
set expires_at = coalesce(expires_at, token_expires_at)
where expires_at is null and token_expires_at is not null;

update public.connected_social_accounts
set instagram_business_account_id = coalesce(instagram_business_account_id, instagram_business_id)
where instagram_business_account_id is null and instagram_business_id is not null;

update public.connected_social_accounts
set instagram_business_id = coalesce(instagram_business_id, instagram_business_account_id)
where instagram_business_id is null and instagram_business_account_id is not null;

-- Normalize token + IG id aliases on every write
create or replace function public.nexora_connected_social_accounts_normalize()
returns trigger
language plpgsql
as $$
begin
  if new.token_expires_at is not null and new.expires_at is null then
    new.expires_at := new.token_expires_at;
  elsif new.expires_at is not null and new.token_expires_at is null then
    new.token_expires_at := new.expires_at;
  end if;

  if new.instagram_business_account_id is not null and new.instagram_business_id is null then
    new.instagram_business_id := new.instagram_business_account_id;
  elsif new.instagram_business_id is not null and new.instagram_business_account_id is null then
    new.instagram_business_account_id := new.instagram_business_id;
  end if;

  return new;
end;
$$;

drop trigger if exists connected_social_accounts_normalize_biud on public.connected_social_accounts;
create trigger connected_social_accounts_normalize_biud
  before insert or update on public.connected_social_accounts
  for each row execute function public.nexora_connected_social_accounts_normalize();

drop trigger if exists connected_social_accounts_set_updated_at on public.connected_social_accounts;
create trigger connected_social_accounts_set_updated_at
  before update on public.connected_social_accounts
  for each row execute function public.set_updated_at();

create index if not exists connected_social_accounts_user_platform_idx
  on public.connected_social_accounts (user_id, platform);

comment on table public.connected_social_accounts is
  'OAuth tokens and platform ids for native publish (Meta Instagram, etc.).';

alter table public.connected_social_accounts enable row level security;

drop policy if exists "connected_social_accounts_all_own" on public.connected_social_accounts;
create policy "connected_social_accounts_all_own" on public.connected_social_accounts
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- public.scheduled_posts — publish queue columns
-- ---------------------------------------------------------------------------
alter table public.scheduled_posts
  add column if not exists instagram_media_id text,
  add column if not exists publish_error text,
  add column if not exists published_at timestamptz,
  add column if not exists publish_status text,
  add column if not exists buffer_post_id text,
  add column if not exists buffer_channel_id text,
  add column if not exists operator_context jsonb,
  add column if not exists persona text,
  add column if not exists creative_type text,
  add column if not exists generation_id uuid,
  add column if not exists image_url text,
  add column if not exists caption text;

update public.scheduled_posts
set generation_id = coalesce(generation_id, source_ai_generation_id)
where generation_id is null and source_ai_generation_id is not null;

create or replace function public.nexora_scheduled_posts_sync_generation()
returns trigger
language plpgsql
as $$
begin
  if new.generation_id is null and new.source_ai_generation_id is not null then
    new.generation_id := new.source_ai_generation_id;
  end if;
  if new.source_ai_generation_id is null and new.generation_id is not null then
    new.source_ai_generation_id := new.generation_id;
  end if;
  return new;
end;
$$;

drop trigger if exists scheduled_posts_generation_sync_biud on public.scheduled_posts;
create trigger scheduled_posts_generation_sync_biud
  before insert or update on public.scheduled_posts
  for each row execute function public.nexora_scheduled_posts_sync_generation();

create index if not exists scheduled_posts_user_published_at_idx
  on public.scheduled_posts (user_id, published_at desc nulls last)
  where published_at is not null;

create index if not exists scheduled_posts_generation_id_idx
  on public.scheduled_posts (generation_id)
  where generation_id is not null;

create index if not exists scheduled_posts_publish_status_idx
  on public.scheduled_posts (user_id, publish_status)
  where publish_status is not null;

create index if not exists scheduled_posts_buffer_post_id_idx
  on public.scheduled_posts (buffer_post_id)
  where buffer_post_id is not null;

-- Optional FK (skip validation errors on legacy bad rows)
do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'scheduled_posts_generation_id_fkey'
  ) then
    alter table public.scheduled_posts
      add constraint scheduled_posts_generation_id_fkey
      foreign key (generation_id)
      references public.ai_generations (id)
      on delete set null
      not valid;
  end if;
end $$;

-- Try validate when data is clean (ignore failure)
do $$
begin
  alter table public.scheduled_posts validate constraint scheduled_posts_generation_id_fkey;
exception
  when foreign_key_violation then null;
end $$;

-- ---------------------------------------------------------------------------
-- Schema report RPC (service_role only — introspection for ops / debug API)
-- ---------------------------------------------------------------------------
create or replace function public.nexora_meta_schema_report()
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  exp jsonb := '{
    "connected_social_accounts": [
      "id", "user_id", "platform", "platform_user_id", "username", "account_type",
      "access_token", "refresh_token", "token_expires_at", "expires_at", "token_type",
      "meta_page_id", "instagram_business_account_id", "instagram_business_id",
      "autopilot_enabled", "last_publish_at", "last_publish_status", "created_at", "updated_at"
    ],
    "connected_accounts": [
      "id", "user_id", "platform", "handle", "status", "created_at", "updated_at"
    ],
    "scheduled_posts": [
      "id", "user_id", "platform", "title", "body_preview", "scheduled_for", "status",
      "source_ai_generation_id", "generation_id", "image_url", "caption",
      "created_at", "updated_at", "instagram_media_id", "publish_error", "published_at",
      "publish_status", "buffer_post_id", "buffer_channel_id", "operator_context",
      "persona", "creative_type"
    ]
  }'::jsonb;
  tbl text;
  r record;
  expected_cols jsonb;
  col text;
  missing_arr text[] := array[]::text[];
  table_report jsonb;
  out_tables jsonb := '{}'::jsonb;
  exists_tbl boolean;
  actual_cols text[];
  ig_count integer := 0;
  mig_ok boolean;
  schema_ok boolean := true;
begin
  select exists(
    select 1 from public.nexora_schema_migrations
    where id = '011_meta_publish_production_consolidated'
  ) into mig_ok;

  for r in select * from jsonb_each(exp)
  loop
    tbl := r.key;
    expected_cols := r.value;
    select exists(
      select 1 from information_schema.tables
      where table_schema = 'public' and table_name = tbl
    ) into exists_tbl;

    actual_cols := array[]::text[];
    missing_arr := array[]::text[];

    if exists_tbl then
      select coalesce(array_agg(column_name::text order by column_name), array[]::text[])
      into actual_cols
      from information_schema.columns
      where table_schema = 'public' and table_name = tbl;
    end if;

    if exists_tbl then
      for col in select jsonb_array_elements_text(expected_cols)
      loop
        if not (col = any (actual_cols)) then
          missing_arr := array_append(missing_arr, col);
        end if;
      end loop;
    elsif expected_cols is not null then
      for col in select jsonb_array_elements_text(expected_cols)
      loop
        missing_arr := array_append(missing_arr, col);
      end loop;
    end if;

    table_report := jsonb_build_object(
      'exists', exists_tbl,
      'column_count', coalesce(array_length(actual_cols, 1), 0),
      'missing_columns', coalesce(to_jsonb(missing_arr), '[]'::jsonb)
    );

    out_tables := out_tables || jsonb_build_object(tbl, table_report);

    if not exists_tbl or coalesce(array_length(missing_arr, 1), 0) > 0 then
      schema_ok := false;
    end if;
  end loop;

  if exists (
    select 1 from information_schema.tables
    where table_schema = 'public' and table_name = 'connected_social_accounts'
  ) then
    select count(*)::int into ig_count
    from public.connected_social_accounts
    where platform = 'instagram';
  end if;

  return jsonb_build_object(
    'migration_011_applied', coalesce(mig_ok, false),
    'schema_ok', schema_ok,
    'tables', out_tables,
    'connected_instagram_accounts_count', ig_count,
    'checked_at', to_jsonb(now())
  );
end;
$$;

revoke all on function public.nexora_meta_schema_report() from public;
grant execute on function public.nexora_meta_schema_report() to service_role;

-- PostgREST / Supavisor: reload schema cache
notify pgrst, 'reload schema';
