# Szybki przewodnik testowania autentykacji

## Setup (jednorazowo)

### 1. Utwórz plik `.env` w katalogu głównym projektu:

```bash
# Supabase Local Development
PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0

SUPABASE_URL=http://127.0.0.1:54321
SUPABASE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0

OPENROUTER_API_KEY=your_key_here
```

### 2. Uruchom Supabase lokalnie:

```bash
supabase start
```

Jeśli pojawi się błąd "command not found: supabase":
```bash
brew install supabase/tap/supabase
```

### 3. Uruchom aplikację:

```bash
npm run dev
```

## Testy funkcjonalne

### Test 1: Rejestracja nowego użytkownika

1. Otwórz: http://localhost:4321/register
2. Wypełnij formularz:
   - Imię i nazwisko: `Jan Kowalski`
   - Email: `jan@test.pl`
   - Hasło: `Test1234`
   - Potwierdź hasło: `Test1234`
   - (Opcjonalnie) NIP: `1234567890`
3. Kliknij "Zarejestruj się"
4. **Oczekiwany rezultat:** Automatyczne przekierowanie na `/time-entries`

### Test 2: Logowanie

1. Wyloguj się (jeśli jesteś zalogowany)
2. Otwórz: http://localhost:4321/login
3. Wpisz dane:
   - Email: `jan@test.pl`
   - Hasło: `Test1234`
4. Kliknij "Zaloguj się"
5. **Oczekiwany rezultat:** Przekierowanie na `/time-entries`

### Test 3: Middleware - redirect niezalogowanych

1. Wyloguj się
2. Spróbuj wejść bezpośrednio na: http://localhost:4321/time-entries
3. **Oczekiwany rezultat:** Automatyczne przekierowanie na `/login`

### Test 4: Middleware - redirect zalogowanych ze stron auth

1. Zaloguj się
2. Spróbuj wejść na: http://localhost:4321/login
3. **Oczekiwany rezultat:** Automatyczne przekierowanie na `/time-entries`

### Test 5: Zapomniałem hasła

1. Wyloguj się
2. Otwórz: http://localhost:4321/login
3. Kliknij "Zapomniałeś hasła?"
4. Wpisz email: `jan@test.pl`
5. Kliknij "Wyślij link resetujący"
6. **Oczekiwany rezultat:** Komunikat "Link do resetowania hasła został wysłany"
7. Otwórz Inbucket: http://localhost:54324
8. Znajdź email i kliknij link resetujący
9. Wpisz nowe hasło i potwierdź
10. **Oczekiwany rezultat:** Przekierowanie na `/login` z komunikatem sukcesu

### Test 6: Wylogowanie

1. Będąc zalogowanym, kliknij ikonę użytkownika w prawym górnym rogu
2. Kliknij "Wyloguj"
3. Potwierdź w dialogu
4. **Oczekiwany rezultat:** Przekierowanie na `/login`

### Test 7: Walidacja formularzy

#### Rejestracja - słabe hasło
1. Otwórz: http://localhost:4321/register
2. Wpisz hasło: `test` (za krótkie)
3. **Oczekiwany rezultat:** Komunikat "Hasło musi zawierać minimum 8 znaków"

#### Rejestracja - niezgodne hasła
1. Hasło: `Test1234`
2. Potwierdź: `Test12345`
3. **Oczekiwany rezultat:** Komunikat "Hasła muszą być identyczne"

#### Login - nieprawidłowe dane
1. Otwórz: http://localhost:4321/login
2. Email: `jan@test.pl`
3. Hasło: `ZleHaslo123`
4. **Oczekiwany rezultat:** Komunikat "Nieprawidłowy email lub hasło"

### Test 8: Dane użytkownika w komponencie

1. Zaloguj się
2. Sprawdź prawą górny róg - powinno być widoczne imię użytkownika
3. Kliknij menu → powinien być email

## Dostęp do narzędzi deweloperskich

### Supabase Studio (GUI bazy danych)
```bash
supabase studio
```
Lub: http://localhost:54323

**Użycie:**
- Przeglądaj tabele (`auth.users`, `public.profiles`)
- Sprawdzaj sesje użytkowników
- Testuj SQL queries

### Inbucket (przechwytywanie emaili)
http://localhost:54324

**Użycie:**
- Wszystkie emaile wysyłane przez Supabase lądują tutaj
- Reset hasła, potwierdzenia, itp.

### Supabase Status
```bash
supabase status
```

Wyświetla wszystkie URLe i klucze API.

## Rozwiązywanie problemów

### Problem: Nie mogę się zalogować po rejestracji

**Możliwe przyczyny:**
1. Email confirmation jest włączony → Sprawdź Inbucket i potwierdź email
2. Błąd w bazie → Sprawdź logi: `supabase logs`

**Rozwiązanie:**
```bash
supabase db reset
```

### Problem: "Invalid token" lub "JWT expired"

**Rozwiązanie:**
1. Wyczyść cookies w przeglądarce
2. Restartuj Supabase: `supabase stop && supabase start`

### Problem: Middleware nie przekierowuje

**Sprawdź:**
1. Czy middleware jest włączony w `astro.config.mjs`
2. Czy cookies są ustawiane (sprawdź DevTools → Application → Cookies)

### Problem: Brak danych użytkownika po zalogowaniu

**Sprawdź:**
1. Czy trigger tworzenia profilu działa:
   ```sql
   SELECT * FROM profiles WHERE id = 'user_id';
   ```
2. Sprawdź logi Supabase: `supabase logs`

## Reset środowiska

Jeśli coś się popsuło, resetuj:

```bash
# Zatrzymaj Supabase
supabase stop

# Uruchom ponownie (zachowuje dane)
supabase start

# LUB: Pełny reset (usuwa wszystkie dane)
supabase db reset
```

## Dane testowe

Baza danych uruchamia się bez danych testowych. Aby przetestować aplikację:

- Zarejestruj nowego użytkownika przez formularz rejestracji
- Utwórz klientów i wpisy czasu manualnie przez interfejs

## Checklist przed commitem

- [ ] Wszystkie testy przechodzą
- [ ] Brak błędów w konsoli przeglądarki
- [ ] Brak błędów lintingu: `npm run lint`
- [ ] `.env` NIE jest committowany (dodany do `.gitignore`)
- [ ] Dokumentacja jest aktualna

## Następne kroki

Po zweryfikowaniu, że wszystko działa:

1. Usuń `DEFAULT_USER_ID` fallback z endpointów API
2. Dodaj testy automatyczne (Playwright/Vitest)
3. Skonfiguruj email confirmation (opcjonalnie)
4. Dodaj rate limiting dla endpointów auth

