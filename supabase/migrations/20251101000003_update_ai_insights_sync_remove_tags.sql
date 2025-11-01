-- Migration: Update sync_ai_insights_data function to remove tags references
-- Description: Removes tags column from INSERT/UPDATE operations since tags were removed

create or replace function sync_ai_insights_data()
returns trigger as $$
begin
  -- Only sync if private_note is not null and not empty (after trimming)
  if new.private_note is not null and trim(new.private_note) != '' then
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
      new.private_note
    )
    on conflict (time_entry_id)
    do update set
      date = excluded.date,
      day_of_week = excluded.day_of_week,
      hours = excluded.hours,
      hourly_rate = excluded.hourly_rate,
      private_note = excluded.private_note;
  else
    -- If private_note is null or empty, delete the corresponding ai_insights_data entry
    delete from ai_insights_data where time_entry_id = new.id;
  end if;

  return new;
end;
$$ language plpgsql security definer;
