-- Optional admin audit trail for the BHAAI PDF Updates manager.
create table if not exists public.pdf_update_admin_activity (
 id uuid primary key default gen_random_uuid(),
 action text not null,
 details text,
 created_at timestamptz not null default now()
);
alter table public.pdf_update_admin_activity enable row level security;
drop policy if exists "Admins read pdf update activity" on public.pdf_update_admin_activity;
create policy "Admins read pdf update activity" on public.pdf_update_admin_activity
 for select to authenticated using (public.is_library_admin());
drop policy if exists "Admins add pdf update activity" on public.pdf_update_admin_activity;
create policy "Admins add pdf update activity" on public.pdf_update_admin_activity
 for insert to authenticated with check (public.is_library_admin());
grant select,insert on public.pdf_update_admin_activity to authenticated;
