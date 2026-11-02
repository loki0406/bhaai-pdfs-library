-- Adds an optional stamp; existing materials stay untagged. Existing admin RLS applies.
begin;
alter table public.resources add column if not exists card_tag text not null default '';
alter table public.resources drop constraint if exists resources_card_tag_check;
alter table public.resources add constraint resources_card_tag_check check(card_tag in ('','bhaai-pick'));
commit;
