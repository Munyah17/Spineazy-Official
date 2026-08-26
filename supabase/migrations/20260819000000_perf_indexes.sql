-- Spineazy: performance indexes.
--
-- pg_trgm was installed in the base migration but the trigram indexes it
-- exists for were never actually created -- fn_get_users (admin user search)
-- and fn_search_users (chat partner search) both do `ilike '%...%'` against
-- profiles, which without a trigram index is a sequential scan that gets
-- linearly slower as the user base grows.

create index if not exists profiles_full_name_trgm_idx on public.profiles using gin (full_name gin_trgm_ops);
create index if not exists profiles_email_trgm_idx on public.profiles using gin (email gin_trgm_ops);
