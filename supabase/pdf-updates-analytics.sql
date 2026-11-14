create table if not exists public.pdf_update_analytics (
 id uuid primary key default gen_random_uuid(),
 event_type text not null check(event_type in ('page_view','update_click')),
 update_id uuid references public.pdf_updates(id) on delete set null,
 visitor_id text not null check(char_length(visitor_id) between 20 and 80),
 session_id text not null check(char_length(session_id) between 20 and 80),
 created_at timestamptz not null default now(),
 constraint pdf_update_analytics_event_shape check((event_type='page_view' and update_id is null) or (event_type='update_click' and update_id is not null))
);
create index if not exists pdf_update_analytics_created_idx on public.pdf_update_analytics(created_at desc);
create unique index if not exists pdf_update_analytics_page_session_uidx on public.pdf_update_analytics(visitor_id,session_id) where event_type='page_view';
create unique index if not exists pdf_update_analytics_click_session_uidx on public.pdf_update_analytics(visitor_id,session_id,update_id) where event_type='update_click';
alter table public.pdf_update_analytics enable row level security;
drop policy if exists "Admin read PDF update analytics" on public.pdf_update_analytics;
create policy "Admin read PDF update analytics" on public.pdf_update_analytics for select to authenticated using(public.is_library_admin());
grant select on public.pdf_update_analytics to authenticated;
revoke all on public.pdf_update_analytics from anon,public;
create or replace function public.record_pdf_update_event(p_event_type text,p_update_id uuid default null,p_visitor_id text default null,p_session_id text default null)
returns void language plpgsql security definer set search_path=public as $$
begin
 if p_event_type not in ('page_view','update_click') then raise exception 'Invalid event type'; end if;
 if p_visitor_id is null or char_length(p_visitor_id) not between 20 and 80 or p_session_id is null or char_length(p_session_id) not between 20 and 80 then raise exception 'Invalid anonymous identifiers'; end if;
 if p_event_type='page_view' then
  if p_update_id is not null then raise exception 'Page view cannot have update ID'; end if;
  insert into public.pdf_update_analytics(event_type,visitor_id,session_id) values('page_view',p_visitor_id,p_session_id)
  on conflict(visitor_id,session_id) where event_type='page_view' do nothing;
 else
  if p_update_id is null or not exists(select 1 from public.pdf_updates where id=p_update_id and is_visible) then raise exception 'PDF update unavailable'; end if;
  insert into public.pdf_update_analytics(event_type,update_id,visitor_id,session_id) values('update_click',p_update_id,p_visitor_id,p_session_id)
  on conflict(visitor_id,session_id,update_id) where event_type='update_click' do nothing;
 end if;
end;$$;
revoke all on function public.record_pdf_update_event(text,uuid,text,text) from public;
grant execute on function public.record_pdf_update_event(text,uuid,text,text) to anon,authenticated;