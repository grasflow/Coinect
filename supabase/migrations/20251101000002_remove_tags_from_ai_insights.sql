-- Migration: Remove tags from ai_insights_data
-- Description: Drops the tags column and related function since tags feature was removed
-- Note: The trigger was already dropped with the time_entry_tags table in 20251101000001

-- Drop the function that syncs tags
DROP FUNCTION IF EXISTS sync_ai_insights_tags();

-- Drop the tags column from ai_insights_data table
ALTER TABLE ai_insights_data DROP COLUMN IF EXISTS tags;
