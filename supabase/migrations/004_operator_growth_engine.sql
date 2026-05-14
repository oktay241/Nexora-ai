-- Tam otonom growth operatörü: kullanım modu, sosyal girdiler, discovery & strateji jsonb

alter table public.users
  add column if not exists usage_mode text,
  add column if not exists instagram_profile_input text,
  add column if not exists tiktok_profile_input text,
  add column if not exists profile_bio_note text,
  add column if not exists discovery_profile jsonb not null default '{}'::jsonb,
  add column if not exists growth_strategy jsonb not null default '{}'::jsonb;

comment on column public.users.usage_mode is 'full_auto | approval_required';
comment on column public.users.instagram_profile_input is 'Kullanıcı adı veya profil linki (MVP metin).';
comment on column public.users.tiktok_profile_input is 'TikTok kullanıcı adı veya link (MVP metin).';
comment on column public.users.profile_bio_note is 'Discovery için yapıştırılan bio / özet.';
comment on column public.users.discovery_profile is 'AI Discovery Engine çıktısı (JSON).';
comment on column public.users.growth_strategy is 'AI Growth Strategy çıktısı (JSON).';
