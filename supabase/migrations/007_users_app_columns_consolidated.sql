-- =============================================================================
-- Nexora: public.users — uygulamanın kullandığı tüm kolonlar (tek idempotent blok)
-- =============================================================================
-- Tarama kaynağı (2026): src/types/database.ts (UserRow), src/actions/onboarding.ts,
--   src/actions/ai-generation.ts, src/actions/creative-visual.ts,
--   src/lib/data/dashboard.ts, src/lib/data/user.ts,
--   src/app/dashboard/scheduling/page.tsx (getUserProfile → ai_strategy, persona, onboarding_completed_at)
-- Önkoşul: 001_initial_schema.sql (public.users tablosu + auth trigger). Bu dosya tabloyu
--   yeniden oluşturmaz; yalnızca kolon / indeks / yorum senkronu yapar.
-- =============================================================================

alter table public.users
  add column if not exists email text,
  add column if not exists full_name text,
  add column if not exists product_description text,
  add column if not exists product_image_path text,
  add column if not exists onboarding_completed_at timestamptz,
  add column if not exists created_at timestamptz not null default now(),
  add column if not exists updated_at timestamptz not null default now(),
  add column if not exists persona text,
  add column if not exists onboarding_context jsonb not null default '{}'::jsonb,
  add column if not exists content_niche text,
  add column if not exists content_tone text,
  add column if not exists target_audience text,
  add column if not exists target_platform text,
  add column if not exists brand_description text,
  add column if not exists ai_strategy jsonb not null default '{}'::jsonb,
  add column if not exists content_pillars jsonb not null default '[]'::jsonb,
  add column if not exists viral_hooks jsonb not null default '[]'::jsonb,
  add column if not exists usage_mode text,
  add column if not exists instagram_profile_input text,
  add column if not exists tiktok_profile_input text,
  add column if not exists profile_bio_note text,
  add column if not exists discovery_profile jsonb not null default '{}'::jsonb,
  add column if not exists growth_strategy jsonb not null default '{}'::jsonb;

comment on column public.users.id is 'auth.users ile eşleşen PK.';
comment on column public.users.email is 'Profil e-postası (auth ile senkron).';
comment on column public.users.full_name is 'Görünen ad.';
comment on column public.users.product_description is 'Ürün / hizmet metni (Creative Engine bağlamı).';
comment on column public.users.product_image_path is 'Storage product-images bucket göreli yolu.';
comment on column public.users.onboarding_completed_at is 'Kurulum tamamlandı zamanı.';
comment on column public.users.created_at is 'Satır oluşturulma.';
comment on column public.users.updated_at is 'Son güncelleme (trigger ile).';
comment on column public.users.persona is 'creator | ecommerce | personal_brand | business';
comment on column public.users.onboarding_context is 'Onboarding / operatör yapılandırılmış bağlam (JSON).';
comment on column public.users.content_niche is 'Denormalize: niş / kategori (discovery ile doldurulur).';
comment on column public.users.content_tone is 'Denormalize: iletişim tonu.';
comment on column public.users.target_audience is 'Denormalize: hedef kitle özeti.';
comment on column public.users.target_platform is 'Denormalize: hedef platformlar (metin).';
comment on column public.users.brand_description is 'Marka / uzmanlık özeti.';
comment on column public.users.ai_strategy is 'AI Growth OS strateji snapshot (JSON).';
comment on column public.users.content_pillars is 'İçerik sütunları (JSON dizi).';
comment on column public.users.viral_hooks is 'Viral hook listesi / strateji (JSON dizi).';
comment on column public.users.usage_mode is 'full_auto | approval_required';
comment on column public.users.instagram_profile_input is 'Instagram kullanıcı adı veya profil linki.';
comment on column public.users.tiktok_profile_input is 'TikTok kullanıcı adı veya link.';
comment on column public.users.profile_bio_note is 'Discovery için bio / özet.';
comment on column public.users.discovery_profile is 'AI Discovery Engine çıktısı (JSON).';
comment on column public.users.growth_strategy is 'AI Growth Strategy çıktısı (JSON).';

create index if not exists users_onboarding_idx on public.users (onboarding_completed_at);
create index if not exists users_persona_idx on public.users (persona) where persona is not null;
