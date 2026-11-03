-- Bhaai Adda: Recycle Bin and Scheduled Announcements
-- Run in Supabase SQL Editor. Existing resources are not deleted.
begin;
create table if not exists public.material_recycle_bin (
  id uuid primary key default gen_random_uuid(),
  resource_id text not null,
  material_data jsonb not null,
  deleted_at timestamptz not null default now(),
  deleted_by uuid references auth.users(id) on delete set null
);
create index if not exists material_recycle_bin_deleted_at_idx on public.material_recycle_bin(deleted_at desc);
alter table public.material_recycle_bin enable row level security;
revoke all on public.material_recycle_bin from anon, authenticated;
grant select, insert, delete on public.material_recycle_bin to authenticated;
drop policy if exists "Admins manage recycle bin" on public.material_recycle_bin;
create policy "Admins manage recycle bin" on public.material_recycle_bin for all to authenticated
using (public.is_library_admin()) with check (public.is_library_admin());

create table if not exists public.scheduled_announcements (
  id uuid primary key default gen_random_uuid(),
  title text not null check(char_length(title) between 1 and 120),
  message text not null check(char_length(message) between 1 and 1000),
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  created_by uuid references auth.users(id) on delete set null,
  constraint announcement_dates_valid check(ends_at > starts_at)
);
create index if not exists scheduled_announcements_window_idx on public.scheduled_announcements(is_active,starts_at,ends_at);
alter table public.scheduled_announcements enable row level security;
revoke all on public.scheduled_announcements from anon, authenticated;
grant select on public.scheduled_announcements to anon, authenticated;
grant insert, update, delete on public.scheduled_announcements to authenticated;
drop policy if exists "Visitors read active scheduled announcements" on public.scheduled_announcements;
create policy "Visitors read active scheduled announcements" on public.scheduled_announcements for select to anon,authenticated
using(is_active and starts_at <= now() and ends_at > now());
drop policy if exists "Admins manage scheduled announcements" on public.scheduled_announcements;
create policy "Admins manage scheduled announcements" on public.scheduled_announcements for all to authenticated
using(public.is_library_admin()) with check(public.is_library_admin());
commit;
