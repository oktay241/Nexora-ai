-- Nexora: AI Creative Engine + denormalized profil alanları
-- Idempotent, mevcut satırları korur; IF NOT EXISTS / ADD COLUMN IF NOT EXISTS kullanır.
-- Önkoşul: 001 (tablolar). 002 ile çakışan ADD'ler tekrar çalıştırılabilir (IF NOT EXISTS).

-- ---------------------------------------------------------------------------
-- public.users — persona / onboarding (002 ile uyumlu) + strateji kolonları
-- ---------------------------------------------------------------------------
alter table public.users
  add column if not exists persona text,
  add column if not exists onboarding_context jsonb not null default '{}'::jsonb,
  add column if not exists content_niche text,
  add column if not exists content_tone text,
  add column if not exists target_audience text,
  add column if not exists target_platform text,
  add column if not exists brand_description text,
  add column if not exists ai_strategy jsonb not null default '{}'::jsonb,
  add column if not exists content_pillars jsonb not null default '[]'::jsonb,
  add column if not exists viral_hooks jsonb not null default '[]'::jsonb;

comment on column public.users.onboarding_context is 'Onboarding adımlarından gelen yapılandırılmış bağlam (JSON).';
comment on column public.users.persona is 'creator | ecommerce | personal_brand | business';
comment on column public.users.content_niche is 'Denormalize: niş / kategori özeti (sorgu ve rapor için).';
comment on column public.users.content_tone is 'Denormalize: içerik veya iletişim tonu.';
comment on column public.users.target_audience is 'Denormalize: hedef kitle özeti.';
comment on column public.users.target_platform is 'Denormalize: hedef platformlar (metin özeti).';
comment on column public.users.brand_description is 'Marka / ürün hikayesi veya uzmanlık özeti (ürün açıklamasından bağımsız geniş alan).';
comment on column public.users.ai_strategy is 'Son AI strateji özeti (Creative Engine meta + özet).';
comment on column public.users.content_pillars is 'İçerik sütunları / carousel hatları (JSON dizi).';
comment on column public.users.viral_hooks is 'Son üretilen hook listesi (JSON dizi).';

-- ---------------------------------------------------------------------------
-- public.ai_generations — Creative Engine paketi + tip etiketi
-- ---------------------------------------------------------------------------
alter table public.ai_generations
  add column if not exists creative_pack jsonb,
  add column if not exists persona text,
  add column if not exists creative_type text;

comment on column public.ai_generations.creative_pack is 'Tam Creative Engine JSON çıktısı (caption alanları + viralIdeas vb.).';
comment on column public.ai_generations.persona is 'Üretim anındaki kullanıcı persona değeri.';
comment on column public.ai_generations.creative_type is 'Üretim türü etiketi (örn. creative_engine_v1).';

-- ---------------------------------------------------------------------------
-- public.scheduled_posts — planlı içeriğin persona / tür bağlamı
-- ---------------------------------------------------------------------------
alter table public.scheduled_posts
  add column if not exists persona text,
  add column if not exists creative_type text;

comment on column public.scheduled_posts.persona is 'Plan oluşturulurken kullanıcı persona (isteğe bağlı).';
comment on column public.scheduled_posts.creative_type is 'İçerik formatı / üretim kaynağı etiketi (örn. scheduled_hook).';

-- ---------------------------------------------------------------------------
-- public.analytics — genişletilmiş sosyal metrikler (varsayılan 0, upsert güvenli)
-- ---------------------------------------------------------------------------
alter table public.analytics
  add column if not exists saves bigint not null default 0,
  add column if not exists shares bigint not null default 0,
  add column if not exists profile_visits bigint not null default 0,
  add column if not exists video_views bigint not null default 0;

comment on column public.analytics.saves is 'Kaydetme sayısı (platformdan gelince doldurulur).';
comment on column public.analytics.shares is 'Paylaşım sayısı.';
comment on column public.analytics.profile_visits is 'Profil görüntülenmesi.';
comment on column public.analytics.video_views is 'Video görüntülenmesi.';

-- ---------------------------------------------------------------------------
-- Güvenli geri doldurma (yalnızca boş alanları onboarding_context / üretimden türetir)
-- ---------------------------------------------------------------------------
update public.users
set persona = coalesce(nullif(trim(persona), ''), 'creator')
where persona is null or trim(persona) = '';

update public.users u
set
  content_niche = coalesce(
    nullif(trim(coalesce(u.content_niche, '')), ''),
    nullif(trim(coalesce(u.onboarding_context ->> 'niche', '')), ''),
    nullif(trim(coalesce(u.onboarding_context ->> 'content_category', '')), '')
  ),
  content_tone = coalesce(
    nullif(trim(coalesce(u.content_tone, '')), ''),
    nullif(trim(coalesce(u.onboarding_context ->> 'tone', '')), ''),
    nullif(trim(coalesce(u.onboarding_context ->> 'content_tone', '')), ''),
    nullif(trim(coalesce(u.onboarding_context ->> 'content_tone_biz', '')), '')
  ),
  target_audience = coalesce(
    nullif(trim(coalesce(u.target_audience, '')), ''),
    nullif(trim(coalesce(u.onboarding_context ->> 'target_audience', '')), ''),
    nullif(trim(coalesce(u.onboarding_context ->> 'target_audience_pb', '')), '')
  ),
  target_platform = coalesce(
    nullif(trim(coalesce(u.target_platform, '')), ''),
    nullif(trim(coalesce(u.onboarding_context ->> 'target_platforms', '')), '')
  ),
  brand_description = coalesce(
    nullif(trim(coalesce(u.brand_description, '')), ''),
    nullif(trim(coalesce(u.onboarding_context ->> 'product_description', '')), ''),
    nullif(trim(coalesce(u.onboarding_context ->> 'expertise_area', '')), ''),
    nullif(trim(coalesce(u.onboarding_context ->> 'brand_sector', '')), ''),
    nullif(trim(coalesce(u.product_description, '')), '')
  )
where u.onboarding_context is not null
  and u.onboarding_context <> '{}'::jsonb;

update public.ai_generations
set creative_type = 'creative_engine_v1'
where creative_type is null
  and creative_pack is not null;

-- creative_pack içinden kullanıcıya son hook / pillar özetini taşı (yalnızca users viral_hooks/content_pillars boşsa)
with latest as (
  select distinct on (g.user_id)
    g.user_id,
    g.creative_pack,
    g.created_at
  from public.ai_generations g
  where g.creative_pack is not null
    and jsonb_typeof(g.creative_pack) = 'object'
  order by g.user_id, g.created_at desc
)
update public.users u
set
  viral_hooks = case
    when u.viral_hooks is null
      or u.viral_hooks = '[]'::jsonb
      or coalesce(jsonb_array_length(u.viral_hooks), 0) = 0
    then
      case
        when jsonb_typeof(l.creative_pack -> 'hooks') = 'array'
        then l.creative_pack -> 'hooks'
        else '[]'::jsonb
      end
    else u.viral_hooks
  end,
  content_pillars = case
    when u.content_pillars is null
      or u.content_pillars = '[]'::jsonb
      or coalesce(jsonb_array_length(u.content_pillars), 0) = 0
    then
      case
        when jsonb_typeof(l.creative_pack -> 'carouselIdeas') = 'array'
        then l.creative_pack -> 'carouselIdeas'
        else '[]'::jsonb
      end
    else u.content_pillars
  end
from latest l
where u.id = l.user_id;

-- ---------------------------------------------------------------------------
-- İndeksler (sorgu performansı; IF NOT EXISTS)
-- ---------------------------------------------------------------------------
create index if not exists users_persona_idx
  on public.users (persona)
  where persona is not null;

create index if not exists ai_generations_user_persona_created_idx
  on public.ai_generations (user_id, persona, created_at desc);

create index if not exists scheduled_posts_user_persona_idx
  on public.scheduled_posts (user_id, persona)
  where persona is not null;
