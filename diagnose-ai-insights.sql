-- Skrypt diagnostyczny dla AI Insights na produkcji
-- Uruchom w Supabase Dashboard → SQL Editor

-- 1. Sprawdź definicję funkcji (czy ma exception handler)
SELECT 
  'Function Definition' as check_name,
  CASE 
    WHEN pg_get_functiondef(oid) LIKE '%exception%' THEN '✅ Ma exception handler'
    ELSE '❌ Brak exception handlera'
  END as status,
  pg_get_functiondef(oid) as definition
FROM pg_proc 
WHERE proname = 'sync_ai_insights_data';

-- 2. Sprawdź czy są brakujące wpisy w ai_insights_data
SELECT 
  'Missing Entries' as check_name,
  COUNT(*) as missing_count,
  COUNT(DISTINCT te.user_id) as affected_users,
  CASE 
    WHEN COUNT(*) = 0 THEN '✅ Wszystkie wpisy zsynchronizowane'
    ELSE '⚠️ Brakuje ' || COUNT(*) || ' wpisów'
  END as status
FROM time_entries te
WHERE te.deleted_at IS NULL
  AND te.private_note IS NOT NULL
  AND TRIM(te.private_note) != ''
  AND NOT EXISTS (
    SELECT 1 
    FROM ai_insights_data aid 
    WHERE aid.time_entry_id = te.id
  );

-- 3. Sprawdź ostatnie 10 wpisów (czy trafiły do AI insights)
SELECT 
  'Recent Entries' as check_name,
  te.id,
  te.created_at,
  LEFT(te.private_note, 50) as note_preview,
  CASE 
    WHEN aid.id IS NOT NULL THEN '✅ W AI insights'
    WHEN te.private_note IS NULL OR TRIM(te.private_note) = '' THEN '⚪ Brak notatki'
    ELSE '❌ Brak w AI insights'
  END as status
FROM time_entries te
LEFT JOIN ai_insights_data aid ON aid.time_entry_id = te.id
WHERE te.deleted_at IS NULL
ORDER BY te.created_at DESC
LIMIT 10;

-- 4. Statystyki ogólne
SELECT 
  'Statistics' as check_name,
  (SELECT COUNT(*) FROM time_entries WHERE deleted_at IS NULL) as total_entries,
  (SELECT COUNT(*) FROM time_entries WHERE deleted_at IS NULL AND private_note IS NOT NULL AND TRIM(private_note) != '') as entries_with_notes,
  (SELECT COUNT(*) FROM ai_insights_data) as ai_insights_count,
  CASE 
    WHEN (SELECT COUNT(*) FROM time_entries WHERE deleted_at IS NULL AND private_note IS NOT NULL AND TRIM(private_note) != '') = 
         (SELECT COUNT(*) FROM ai_insights_data) 
    THEN '✅ Liczby się zgadzają'
    ELSE '⚠️ Rozbieżność w liczbach'
  END as status;

-- 5. Sprawdź czy trigger istnieje i jest aktywny
SELECT 
  'Trigger Status' as check_name,
  tgname as trigger_name,
  tgenabled as is_enabled,
  CASE 
    WHEN tgenabled = 'O' THEN '✅ Aktywny'
    WHEN tgenabled = 'D' THEN '❌ Wyłączony'
    ELSE '⚠️ Status: ' || tgenabled::text
  END as status
FROM pg_trigger
WHERE tgname = 'sync_time_entries_to_ai_insights';

