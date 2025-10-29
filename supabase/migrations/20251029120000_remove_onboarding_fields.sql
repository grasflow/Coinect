-- Remove onboarding fields from profiles table
-- Migration created: 2025-10-29

ALTER TABLE profiles DROP COLUMN IF EXISTS onboarding_completed;
ALTER TABLE profiles DROP COLUMN IF EXISTS onboarding_step;

