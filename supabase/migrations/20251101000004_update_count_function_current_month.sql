-- Migration: Update count_time_entries_with_valid_notes to filter by current month
-- Description: Adds date filter to count only entries from the current month

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
      and date >= date_trunc('month', current_date)  -- Filter for current month only
  );
end;
$$ language plpgsql security definer;
