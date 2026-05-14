-- Persona + Creative Engine (jsonb) alanları

alter table public.users
  add column if not exists persona text,
  add column if not exists onboarding_context jsonb not null default '{}'::jsonb;

alter table public.ai_generations
  add column if not exists creative_pack jsonb,
  add column if not exists persona text;

update public.users set persona = 'creator' where persona is null;
