-- migration: create soft delete client RPC function
-- description: tworzy funkcję RPC dla bezpiecznego soft delete klientów
-- affected: clients table
-- rationale: RPC functions mogą działać z wyższymi uprawnieniami i ominąć niektóre problemy RLS

-- funkcja: soft delete klienta
-- sprawdza własność klienta przed usunięciem
create or replace function soft_delete_client(client_id uuid)
returns void
language plpgsql
security definer
as $$
begin
  -- sprawdź czy klient istnieje i należy do użytkownika
  if not exists (
    select 1 from clients
    where id = client_id
    and user_id = auth.uid()
    and deleted_at is null
  ) then
    raise exception 'Client not found or access denied';
  end if;

  -- wykonaj soft delete
  update clients
  set deleted_at = now()
  where id = client_id
  and user_id = auth.uid();

  -- sprawdź czy update się udał
  if not found then
    raise exception 'Failed to delete client';
  end if;
end;
$$;
