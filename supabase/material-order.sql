begin;
create table if not exists public.material_order (
 resource_id text primary key check(char_length(resource_id) between 1 and 1000),
 position integer not null check(position >= 0)
);
alter table public.material_order enable row level security;
grant select on public.material_order to anon,authenticated;
drop policy if exists "Read material order" on public.material_order;
create policy "Read material order" on public.material_order for select to anon,authenticated using(true);
revoke insert,update,delete on public.material_order from anon,authenticated;
create or replace function public.save_material_order(ordered_ids text[]) returns void
language plpgsql security definer set search_path = '' as $$
begin
 if not public.is_library_admin() then raise exception 'Admin access required'; end if;
 if ordered_ids is null or cardinality(ordered_ids)>10000 or exists(select 1 from unnest(ordered_ids) x where x is null or length(x) not between 1 and 1000) then raise exception 'Invalid order'; end if;
 if (select count(distinct x) from unnest(ordered_ids) x)<>cardinality(ordered_ids) then raise exception 'Duplicate material IDs'; end if;
 insert into public.material_order(resource_id,position)
 select id, (rank-1)::integer from unnest(ordered_ids) with ordinality as t(id,rank)
 on conflict(resource_id) do update set position=excluded.position;
end;
$$;
revoke all on function public.save_material_order(text[]) from public,anon;
grant execute on function public.save_material_order(text[]) to authenticated;
commit;
