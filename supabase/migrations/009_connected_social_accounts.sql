-- Meta / Instagram OAuth token persistence (server-side publish pipeline)

create table if not exists public.connected_social_accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  platform text not null check (platform in ('instagram', 'tiktok')),
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
  updated_at timestamptz not null default now(),
  unique (user_id, platform)
);

drop trigger if exists connected_social_accounts_set_updated_at on public.connected_social_accounts;
create trigger connected_social_accounts_set_updated_at
  before update on public.connected_social_accounts
  for each row execute function public.set_updated_at();

create index if not exists connected_social_accounts_user_platform_idx
  on public.connected_social_accounts (user_id, platform);

comment on table public.connected_social_accounts is 'OAuth tokens and platform ids for native publish (Meta Instagram, etc.).';
comment on column public.connected_social_accounts.account_type is 'Instagram account_type from Graph API (BUSINESS, MEDIA_CREATOR, PERSONAL, …).';

alter table public.connected_social_accounts enable row level security;

drop policy if exists "connected_social_accounts_all_own" on public.connected_social_accounts;
create policy "connected_social_accounts_all_own" on public.connected_social_accounts
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
