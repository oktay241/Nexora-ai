-- AI Creative görsel üretimleri (sosyal optimize görseller, Supabase Storage)

create table if not exists public.ai_creative_images (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  ai_generation_id uuid references public.ai_generations (id) on delete set null,
  storage_path text not null,
  prompt text,
  style_preset text,
  created_at timestamptz not null default now()
);

create index if not exists ai_creative_images_user_created_idx
  on public.ai_creative_images (user_id, created_at desc);

create index if not exists ai_creative_images_generation_idx
  on public.ai_creative_images (ai_generation_id)
  where ai_generation_id is not null;

alter table public.ai_creative_images enable row level security;

drop policy if exists "ai_creative_images_all_own" on public.ai_creative_images;
create policy "ai_creative_images_all_own" on public.ai_creative_images
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Storage: ai-creatives (özel; signed URL)
insert into storage.buckets (id, name, public)
values ('ai-creatives', 'ai-creatives', false)
on conflict (id) do nothing;

drop policy if exists "ai_creatives_select_own" on storage.objects;
drop policy if exists "ai_creatives_insert_own" on storage.objects;
drop policy if exists "ai_creatives_update_own" on storage.objects;
drop policy if exists "ai_creatives_delete_own" on storage.objects;

create policy "ai_creatives_select_own"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'ai-creatives'
    and split_part(name, '/', 1) = auth.uid()::text
  );

create policy "ai_creatives_insert_own"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'ai-creatives'
    and split_part(name, '/', 1) = auth.uid()::text
  );

create policy "ai_creatives_update_own"
  on storage.objects for update to authenticated
  using (
    bucket_id = 'ai-creatives'
    and split_part(name, '/', 1) = auth.uid()::text
  );

create policy "ai_creatives_delete_own"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'ai-creatives'
    and split_part(name, '/', 1) = auth.uid()::text
  );
