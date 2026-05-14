-- Canonical AI creative assets table + planlı yayın strateji snapshot (Growth OS)
-- 005 sonrası: ai_creative_images → ai_creatives. Yeni kurulum: tablo yoksa oluşturulur.

do $$
begin
  if exists (
    select 1 from information_schema.tables
    where table_schema = 'public' and table_name = 'ai_creative_images'
  ) and not exists (
    select 1 from information_schema.tables
    where table_schema = 'public' and table_name = 'ai_creatives'
  ) then
    alter table public.ai_creative_images rename to ai_creatives;
  end if;
end $$;

create table if not exists public.ai_creatives (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  ai_generation_id uuid references public.ai_generations (id) on delete set null,
  storage_path text not null,
  prompt text,
  style_preset text,
  created_at timestamptz not null default now()
);

create index if not exists ai_creatives_user_created_idx
  on public.ai_creatives (user_id, created_at desc);

create index if not exists ai_creatives_generation_idx
  on public.ai_creatives (ai_generation_id)
  where ai_generation_id is not null;

alter table public.ai_creatives enable row level security;

drop policy if exists "ai_creative_images_all_own" on public.ai_creatives;
drop policy if exists "ai_creatives_all_own" on public.ai_creatives;

create policy "ai_creatives_all_own" on public.ai_creatives
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

alter table public.scheduled_posts
  add column if not exists operator_context jsonb;

comment on column public.scheduled_posts.operator_context is
  'Plan anındaki strateji / hook / AI reasoning snapshot (Creative Growth OS).';

comment on table public.ai_creatives is 'OpenAI vb. ile üretilen sosyal görseller; storage bucket ai-creatives.';
