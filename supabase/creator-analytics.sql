-- Run once in the Supabase SQL Editor to enable private creator click analytics.
begin;
create table if not exists public.creator_link_analytics(
 id bigint generated always as identity primary key,
 event_type text not null check(event_type in ('creators_note','linkedin_lokesh','linkedin_ramakrishna')),
 created_at timestamptz not null default now()
);
alter table public.creator_link_analytics enable row level security;
grant insert on public.creator_link_analytics to anon,authenticated;
grant select on public.creator_link_analytics to authenticated;
drop policy if exists "Public records creator link clicks" on public.creator_link_analytics;
create policy "Public records creator link clicks" on public.creator_link_analytics for insert to anon,authenticated with check(event_type in ('creators_note','linkedin_lokesh','linkedin_ramakrishna'));
drop policy if exists "Admins view creator link analytics" on public.creator_link_analytics;
create policy "Admins view creator link analytics" on public.creator_link_analytics for select to authenticated using(public.is_library_admin());
create index if not exists creator_link_analytics_event_created on public.creator_link_analytics(event_type,created_at desc);
commit;
