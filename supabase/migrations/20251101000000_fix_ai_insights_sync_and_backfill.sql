-- migration: fix AI insights sync and backfill
-- description: naprawia funkcję sync_ai_insights_data aby używała SECURITY DEFINER i synchronizuje istniejące wpisy
-- affected: sync_ai_insights_data function, ai_insights_data table
-- special considerations: używa SECURITY DEFINER aby ominąć problemy z RLS przy triggerach

-- aktualizacja funkcji sync_ai_insights_data z SECURITY DEFINER
-- pozwala na omijanie RLS przy wykonaniu przez trigger
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
$$ language plpgsql security definer;

-- aktualizacja funkcji sync_ai_insights_tags z SECURITY DEFINER
-- pozwala na omijanie RLS przy aktualizacji tagów
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
$$ language plpgsql security definer;

-- funkcja pomocnicza do synchronizacji istniejących wpisów
-- używa SECURITY DEFINER aby ominąć problemy z RLS
create or replace function backfill_ai_insights_data()
returns void as $$
begin
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
  select
    te.user_id,
    te.id as time_entry_id,
    te.date,
    extract(isodow from te.date) as day_of_week,
    te.hours,
    te.hourly_rate,
    te.private_note,
    (
      select jsonb_agg(t.name)
      from time_entry_tags tet
      join tags t on t.id = tet.tag_id
      where tet.time_entry_id = te.id
    ) as tags
  from time_entries te
  where te.deleted_at is null
    and te.private_note is not null
    and trim(te.private_note) != ''
    and not exists (
      select 1
      from ai_insights_data aid
      where aid.time_entry_id = te.id
    )
  on conflict (time_entry_id) do nothing;
end;
$$ language plpgsql security definer;

-- wykonaj synchronizację istniejących wpisów
select backfill_ai_insights_data();

-- usuń funkcję pomocniczą po użyciu
drop function backfill_ai_insights_data();

