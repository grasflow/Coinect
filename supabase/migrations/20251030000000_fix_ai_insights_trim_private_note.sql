-- migration: fix AI insights trim private_note
-- description: aktualizuje funkcję sync_ai_insights_data aby używała trim() przy sprawdzaniu private_note, aby pomijać stringi zawierające tylko białe znaki
-- affected: sync_ai_insights_data function
-- special considerations: funkcja sprawdza teraz czy private_note po usunięciu białych znaków nie jest pusty

-- aktualizacja funkcji sync_ai_insights_data
-- używa trim() aby pomijać stringi zawierające tylko białe znaki
create or replace function sync_ai_insights_data()
returns trigger as $$
begin
  -- wstaw lub zaktualizuj dane AI tylko jeśli private_note jest wypełnione (po usunięciu białych znaków)
  if new.private_note is not null and trim(new.private_note) != '' then
    insert into ai_insights_data (
      user_id,
      time_entry_id,
      date,
      day_of_week,
      hours,
      hourly_rate,
      private_note,
      tags
    )
    values (
      new.user_id,
      new.id,
      new.date,
      extract(isodow from new.date),
      new.hours,
      new.hourly_rate,
      new.private_note,
      (
        select jsonb_agg(t.name)
        from time_entry_tags tet
        join tags t on t.id = tet.tag_id
        where tet.time_entry_id = new.id
      )
    )
    on conflict (time_entry_id)
    do update set
      date = excluded.date,
      day_of_week = excluded.day_of_week,
      hours = excluded.hours,
      hourly_rate = excluded.hourly_rate,
      private_note = excluded.private_note,
      tags = excluded.tags;
  else
    -- usuń wpis AI jeśli private_note został usunięty lub zawiera tylko białe znaki
    delete from ai_insights_data where time_entry_id = new.id;
  end if;
  
  return new;
end;
$$ language plpgsql;

