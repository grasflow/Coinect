-- migration: fix clients UPDATE policy - remove with check restriction
-- description: usuwa with check z polityki UPDATE aby umożliwić soft delete
-- affected: clients table RLS policy
-- rationale: with check blokuje UPDATE gdy deleted_at jest ustawiony,
--            using wystarczy do sprawdzenia własności wiersza

-- usuń istniejącą politykę UPDATE
drop policy if exists "clients_update_authenticated" on clients;

-- stwórz nową politykę UPDATE tylko z using (bez with check)
create policy "clients_update_authenticated" on clients
  for update
  to authenticated
  using (user_id = auth.uid());

