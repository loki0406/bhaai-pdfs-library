-- Run once after notes.sql and adda.sql. Preserves existing posts.
begin;
alter table public.bhaai_posts add column if not exists material_ids text[] not null default '{}';
alter table public.bhaai_posts add column if not exists is_pinned boolean not null default false;
alter table public.bhaai_posts add column if not exists show_announcement boolean not null default false;
alter table public.bhaai_posts drop constraint if exists bhaai_posts_material_ids_check;
alter table public.bhaai_posts add constraint bhaai_posts_material_ids_check check(cardinality(material_ids)<=10 and array_position(material_ids,null) is null);
grant update on public.bhaai_posts to authenticated;
drop policy if exists "Admin edits notes" on public.bhaai_posts;
create policy "Admin edits notes" on public.bhaai_posts for update to authenticated using(public.is_library_admin()) with check(public.is_library_admin());
commit;
