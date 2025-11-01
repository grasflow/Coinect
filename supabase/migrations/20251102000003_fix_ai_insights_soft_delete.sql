-- migration: fix AI insights soft delete handling
-- description: naprawia trigger sync_ai_insights_data aby usuwał rekordy z ai_insights_data gdy wpis czasu jest soft-deleted
-- affected: sync_ai_insights_data function, ai_insights_data table
-- special considerations: usuwa "martwe" rekordy z ai_insights_data które odnoszą się do usuniętych time_entries

-- aktualizacja funkcji sync_ai_insights_data aby obsługiwała soft delete
create or replace function sync_ai_insights_data()
returns trigger as $$
begin
  -- jeśli wpis został soft-deleted, usuń z ai_insights_data
  if new.deleted_at is not null then
    delete from ai_insights_data where time_entry_id = new.id;
    return new;
  end if;

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
$$ language plpgsql security definer;

-- funkcja pomocnicza do wyczyszczenia "martwych" rekordów z ai_insights_data
-- usuwa rekordy które odnoszą się do soft-deleted time_entries
create or replace function cleanup_deleted_ai_insights()
returns void as $$
begin
  delete from ai_insights_data
  where time_entry_id in (
    select te.id
    from time_entries te
    where te.deleted_at is not null
  );
end;
$$ language plpgsql security definer;

-- wykonaj czyszczenie "martwych" rekordów
select cleanup_deleted_ai_insights();

-- usuń funkcję pomocniczą po użyciu
drop function cleanup_deleted_ai_insights();
