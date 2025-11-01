-- migration: fix AI insights handle empty string
-- description: naprawia funkcję sync_ai_insights_data aby poprawnie obsługiwała pusty string jako null
-- affected: sync_ai_insights_data function
-- special considerations: normalizuje pusty string do null, dodaje lepszą obsługę błędów

-- aktualizacja funkcji sync_ai_insights_data
-- normalizuje pusty string do null i dodaje lepszą obsługę błędów
create or replace function sync_ai_insights_data()
returns trigger as $$
declare
  v_private_note text;
begin
  -- normalizuj private_note: null lub pusty string po trim() = null
  v_private_note := nullif(trim(coalesce(new.private_note, '')), '');
  
  -- tylko jeśli private_note jest wypełnione (nie null i nie pusty)
  if v_private_note is not null then
    insert into ai_insights_data (
      user_id,
      time_entry_id,
      date,
      day_of_week,
      hours,
      hourly_rate,
      private_note
    )
    values (
      new.user_id,
      new.id,
      new.date,
      extract(isodow from new.date),
      new.hours,
      new.hourly_rate,
      v_private_note
    )
    on conflict (time_entry_id)
    do update set
      date = excluded.date,
      day_of_week = excluded.day_of_week,
      hours = excluded.hours,
      hourly_rate = excluded.hourly_rate,
      private_note = excluded.private_note;
  else
    -- usuń wpis AI jeśli private_note jest null lub pusty
    delete from ai_insights_data where time_entry_id = new.id;
  end if;
  
  return new;
exception
  when others then
    -- loguj błąd, ale nie przerywaj transakcji
    raise warning 'Error in sync_ai_insights_data for time_entry_id %: %', new.id, sqlerrm;
    return new;
end;
$$ language plpgsql security definer;

