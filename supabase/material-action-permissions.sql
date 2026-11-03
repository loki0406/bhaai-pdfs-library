-- Per-material student action permissions for Bhaai PDFs Library.
-- Run once in Supabase SQL Editor. Existing materials keep all actions enabled.
begin;
alter table public.resources
  add column if not exists allow_share boolean not null default true,
  add column if not exists allow_whatsapp boolean not null default true,
  add column if not exists allow_report boolean not null default true,
  add column if not exists allow_offline boolean not null default true;
commit;
