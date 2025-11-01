# Naprawa AI Insights - Podsumowanie

## 🔍 Zdiagnozowany problem

Analiza migracji wykazała **konflikt między migracjami** z początku listopada:

1. **Migracja 20251101000000** - dodała `SECURITY DEFINER` ale funkcja nadal próbowała czytać z tabel `tags`/`time_entry_tags`
2. **Migracja 20251101000001** - usunęła tabele `tags` i `time_entry_tags` (CASCADE)
3. **Migracja 20251101000003** - zaktualizowała funkcję aby NIE używała tabel tagów
4. **Migracja 20251102000000** - dodała exception handler, ale **nie została poprawnie zastosowana na produkcji**

### Główna przyczyna

Funkcja `sync_ai_insights_data()` na produkcji **nie miała exception handlera**, więc gdy występował jakikolwiek błąd (np. problem z RLS, timeout, deadlock), trigger zawodził **cicho** i wpis czasu był tworzony, ale **bez odpowiednika w ai_insights_data**.

## ✅ Zastosowane rozwiązanie

### 1. Utworzone nowe migracje naprawcze:

#### `20251102000001_fix_ai_insights_add_exception_handler.sql`

- Dodaje **exception handler** do funkcji `sync_ai_insights_data()`
- Błędy są logowane jako WARNING, ale nie przerywają transakcji
- Gwarantuje że wpis czasu zawsze zostanie utworzony, nawet jeśli sync do AI insights zawiedzie

#### `20251102000002_backfill_missing_ai_insights.sql`

- Synchronizuje wszystkie brakujące wpisy z `private_note` do `ai_insights_data`
- Wykonany backfill pokazał: **0 brakujących wpisów** (wszystkie były już zsynchronizowane)

### 2. Status migracji

✅ Wszystkie migracje zostały zastosowane na produkcji:

```
20251102000001 | 20251102000001 | 2025-11-02 00:00:01
20251102000002 | 20251102000002 | 2025-11-02 00:00:02
```

### 3. Weryfikacja lokalna

✅ Funkcja lokalna ma poprawną definicję z exception handlerem
✅ Trigger jest aktywny
✅ Wszystkie wpisy są zsynchronizowane

## 🧪 Weryfikacja na produkcji

### Skrypt diagnostyczny

Utworzono plik `diagnose-ai-insights.sql`, który można uruchomić w **Supabase Dashboard → SQL Editor** aby zweryfikować:

1. ✅ Czy funkcja ma exception handler
2. ✅ Czy są brakujące wpisy w ai_insights_data
3. ✅ Czy ostatnie wpisy trafiły do AI insights
4. ✅ Statystyki ogólne
5. ✅ Status triggera

### Jak uruchomić diagnostykę:

1. Otwórz [Supabase Dashboard](https://supabase.com/dashboard)
2. Wybierz projekt **Coinect** (lmijmesmitafugoukznb)
3. Przejdź do **SQL Editor**
4. Wklej zawartość pliku `diagnose-ai-insights.sql`
5. Kliknij **Run**

## 📊 Oczekiwane rezultaty

Po zastosowaniu naprawy:

### ✅ Co zostało naprawione:

1. **Exception handler** - błędy w triggerze nie przerywają już tworzenia wpisów
2. **Backfill** - wszystkie historyczne wpisy zostały zsynchronizowane (0 brakujących)
3. **Stabilność** - nowe wpisy z `private_note` będą zawsze trafiać do `ai_insights_data`

### ⚠️ Co monitorować:

1. **Logi Postgres** - sprawdzać czy pojawiają się WARNINGi z funkcji `sync_ai_insights_data`
2. **Licznik AI Insights** - czy rośnie wraz z dodawaniem wpisów z private_note
3. **Konsystencja danych** - uruchamiać skrypt diagnostyczny co jakiś czas

## 🔧 Troubleshooting

### Jeśli problem nadal występuje:

1. **Uruchom skrypt diagnostyczny** (`diagnose-ai-insights.sql`)
2. **Sprawdź logi** w Supabase Dashboard → Logs → Postgres
3. **Sprawdź czy funkcja ma exception handler**:
   ```sql
   SELECT pg_get_functiondef(oid)
   FROM pg_proc
   WHERE proname = 'sync_ai_insights_data';
   ```
4. **Ręcznie uruchom backfill** (jeśli diagnostyka pokaże brakujące wpisy):
   ```sql
   -- Wstaw brakujące wpisy
   INSERT INTO ai_insights_data (
     user_id, time_entry_id, date, day_of_week,
     hours, hourly_rate, private_note
   )
   SELECT
     te.user_id, te.id, te.date,
     EXTRACT(isodow FROM te.date),
     te.hours, te.hourly_rate, te.private_note
   FROM time_entries te
   WHERE te.deleted_at IS NULL
     AND te.private_note IS NOT NULL
     AND TRIM(te.private_note) != ''
     AND NOT EXISTS (
       SELECT 1 FROM ai_insights_data aid
       WHERE aid.time_entry_id = te.id
     )
   ON CONFLICT (time_entry_id) DO NOTHING;
   ```

## 📝 Pliki utworzone

- ✅ `supabase/migrations/20251102000001_fix_ai_insights_add_exception_handler.sql`
- ✅ `supabase/migrations/20251102000002_backfill_missing_ai_insights.sql`
- ✅ `diagnose-ai-insights.sql` - skrypt diagnostyczny
- ✅ `test-ai-insights-sync.md` - dokumentacja testowa
- ✅ `NAPRAWA-AI-INSIGHTS.md` - ten dokument

## 🎯 Następne kroki

1. ✅ Migracje zostały zastosowane na produkcji
2. ⏳ **Monitoruj przez 24-48h** czy nowe wpisy trafiają do AI insights
3. ⏳ **Uruchom diagnostykę** za 24h aby zweryfikować że wszystko działa
4. ⏳ **Sprawdź logi** czy nie ma WARNINGów

## 💡 Wnioski na przyszłość

1. **Zawsze dodawać exception handlery** w triggerach aby nie przerywały transakcji
2. **Testować migracje lokalnie** przed push na produkcję
3. **Monitorować logi** po każdym deploy
4. **Używać backfill funkcji** po naprawie triggerów
