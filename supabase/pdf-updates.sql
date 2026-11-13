-- BHAAI PDF Updates: upload feed, reactions, comments and moderation
create table if not exists public.pdf_updates (
 id uuid primary key default gen_random_uuid(),
 resource_id text not null unique,
 title text not null,
 subject text,
 semester text,
 section text,
 description text,
 file_type text,
 uploaded_at timestamptz not null default now(),
 is_visible boolean not null default true,
 updated_at timestamptz not null default now()
);
create table if not exists public.pdf_update_likes (
 id uuid primary key default gen_random_uuid(),
 update_id uuid not null references public.pdf_updates(id) on delete cascade,
 visitor_id text not null,
 created_at timestamptz not null default now(),
 unique(update_id, visitor_id)
);
create table if not exists public.pdf_update_comments (
 id uuid primary key default gen_random_uuid(),
 update_id uuid not null references public.pdf_updates(id) on delete cascade,
 visitor_id text not null,
 display_name text not null check (char_length(display_name) between 1 and 40),
 body text not null check (char_length(body) between 1 and 1000),
 is_visible boolean not null default true,
 created_at timestamptz not null default now()
);
create index if not exists pdf_updates_uploaded_idx on public.pdf_updates(uploaded_at desc);
create index if not exists pdf_comments_update_idx on public.pdf_update_comments(update_id,created_at desc);
alter table public.pdf_updates enable row level security;
alter table public.pdf_update_likes enable row level security;
alter table public.pdf_update_comments enable row level security;
drop policy if exists "Public read visible pdf updates" on public.pdf_updates;
create policy "Public read visible pdf updates" on public.pdf_updates for select to anon,authenticated using (is_visible or public.is_library_admin());
drop policy if exists "Admin manage pdf updates" on public.pdf_updates;
create policy "Admin manage pdf updates" on public.pdf_updates for all to authenticated using (public.is_library_admin()) with check (public.is_library_admin());
drop policy if exists "Public read likes" on public.pdf_update_likes;
create policy "Public read likes" on public.pdf_update_likes for select to anon,authenticated using (true);
drop policy if exists "Public add own visitor like" on public.pdf_update_likes;
create policy "Public add own visitor like" on public.pdf_update_likes for insert to anon,authenticated with check (char_length(visitor_id) between 20 and 80);
drop policy if exists "Public remove own visitor like" on public.pdf_update_likes;
create policy "Public remove own visitor like" on public.pdf_update_likes for delete to anon,authenticated using (visitor_id = current_setting('request.headers', true)::json->>'x-bhaai-visitor');
drop policy if exists "Public read visible comments" on public.pdf_update_comments;
create policy "Public read visible comments" on public.pdf_update_comments for select to anon,authenticated using (is_visible or public.is_library_admin());
drop policy if exists "Public add comments" on public.pdf_update_comments;
create policy "Public add comments" on public.pdf_update_comments for insert to anon,authenticated with check (char_length(visitor_id) between 20 and 80 and char_length(display_name) between 1 and 40 and char_length(body) between 1 and 1000);
drop policy if exists "Admin manage likes" on public.pdf_update_likes;
create policy "Admin manage likes" on public.pdf_update_likes for all to authenticated using (public.is_library_admin()) with check (public.is_library_admin());
drop policy if exists "Admin manage comments" on public.pdf_update_comments;
create policy "Admin manage comments" on public.pdf_update_comments for all to authenticated using (public.is_library_admin()) with check (public.is_library_admin());
grant select on public.pdf_updates,public.pdf_update_likes,public.pdf_update_comments to anon,authenticated;
grant insert,delete on public.pdf_update_likes to anon,authenticated;
grant insert on public.pdf_update_comments to anon,authenticated;
grant update,delete on public.pdf_updates,public.pdf_update_comments to authenticated;
create or replace function public.sync_pdf_update_from_resource()
returns trigger language plpgsql security definer set search_path=public as $$
declare ext text;
begin
 if tg_op='DELETE' then
   delete from public.pdf_updates where resource_id=old.id::text;
   return old;
 end if;
 if coalesce(new.published,true) then
   ext := lower(regexp_replace(coalesce(new.original_filename,new.storage_path,''), '^.*\.', ''));
   insert into public.pdf_updates(resource_id,title,subject,semester,section,description,file_type,uploaded_at)
   values(new.id::text,new.title,new.subject,new.semester,new.category,new.description,upper(ext),coalesce(new.created_at,now()))
   on conflict(resource_id) do update set title=excluded.title,subject=excluded.subject,semester=excluded.semester,section=excluded.section,description=excluded.description,file_type=excluded.file_type,is_visible=true,updated_at=now();
 else
   update public.pdf_updates set is_visible=false,updated_at=now() where resource_id=new.id::text;
 end if;
 return new;
end $$;
drop trigger if exists resources_sync_pdf_update on public.resources;
create trigger resources_sync_pdf_update after insert or update of title,subject,semester,category,description,published,original_filename,storage_path or delete on public.resources for each row execute function public.sync_pdf_update_from_resource();
insert into public.pdf_updates(resource_id,title,subject,semester,section,description,file_type,uploaded_at)
select id::text,title,subject,semester,category,description,upper(regexp_replace(coalesce(original_filename,storage_path,''), '^.*\.', '')),coalesce(created_at,now())
from public.resources where coalesce(published,true)
on conflict(resource_id) do nothing;
