-- Buffer Publish pipeline — Nexora scheduled_posts ile eşleştirme
-- Alanlar: buffer_post_id, buffer_channel_id, publish_status (Buffer PostStatus ile uyumlu metin)

alter table public.scheduled_posts
  add column if not exists buffer_post_id text,
  add column if not exists buffer_channel_id text,
  add column if not exists publish_status text;

comment on column public.scheduled_posts.buffer_post_id is 'Buffer GraphQL Post id (Mongo ObjectId string).';
comment on column public.scheduled_posts.buffer_channel_id is 'Buffer channel id bu yayın için.';
comment on column public.scheduled_posts.publish_status is 'Buffer yaşam döngüsü: draft, needs_approval, scheduled, sending, sent, error.';

create index if not exists scheduled_posts_buffer_post_id_idx
  on public.scheduled_posts (buffer_post_id)
  where buffer_post_id is not null;

create index if not exists scheduled_posts_user_buffer_idx
  on public.scheduled_posts (user_id, buffer_post_id)
  where buffer_post_id is not null;
