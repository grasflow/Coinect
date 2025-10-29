-- migration: fix clients UPDATE policy to allow soft delete
-- description: naprawia politykę UPDATE aby umożliwić soft delete przez UPDATE deleted_at
-- affected: clients table RLS policy
-- rationale: `using` sprawdza czy user ma prawo do aktualizacji (tylko swoje wiersze),
--             nie sprawdzamy deleted_at w using, bo wtedy można aktualizować już usunięte wiersze
--             `with check` sprawdza czy user_id się nie zmienił (ochrona przed zmianą właściciela)

-- usuń starą politykę UPDATE
drop policy if exists "Users can update own clients" on clients;

-- usuń możliwą starą wersję nowej polityki
drop policy if exists "clients_update_authenticated" on clients;

-- stwórz nową politykę UPDATE
create policy "clients_update_authenticated" on clients
  for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

