# Jak przetestować naprawę AI Insights

## 🎯 Cel

Zweryfikować że wpisy z `private_note` trafiają do `ai_insights_data` na produkcji.

## 📋 Krok po kroku

### 1. Uruchom diagnostykę (opcjonalnie)

**Gdzie:** Supabase Dashboard → SQL Editor  
**Co:** Wklej zawartość pliku `diagnose-ai-insights.sql` i uruchom

**Oczekiwany rezultat:**

- ✅ Funkcja ma exception handler
- ✅ Trigger jest aktywny
- ✅ Brak brakujących wpisów

---

### 2. Utwórz testowy wpis na produkcji

**Gdzie:** https://my.coinect.pl

**Kroki:**

1. Zaloguj się na produkcji
2. Przejdź do **Time Entries**
3. Kliknij **Dodaj wpis**
4. Wypełnij formularz:
   - **Klient:** (wybierz dowolnego)
   - **Data:** dzisiejsza data
   - **Godziny:** 1
   - **Private Note:** `Test AI Insights - $(date +%Y-%m-%d-%H-%M-%S)`
5. Kliknij **Zapisz**

---

### 3. Sprawdź czy wpis trafił do AI Insights

**Metoda A: Przez UI**

1. Przejdź do **Dashboard**
2. Znajdź widget **AI Insights**
3. Sprawdź czy licznik wzrósł o 1

**Metoda B: Przez SQL (bardziej dokładna)**

Otwórz **Supabase Dashboard → SQL Editor** i uruchom:

```sql
-- Sprawdź ostatni wpis
SELECT
  te.id,
  te.created_at,
  te.private_note,
  aid.id IS NOT NULL as in_ai_insights,
  aid.created_at as ai_insights_created_at
FROM time_entries te
LEFT JOIN ai_insights_data aid ON aid.time_entry_id = te.id
WHERE te.deleted_at IS NULL
  AND te.private_note LIKE 'Test AI Insights%'
ORDER BY te.created_at DESC
LIMIT 1;
```

**Oczekiwany rezultat:**

```
| id | created_at | private_note | in_ai_insights | ai_insights_created_at |
|----|------------|--------------|----------------|------------------------|
| ... | 2025-11-02 | Test AI...   | true           | 2025-11-02 ...         |
```

---

### 4. Test aktualizacji wpisu

**Kroki:**

1. Edytuj utworzony testowy wpis
2. Zmień **Private Note** na: `Test AI Insights - UPDATED`
3. Zapisz

**Sprawdź przez SQL:**

```sql
-- Sprawdź czy notatka została zaktualizowana w ai_insights_data
SELECT
  te.private_note as time_entry_note,
  aid.private_note as ai_insights_note,
  te.updated_at as time_entry_updated,
  aid.created_at as ai_insights_created
FROM time_entries te
JOIN ai_insights_data aid ON aid.time_entry_id = te.id
WHERE te.private_note LIKE 'Test AI Insights%'
ORDER BY te.updated_at DESC
LIMIT 1;
```

**Oczekiwany rezultat:**

- Obie notatki powinny być identyczne: `Test AI Insights - UPDATED`

---

### 5. Test usunięcia notatki

**Kroki:**

1. Edytuj testowy wpis
2. Usuń całą zawartość **Private Note** (zostaw puste)
3. Zapisz

**Sprawdź przez SQL:**

```sql
-- Sprawdź czy wpis został usunięty z ai_insights_data
SELECT
  te.id,
  te.private_note,
  aid.id IS NOT NULL as still_in_ai_insights
FROM time_entries te
LEFT JOIN ai_insights_data aid ON aid.time_entry_id = te.id
WHERE te.id = 'WKLEJ_ID_TESTOWEGO_WPISU'
LIMIT 1;
```

**Oczekiwany rezultat:**

- `private_note` = NULL lub pusty string
- `still_in_ai_insights` = false

---

### 6. Sprzątanie

Usuń testowy wpis:

1. Znajdź testowy wpis w **Time Entries**
2. Kliknij ikonę kosza
3. Potwierdź usunięcie

---

## ✅ Kryteria sukcesu

Test jest **zaliczony** jeśli:

1. ✅ Nowy wpis z `private_note` pojawia się w `ai_insights_data`
2. ✅ Aktualizacja `private_note` aktualizuje `ai_insights_data`
3. ✅ Usunięcie `private_note` usuwa wpis z `ai_insights_data`
4. ✅ Licznik w AI Insights Widget rośnie/maleje odpowiednio

---

## ❌ Co robić jeśli test nie przechodzi?

### Problem: Wpis nie trafia do ai_insights_data

1. **Sprawdź logi:**
   - Supabase Dashboard → Logs → Postgres
   - Szukaj WARNINGów zawierających "sync_ai_insights_data"

2. **Uruchom diagnostykę:**

   ```sql
   -- Sprawdź czy funkcja ma exception handler
   SELECT pg_get_functiondef(oid)
   FROM pg_proc
   WHERE proname = 'sync_ai_insights_data';
   ```

3. **Ręcznie zsynchronizuj brakujące wpisy:**

   ```sql
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

4. **Zgłoś problem** z załączeniem:
   - Wyników diagnostyki
   - Logów z Postgres
   - ID testowego wpisu

---

## 📊 Monitoring długoterminowy

Po teście, monitoruj przez **24-48 godzin**:

1. **Codziennie uruchamiaj diagnostykę** (`diagnose-ai-insights.sql`)
2. **Sprawdzaj logi** pod kątem WARNINGów
3. **Weryfikuj licznik** w AI Insights Widget

Jeśli przez 48h nie ma problemów → **naprawa zakończona sukcesem** ✅
