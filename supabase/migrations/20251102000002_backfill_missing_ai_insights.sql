-- migration: backfill missing AI insights data
-- description: synchronizuje wszystkie brakujące wpisy z private_note do ai_insights_data
-- affected: ai_insights_data table
-- special considerations: naprawia dane po problemach z triggerem

-- funkcja pomocnicza do backfill brakujących wpisów
create or replace function backfill_missing_ai_insights()
returns table(inserted_count bigint) as $$
declare
  v_inserted_count bigint;
begin
  -- wstaw wszystkie brakujące wpisy z private_note
  with inserted as (
    insert into ai_insights_data (
      user_id,
      time_entry_id,
      date,
      day_of_week,
      hours,
      hourly_rate,
      private_note
    )
    select
      te.user_id,
      te.id as time_entry_id,
      te.date,
      extract(isodow from te.date) as day_of_week,
      te.hours,
      te.hourly_rate,
      te.private_note
    from time_entries te
    where te.deleted_at is null
      and te.private_note is not null
      and trim(te.private_note) != ''
      and not exists (
        select 1
        from ai_insights_data aid
        where aid.time_entry_id = te.id
      )
    on conflict (time_entry_id) do nothing
    returning *
  )
  select count(*) into v_inserted_count from inserted;
  
  return query select v_inserted_count;
end;
$$ language plpgsql security definer;

-- wykonaj backfill i pokaż wynik
do $$
declare
  v_result bigint;
begin
  select * into v_result from backfill_missing_ai_insights();
  raise notice 'Backfilled % missing AI insights entries', v_result;
end;
$$;

-- usuń funkcję pomocniczą
drop function backfill_missing_ai_insights();

