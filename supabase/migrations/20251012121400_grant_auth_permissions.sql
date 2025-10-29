-- migration: grant auth permissions
-- description: nadaje uprawnienia dla supabase_auth_admin na tabeli profiles
-- affected: profiles
-- special considerations: wymagane dla poprawnego działania triggerów auth

-- nadaj uprawnienia supabase_auth_admin do tabeli profiles
-- wymagane, aby trigger on_auth_user_created mógł wstawiać rekordy
grant all on public.profiles to supabase_auth_admin;
grant usage on schema public to supabase_auth_admin;

-- nadaj uprawnienia do wszystkich sekwencji w public
grant usage, select on all sequences in schema public to supabase_auth_admin;

