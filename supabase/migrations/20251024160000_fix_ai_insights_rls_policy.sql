-- migration: fix AI insights RLS policy to allow triggers to insert data
-- description: zmienia policy dla ai_insights_data aby pozwalała na INSERT przez triggery
-- rationale: triggery działają w kontekście użytkownika, więc with check (false) blokuje także triggery
-- fix: zmieniamy policy aby pozwalała na INSERT gdy user_id = auth.uid()

-- Drop existing policies
drop policy if exists "ai_insights_data_insert_authenticated" on ai_insights_data;
drop policy if exists "ai_insights_data_update_authenticated" on ai_insights_data;
drop policy if exists "ai_insights_data_delete_authenticated" on ai_insights_data;

-- Recreate INSERT policy: allow inserts when user_id matches authenticated user
-- This allows triggers (which run in user context) to insert data
create policy "ai_insights_data_insert_authenticated" on ai_insights_data
  for insert
  to authenticated
  with check (user_id = auth.uid());

-- Recreate UPDATE policy: allow updates when user_id matches authenticated user
-- This allows triggers (which run in user context) to update data
create policy "ai_insights_data_update_authenticated" on ai_insights_data
  for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- Recreate DELETE policy: allow deletes when user_id matches authenticated user
-- This allows triggers (which run in user context) to delete data
create policy "ai_insights_data_delete_authenticated" on ai_insights_data
  for delete
  to authenticated
  using (user_id = auth.uid());
