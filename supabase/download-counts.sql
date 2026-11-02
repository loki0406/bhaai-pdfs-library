-- Run once in the Supabase SQL Editor. No visitor account is required.
begin;
create table if not exists public.download_counts (
 resource_id text primary key check(char_length(resource_id) between 1 and 500),
 downloads bigint not null default 0 check(downloads >= 0)
);
alter table public.download_counts enable row level security;
revoke all on public.download_counts from anon, authenticated;
grant select on public.download_counts to anon, authenticated;
drop policy if exists "Read download totals" on public.download_counts;
create policy "Read download totals" on public.download_counts for select to anon,authenticated using(true);
create or replace function public.record_material_download(material_id text) returns bigint
language plpgsql security definer set search_path = '' as $$
declare total bigint;
begin
 if material_id is null or char_length(material_id)>500 then raise exception 'Invalid material'; end if;
 if material_id like 'git:%' then
  if material_id !~ '^git:[A-Za-z0-9_ /().&+-]+\.[A-Za-z0-9]+$' or material_id like '%..%' then raise exception 'Invalid material'; end if;
 else
  if not exists(select 1 from public.resources where id::text=material_id and published=true and allow_download is distinct from false) then raise exception 'Material unavailable'; end if;
 end if;
 insert into public.download_counts(resource_id,downloads) values(material_id,1)
 on conflict(resource_id) do update set downloads=public.download_counts.downloads+1
 returning downloads into total;
 return total;
end $$;
revoke all on function public.record_material_download(text) from public;
grant execute on function public.record_material_download(text) to anon,authenticated;
commit;
