-- Bhaai PDFs analytics, WhatsApp file-sharing and student issue reports.
-- Run once in Supabase SQL Editor. Existing counters and materials are preserved.
begin;

create table if not exists public.analytics_events (
  id bigint generated always as identity primary key,
  event_type text not null check (event_type in ('download','whatsapp_share')),
  resource_id text not null check (char_length(resource_id) between 1 and 500),
  created_at timestamptz not null default now()
);
create index if not exists analytics_events_created_at_idx on public.analytics_events(created_at);
create index if not exists analytics_events_resource_idx on public.analytics_events(resource_id,event_type);
alter table public.analytics_events enable row level security;
revoke all on public.analytics_events from anon, authenticated;
grant select on public.analytics_events to anon, authenticated;
drop policy if exists "Read aggregate activity events" on public.analytics_events;
create policy "Read aggregate activity events" on public.analytics_events for select to anon,authenticated using(true);

create table if not exists public.whatsapp_share_counts (
  resource_id text primary key check(char_length(resource_id) between 1 and 500),
  shares bigint not null default 0 check(shares >= 0)
);
alter table public.whatsapp_share_counts enable row level security;
revoke all on public.whatsapp_share_counts from anon,authenticated;
grant select on public.whatsapp_share_counts to anon,authenticated;
drop policy if exists "Read WhatsApp share totals" on public.whatsapp_share_counts;
create policy "Read WhatsApp share totals" on public.whatsapp_share_counts for select to anon,authenticated using(true);

create or replace function public.record_material_whatsapp_share(material_id text) returns bigint
language plpgsql security definer set search_path = '' as $$
declare total bigint;
begin
 if material_id is null or char_length(material_id)>500 then raise exception 'Invalid material'; end if;
 if material_id like 'git:%' then
  if material_id !~ '^git:[A-Za-z0-9_ /().&+-]+\\.[A-Za-z0-9]+$' or material_id like '%..%' then raise exception 'Invalid material'; end if;
 else
  if not exists(select 1 from public.resources where id::text=material_id and published=true and allow_download is distinct from false) then raise exception 'Material unavailable'; end if;
 end if;
 insert into public.whatsapp_share_counts(resource_id,shares) values(material_id,1)
 on conflict(resource_id) do update set shares=public.whatsapp_share_counts.shares+1
 returning shares into total;
 insert into public.analytics_events(event_type,resource_id) values('whatsapp_share',material_id);
 return total;
end $$;
revoke all on function public.record_material_whatsapp_share(text) from public;
grant execute on function public.record_material_whatsapp_share(text) to anon,authenticated;

create or replace function public.record_material_download(material_id text) returns bigint
language plpgsql security definer set search_path = '' as $$
declare total bigint;
begin
 if material_id is null or char_length(material_id)>500 then raise exception 'Invalid material'; end if;
 if material_id like 'git:%' then
  if material_id !~ '^git:[A-Za-z0-9_ /().&+-]+\\.[A-Za-z0-9]+$' or material_id like '%..%' then raise exception 'Invalid material'; end if;
 else
  if not exists(select 1 from public.resources where id::text=material_id and published=true and allow_download is distinct from false) then raise exception 'Material unavailable'; end if;
 end if;
 insert into public.download_counts(resource_id,downloads) values(material_id,1)
 on conflict(resource_id) do update set downloads=public.download_counts.downloads+1
 returning downloads into total;
 insert into public.analytics_events(event_type,resource_id) values('download',material_id);
 return total;
end $$;
revoke all on function public.record_material_download(text) from public;
grant execute on function public.record_material_download(text) to anon,authenticated;

create table if not exists public.material_reports (
 id uuid primary key default gen_random_uuid(),
 resource_id text not null check(char_length(resource_id) between 1 and 500),
 resource_title text not null check(char_length(resource_title) between 1 and 150),
 issue_type text not null check(issue_type in ('Broken PDF','Wrong subject or unit','Incorrect or incomplete content','Download or sharing problem','Other')),
 details text not null default '' check(char_length(details)<=1000),
 status text not null default 'open' check(status in ('open','resolved')),
 created_at timestamptz not null default now(),
 resolved_at timestamptz
);
alter table public.material_reports enable row level security;
revoke all on public.material_reports from anon,authenticated;
grant insert on public.material_reports to anon,authenticated;
grant select,update on public.material_reports to authenticated;
drop policy if exists "Visitors submit material reports" on public.material_reports;
create policy "Visitors submit material reports" on public.material_reports for insert to anon,authenticated with check(status='open' and resolved_at is null);
drop policy if exists "Admins review material reports" on public.material_reports;
create policy "Admins review material reports" on public.material_reports for select to authenticated using(public.is_library_admin());
drop policy if exists "Admins resolve material reports" on public.material_reports;
create policy "Admins resolve material reports" on public.material_reports for update to authenticated using(public.is_library_admin()) with check(public.is_library_admin());

commit;
