-- Run after setup.sql and notes.sql. Preserves existing documents and notes.
begin;
alter table public.resources add column if not exists published boolean not null default true;
alter table public.resources add column if not exists allow_preview boolean not null default true;
alter table public.resources add column if not exists allow_download boolean not null default true;
drop policy if exists "Everyone reads materials" on public.resources;
create policy "Everyone reads materials" on public.resources for select to anon,authenticated using(published or public.is_library_admin());
-- Retire visitor reaction permissions without deleting historical data.
revoke all on public.bhaai_likes,public.bhaai_comments from anon,authenticated;
commit;
