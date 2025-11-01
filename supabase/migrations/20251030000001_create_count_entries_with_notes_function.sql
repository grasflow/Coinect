-- migration: create count entries with notes function
-- description: tworzy funkcję pomocniczą do liczenia wpisów czasu z prawidłowymi notatkami prywatnymi (po trim)
-- affected: nowa funkcja count_time_entries_with_valid_notes
-- special considerations: funkcja filtruje wpisy z null, pustymi stringami i stringami zawierającymi tylko białe znaki

-- funkcja pomocnicza: liczy wpisy czasu z prawidłowymi notatkami prywatnymi
create or replace function count_time_entries_with_valid_notes(p_user_id uuid)
returns integer as $$
begin
  return (
    select count(*)
    from time_entries
    where user_id = p_user_id
      and deleted_at is null
      and private_note is not null
      and trim(private_note) != ''
  );
end;
$$ language plpgsql security definer;

-- przyznaj uprawnienia do wykonania funkcji dla authenticated users
grant execute on function count_time_entries_with_valid_notes(uuid) to authenticated;

