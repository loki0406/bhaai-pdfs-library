-- Run once in the Supabase SQL Editor. No service-role key is needed in this website.
begin;
create table if not exists public.library_admins (user_id uuid primary key references auth.users(id) on delete cascade);
alter table public.library_admins enable row level security;
revoke all on public.library_admins from anon, authenticated;
create or replace function public.is_library_admin() returns boolean language sql stable security definer set search_path = '' as $$ select exists(select 1 from public.library_admins where user_id = (select auth.uid())); $$;
revoke all on function public.is_library_admin() from public;
grant execute on function public.is_library_admin() to anon, authenticated;
create table if not exists public.resources (
 id uuid primary key default gen_random_uuid(),
 title text not null check(char_length(trim(title)) between 1 and 150),
 subject text not null check(char_length(trim(subject)) between 1 and 80),
 semester text not null check(char_length(trim(semester)) between 1 and 20),
 category text not null check(category in ('Mid-1','Mid-2','Semester','General')),
 units text not null default '' check(char_length(units)<=100),
 description text not null default '' check(char_length(description)<=500),
 storage_path text not null unique check(storage_path ~ '^[a-f0-9-]+/[a-f0-9-]+\.(pdf|doc|docx|ppt|pptx|xls|xlsx|txt|png|jpg|jpeg|zip)$'),
 original_filename text,
 size bigint not null check(size between 1 and 20971520),
 created_at timestamptz not null default now()
);
alter table public.resources enable row level security;
grant select on public.resources to anon,authenticated;
grant insert,update,delete on public.resources to authenticated;
drop policy if exists "Everyone reads materials" on public.resources;
create policy "Everyone reads materials" on public.resources for select using(true);
drop policy if exists "Admins manage materials" on public.resources;
create policy "Admins manage materials" on public.resources for all to authenticated using(public.is_library_admin()) with check(public.is_library_admin());
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values ('materials','materials',true,20971520,array['application/pdf','application/msword','application/vnd.openxmlformats-officedocument.wordprocessingml.document','application/vnd.ms-powerpoint','application/vnd.openxmlformats-officedocument.presentationml.presentation','application/vnd.ms-excel','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet','text/plain','image/png','image/jpeg','application/zip','application/x-zip-compressed','application/octet-stream']) on conflict(id) do update set public=true,file_size_limit=20971520,allowed_mime_types=excluded.allowed_mime_types;
drop policy if exists "Library admin uploads" on storage.objects;
create policy "Library admin uploads" on storage.objects for insert to authenticated with check(bucket_id='materials' and public.is_library_admin() and (storage.foldername(name))[1]=(select auth.uid())::text and lower(storage.extension(name)) in ('pdf','doc','docx','ppt','pptx','xls','xlsx','txt','png','jpg','jpeg','zip'));
drop policy if exists "Library admin deletes" on storage.objects;
create policy "Library admin deletes" on storage.objects for delete to authenticated using(bucket_id='materials' and public.is_library_admin());
drop policy if exists "Library admin reads objects" on storage.objects;
create policy "Library admin reads objects" on storage.objects for select to authenticated using(bucket_id='materials' and public.is_library_admin());
commit;
-- Then create the admin in Authentication > Users > Add user (your own password).
-- Finally run this separately:
-- insert into public.library_admins(user_id)
-- select id from auth.users where lower(email)='srisatyalokesh80@gmail.com' and email_confirmed_at is not null
-- on conflict do nothing;
