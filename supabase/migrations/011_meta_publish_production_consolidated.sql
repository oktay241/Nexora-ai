-- ============================================================================
-- Nexora — Production Meta / Instagram publishing (consolidated, idempotent)
--
-- Defensive design:
-- * Partial / drifted databases may lack columns that older migrations assumed.
-- * Static UPDATE ... SET col = ... fails at parse/plan time if `col` is missing.
-- * All backfills that touch legacy or alias columns run only inside DO blocks that
--   check information_schema first, then use EXECUTE with a string literal so the
--   planner never sees absent column names.
-- * Triggers and functions that reference NEW.* are created ONLY after additive
--   DDL has ensured those columns exist (ADD COLUMN IF NOT EXISTS).
--
-- Safe targets: fresh DB, partial 009/010, production drift, re-runs.
-- ============================================================================

-- Migration bookkeeping (RLS: no policies)
create table if not exists public.nexora_schema_migrations (
  id text primary key,
  applied_at timestamptz not null default now()
);

alter table public.nexora_schema_migrations enable row level security;

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

-- set_updated_at trigger only when 001's helper exists
do $$
begin
  if exists (
    select 1 from pg_proc p
    join pg_namespace n on p.pronamespace = n.oid
    where p.proname = 'set_updated_at' and n.nspname = 'public'
  ) then
    execute 'drop trigger if exists connected_accounts_set_updated_at on public.connected_accounts';
    execute $tr$
      create trigger connected_accounts_set_updated_at
        before update on public.connected_accounts
        for each row execute function public.set_updated_at()
    $tr$;
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- public.connected_social_accounts
-- ---------------------------------------------------------------------------
-- Baseline row shape. IF NOT EXISTS skips when table already there (possibly wrong shape).
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

-- Compatibility: ensure every column migrations 009–011 rely on is present.
-- Handles "table exists from an old branch" with a subset of columns (no parse-time UPDATE).
alter table public.connected_social_accounts
  add column if not exists expires_at timestamptz,
  add column if not exists instagram_business_id text,
  add column if not exists token_expires_at timestamptz,
  add column if not exists instagram_business_account_id text,
  add column if not exists autopilot_enabled boolean not null default true,
  add column if not exists last_publish_at timestamptz,
  add column if not exists last_publish_status text;

-- ---------------------------------------------------------------------------
-- Backfills: token expiry mirror (expires_at <-> token_expires_at)
-- Both columns must exist before we reference them — guarded EXECUTE only.
-- ---------------------------------------------------------------------------
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'connected_social_accounts' and column_name = 'token_expires_at'
  ) and exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'connected_social_accounts' and column_name = 'expires_at'
  ) then
    execute $sql$
      update public.connected_social_accounts
      set token_expires_at = coalesce(token_expires_at, expires_at)
      where token_expires_at is null
        and expires_at is not null
    $sql$;
  end if;
end $$;

do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'connected_social_accounts' and column_name = 'token_expires_at'
  ) and exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'connected_social_accounts' and column_name = 'expires_at'
  ) then
    execute $sql$
      update public.connected_social_accounts
      set expires_at = coalesce(expires_at, token_expires_at)
      where expires_at is null
        and token_expires_at is not null
    $sql$;
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- Backfills: Instagram business user id mirror (legacy vs migration 011 name)
-- ---------------------------------------------------------------------------
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'connected_social_accounts' and column_name = 'instagram_business_account_id'
  ) and exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'connected_social_accounts' and column_name = 'instagram_business_id'
  ) then
    execute $sql$
      update public.connected_social_accounts
      set instagram_business_account_id = coalesce(instagram_business_account_id, instagram_business_id)
      where instagram_business_account_id is null
        and instagram_business_id is not null
    $sql$;
  end if;
end $$;

do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'connected_social_accounts' and column_name = 'instagram_business_account_id'
  ) and exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'connected_social_accounts' and column_name = 'instagram_business_id'
  ) then
    execute $sql$
      update public.connected_social_accounts
      set instagram_business_id = coalesce(instagram_business_id, instagram_business_account_id)
      where instagram_business_id is null
        and instagram_business_account_id is not null
    $sql$;
  end if;
end $$;

-- Runtime sync of alias pairs on INSERT/UPDATE (columns guaranteed above).
create or replace function public.nexora_connected_social_accounts_normalize()
returns trigger
language plpgsql
as $fn$
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
$fn$;

do $$
begin
  execute 'drop trigger if exists connected_social_accounts_normalize_biud on public.connected_social_accounts';
  execute $tr$
    create trigger connected_social_accounts_normalize_biud
      before insert or update on public.connected_social_accounts
      for each row execute function public.nexora_connected_social_accounts_normalize()
  $tr$;
end $$;

do $$
begin
  if exists (
    select 1 from pg_proc p
    join pg_namespace n on p.pronamespace = n.oid
    where p.proname = 'set_updated_at' and n.nspname = 'public'
  ) then
    execute 'drop trigger if exists connected_social_accounts_set_updated_at on public.connected_social_accounts';
    execute $tr$
      create trigger connected_social_accounts_set_updated_at
        before update on public.connected_social_accounts
        for each row execute function public.set_updated_at()
    $tr$;
  end if;
end $$;

create index if not exists connected_social_accounts_user_platform_idx
  on public.connected_social_accounts (user_id, platform);

comment on table public.connected_social_accounts is
  'OAuth tokens and platform ids for native publish (Meta Instagram, etc.).';

alter table public.connected_social_accounts enable row level security;

drop policy if exists "connected_social_accounts_all_own" on public.connected_social_accounts;
create policy "connected_social_accounts_all_own" on public.connected_social_accounts
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- public.scheduled_posts — only when table exists (001 may not have run in odd clones)
-- ---------------------------------------------------------------------------
do $$
begin
  if exists (
    select 1 from information_schema.tables
    where table_schema = 'public' and table_name = 'scheduled_posts'
  ) then
    execute $sql$
      alter table public.scheduled_posts
        add column if not exists source_ai_generation_id uuid,
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
        add column if not exists caption text
    $sql$;
  end if;
end $$;

-- Backfill generation_id from legacy FK column — both must exist.
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'scheduled_posts' and column_name = 'generation_id'
  ) and exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'scheduled_posts' and column_name = 'source_ai_generation_id'
  ) then
    execute $sql$
      update public.scheduled_posts
      set generation_id = coalesce(generation_id, source_ai_generation_id)
      where generation_id is null
        and source_ai_generation_id is not null
    $sql$;
  end if;
end $$;

create or replace function public.nexora_scheduled_posts_sync_generation()
returns trigger
language plpgsql
as $fn$
begin
  if new.generation_id is null and new.source_ai_generation_id is not null then
    new.generation_id := new.source_ai_generation_id;
  end if;
  if new.source_ai_generation_id is null and new.generation_id is not null then
    new.source_ai_generation_id := new.generation_id;
  end if;
  return new;
end;
$fn$;

do $$
begin
  if exists (
    select 1 from information_schema.tables
    where table_schema = 'public' and table_name = 'scheduled_posts'
  ) and exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'scheduled_posts' and column_name = 'generation_id'
  ) and exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'scheduled_posts' and column_name = 'source_ai_generation_id'
  ) then
    execute 'drop trigger if exists scheduled_posts_generation_sync_biud on public.scheduled_posts';
    execute $tr$
      create trigger scheduled_posts_generation_sync_biud
        before insert or update on public.scheduled_posts
        for each row execute function public.nexora_scheduled_posts_sync_generation()
    $tr$;
  end if;
end $$;

do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'scheduled_posts' and column_name = 'published_at'
  ) then
    execute $sql$
      create index if not exists scheduled_posts_user_published_at_idx
        on public.scheduled_posts (user_id, published_at desc nulls last)
        where published_at is not null
    $sql$;
  end if;
end $$;

do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'scheduled_posts' and column_name = 'generation_id'
  ) then
    execute $sql$
      create index if not exists scheduled_posts_generation_id_idx
        on public.scheduled_posts (generation_id)
        where generation_id is not null
    $sql$;
  end if;
end $$;

do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'scheduled_posts' and column_name = 'publish_status'
  ) then
    execute $sql$
      create index if not exists scheduled_posts_publish_status_idx
        on public.scheduled_posts (user_id, publish_status)
        where publish_status is not null
    $sql$;
  end if;
end $$;

do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'scheduled_posts' and column_name = 'buffer_post_id'
  ) then
    execute $sql$
      create index if not exists scheduled_posts_buffer_post_id_idx
        on public.scheduled_posts (buffer_post_id)
        where buffer_post_id is not null
    $sql$;
  end if;
end $$;

-- Optional FK: requires generation_id, ai_generations, and no conflicting constraint name
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'scheduled_posts' and column_name = 'generation_id'
  ) and exists (
    select 1 from information_schema.tables
    where table_schema = 'public' and table_name = 'ai_generations'
  ) and not exists (
    select 1 from pg_constraint where conname = 'scheduled_posts_generation_id_fkey'
  ) then
    execute $sql$
      alter table public.scheduled_posts
        add constraint scheduled_posts_generation_id_fkey
        foreign key (generation_id)
        references public.ai_generations (id)
        on delete set null
        not valid
    $sql$;
  end if;
end $$;

do $$
begin
  if exists (
    select 1
    from pg_constraint c
    join pg_class cl on c.conrelid = cl.oid
    where c.conname = 'scheduled_posts_generation_id_fkey'
      and cl.relname = 'scheduled_posts'
      and c.convalidated = false
  ) then
    execute 'alter table public.scheduled_posts validate constraint scheduled_posts_generation_id_fkey';
  end if;
exception
  when foreign_key_violation then null;
end $$;

-- ---------------------------------------------------------------------------
-- Schema report RPC (service_role only)
-- ---------------------------------------------------------------------------
create or replace function public.nexora_meta_schema_report()
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $fn$
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
    execute $cnt$
      select count(*)::int from public.connected_social_accounts where platform = 'instagram'
    $cnt$ into ig_count;
  end if;

  return jsonb_build_object(
    'migration_011_applied', coalesce(mig_ok, false),
    'schema_ok', schema_ok,
    'tables', out_tables,
    'connected_instagram_accounts_count', ig_count,
    'checked_at', to_jsonb(now())
  );
end;
$fn$;

revoke all on function public.nexora_meta_schema_report() from public;
grant execute on function public.nexora_meta_schema_report() to service_role;

-- Record success only after full script applied (idempotent re-run keeps same row)
insert into public.nexora_schema_migrations (id)
values ('011_meta_publish_production_consolidated')
on conflict (id) do nothing;

-- PostgREST / Supavisor: reload schema cache
notify pgrst, 'reload schema';

-- ============================================================================
-- Simulation notes (logical validation; run against disposable DBs):
-- 1) No legacy columns: create connected_social_accounts with only id,user_id,
--    platform,access_token,created_at,updated_at — re-run: ADD COLUMN fills gaps,
--    no UPDATE runs until both sides of a pair exist.
-- 2) Partial legacy: only expires_at (no token_expires_at) — first ALTER adds
--    token_expires_at; second DO block backfills from expires_at via EXECUTE.
-- 3) Fully migrated: all IF NOT EXISTS and DO checks pass; zero rows updated;
--    triggers replaced idempotently.
-- ============================================================================
