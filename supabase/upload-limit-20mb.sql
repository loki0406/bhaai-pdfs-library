-- Run once in the existing project's Supabase SQL Editor.
begin;
alter table public.resources drop constraint if exists resources_size_check;
alter table public.resources add constraint resources_size_check check (size between 1 and 20971520);
update storage.buckets set file_size_limit = 20971520 where id = 'materials';
commit;
