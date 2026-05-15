-- Instagram native publish (Meta Graph) — scheduled_posts alanları

alter table public.scheduled_posts
  add column if not exists instagram_media_id text,
  add column if not exists publish_error text,
  add column if not exists published_at timestamptz;

comment on column public.scheduled_posts.publish_status is
  'Yayın durumu: queued | publishing | published | failed (Instagram native); legacy Buffer değerleri de kalabilir.';
comment on column public.scheduled_posts.instagram_media_id is 'Meta Graph published media id.';
comment on column public.scheduled_posts.publish_error is 'Son yayın hatası (normalize edilmiş mesaj).';
comment on column public.scheduled_posts.published_at is 'Instagram''a başarıyla yayınlandığı zaman.';

create index if not exists scheduled_posts_user_published_at_idx
  on public.scheduled_posts (user_id, published_at desc nulls last)
  where published_at is not null;
