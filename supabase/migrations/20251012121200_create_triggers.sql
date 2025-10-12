-- migration: create triggers
-- description: tworzy triggery dla automatycznej aktualizacji updated_at i zasilania ai_insights_data
-- affected: profiles, clients, time_entries, invoices, invoice_items, ai_insights_data, time_entry_tags
-- special considerations: triggery wykonują się automatycznie przy insert/update/delete

-- funkcja: automatyczna aktualizacja kolumny updated_at
-- wykonywana przed każdym update na głównych tabelach
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- trigger: aktualizacja updated_at dla tabeli profiles
create trigger update_profiles_updated_at before update on profiles
  for each row execute function update_updated_at_column();

-- trigger: aktualizacja updated_at dla tabeli clients
create trigger update_clients_updated_at before update on clients
  for each row execute function update_updated_at_column();

-- trigger: aktualizacja updated_at dla tabeli time_entries
create trigger update_time_entries_updated_at before update on time_entries
  for each row execute function update_updated_at_column();

-- trigger: aktualizacja updated_at dla tabeli invoices
create trigger update_invoices_updated_at before update on invoices
  for each row execute function update_updated_at_column();

-- trigger: aktualizacja updated_at dla tabeli invoice_items
create trigger update_invoice_items_updated_at before update on invoice_items
  for each row execute function update_updated_at_column();

-- funkcja: automatyczne zasilanie ai_insights_data po insert/update time_entries
-- wstawia lub aktualizuje dane AI tylko jeśli private_note jest wypełnione
-- usuwa wpis AI jeśli private_note został usunięty
create or replace function sync_ai_insights_data()
returns trigger as $$
begin
  -- wstaw lub zaktualizuj dane AI tylko jeśli private_note jest wypełnione
  if new.private_note is not null and new.private_note != '' then
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
    -- usuń wpis AI jeśli private_note został usunięty
    delete from ai_insights_data where time_entry_id = new.id;
  end if;
  
  return new;
end;
$$ language plpgsql;

-- trigger: synchronizacja time_entries do ai_insights_data
create trigger sync_time_entries_to_ai_insights
  after insert or update on time_entries
  for each row
  execute function sync_ai_insights_data();

-- funkcja: automatyczne zasilanie ai_insights_data po insert/update/delete time_entry_tags
-- aktualizuje tagi w ai_insights_data po zmianie tagów wpisu czasu
create or replace function sync_ai_insights_tags()
returns trigger as $$
begin
  -- zaktualizuj tagi w ai_insights_data
  update ai_insights_data
  set tags = (
    select jsonb_agg(t.name)
    from time_entry_tags tet
    join tags t on t.id = tet.tag_id
    where tet.time_entry_id = coalesce(new.time_entry_id, old.time_entry_id)
  )
  where time_entry_id = coalesce(new.time_entry_id, old.time_entry_id);
  
  return coalesce(new, old);
end;
$$ language plpgsql;

-- trigger: synchronizacja tagów do ai_insights_data
create trigger sync_tags_to_ai_insights
  after insert or update or delete on time_entry_tags
  for each row
  execute function sync_ai_insights_tags();

