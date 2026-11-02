-- Preserve original names for future uploads; old rows use their displayed titles.
alter table public.resources add column if not exists original_filename text;
