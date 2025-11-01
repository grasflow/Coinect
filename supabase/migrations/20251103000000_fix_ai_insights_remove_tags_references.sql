-- Migration: Fix AI insights trigger to remove tags references
-- Description: Removes tags column references from sync_ai_insights_data function
-- Affected: sync_ai_insights_data function
-- Special considerations: This fixes the bug where the trigger references the removed tags column

create or replace function sync_ai_insights_data()
returns trigger as $$
begin
  -- If time entry was soft-deleted, remove from ai_insights_data
  if new.deleted_at is not null then
    delete from ai_insights_data where time_entry_id = new.id;
    return new;
  end if;

  -- Insert or update AI data only if private_note is filled (after trimming whitespace)
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
    -- Remove AI entry if private_note was removed or contains only whitespace
    delete from ai_insights_data where time_entry_id = new.id;
  end if;

  return new;
end;
$$ language plpgsql security definer;
