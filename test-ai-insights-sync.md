# Test synchronizacji AI Insights na produkcji

## Status migracji

✅ Wszystkie migracje zostały zastosowane na produkcji:

- 20251102000001 - Dodaje exception handler do funkcji
- 20251102000002 - Backfill brakujących danych (0 wpisów)

## Weryfikacja lokalna

✅ Funkcja lokalna ma poprawną definicję z exception handlerem

## Problem z cache

Dump bazy pokazuje starą wersję funkcji, ale to może być problem z cache w `supabase db dump`.

## Następne kroki

1. **Test manualny na produkcji**: Utworzyć wpis czasu z private_note i sprawdzić czy trafia do ai_insights_data
2. **Sprawdzić logi Postgres**: Szukać warningów z funkcji sync_ai_insights_data
3. **Zweryfikować funkcję bezpośrednio**: Użyć psql do sprawdzenia definicji funkcji

## Możliwe przyczyny problemu

### Scenariusz 1: Cache w dump

- `supabase db dump` może pokazywać cache
- Funkcja faktycznie jest zaktualizowana, ale dump pokazuje starą wersję

### Scenariusz 2: Problem z DECLARE

- Stara wersja funkcji (20251101000003) nie ma bloku DECLARE
- Nowa wersja (20251102000001) ma DECLARE
- Jeśli migracja się nie wykonała, funkcja nie ma exception handlera

### Scenariusz 3: Timing issue

- Wpisy tworzone PRZED zastosowaniem migracji mogły zawieść
- Nowe wpisy powinny działać poprawnie

## Rekomendacja

**Monitorować produkcję przez następne 24h:**

1. Sprawdzić czy nowe wpisy z private_note trafiają do ai_insights_data
2. Sprawdzić logi Postgres pod kątem warningów
3. Jeśli problem nadal występuje, zastosować funkcję bezpośrednio przez SQL

## SQL do weryfikacji funkcji na produkcji

```sql
-- Sprawdź definicję funkcji
SELECT pg_get_functiondef(oid)
FROM pg_proc
WHERE proname = 'sync_ai_insights_data';

-- Sprawdź czy są brakujące wpisy
SELECT
  COUNT(*) as missing_count,
  COUNT(DISTINCT te.user_id) as affected_users
FROM time_entries te
WHERE te.deleted_at IS NULL
  AND te.private_note IS NOT NULL
  AND TRIM(te.private_note) != ''
  AND NOT EXISTS (
    SELECT 1
    FROM ai_insights_data aid
    WHERE aid.time_entry_id = te.id
  );

-- Sprawdź ostatnie wpisy
SELECT
  te.id,
  te.created_at,
  te.private_note IS NOT NULL as has_note,
  aid.id IS NOT NULL as in_ai_insights
FROM time_entries te
LEFT JOIN ai_insights_data aid ON aid.time_entry_id = te.id
WHERE te.deleted_at IS NULL
ORDER BY te.created_at DESC
LIMIT 10;
```
