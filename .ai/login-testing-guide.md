# Przewodnik testowania logowania - Coinect

## Przygotowanie środowiska testowego

### 1. Upewnij się, że masz konfigurację Supabase

Sprawdź plik `.env`:

```bash
SUPABASE_URL=your_project_url
SUPABASE_KEY=your_anon_key
```

### 2. Utwórz użytkownika testowego w Supabase

**Opcja A: Przez Supabase Dashboard**

1. Wejdź na https://supabase.com
2. Otwórz swój projekt
3. Authentication → Users → Add User
4. Email: `test@coinect.pl`
5. Password: `Test1234`
6. Zapisz

**Opcja B: Przez SQL (jeśli endpoint rejestracji nie istnieje jeszcze)**

```sql
-- W Supabase SQL Editor
-- Użytkownik zostanie utworzony z hasłem, a trigger automatycznie utworzy profil
```

### 3. Uruchom aplikację

```bash
npm run dev
```

## Scenariusze testowe

### Test 1: Przekierowanie zalogowanego użytkownika

**Kroki:**

1. Nie loguj się
2. Otwórz http://localhost:4321
3. **Oczekiwany rezultat:** Przekierowanie na `/login`

**Status:** ⬜ Do przetestowania

---

### Test 2: Nieprawidłowe dane logowania

**Kroki:**

1. Otwórz http://localhost:4321/login
2. Wpisz email: `wrong@email.com`
3. Wpisz hasło: `wrongpass`
4. Kliknij "Zaloguj się"

**Oczekiwany rezultat:**

- ❌ Czerwony alert z komunikatem: "Nieprawidłowy email lub hasło"
- Formularz pozostaje otwarty
- Pole email i hasło są nadal wypełnione

**Status:** ⬜ Do przetestowania

---

### Test 3: Walidacja formularza (email)

**Kroki:**

1. Otwórz http://localhost:4321/login
2. Wpisz email: `invalid-email` (bez @)
3. Wpisz hasło: `Test1234`
4. Kliknij "Zaloguj się"

**Oczekiwany rezultat:**

- ❌ Błąd pod polem email: "Nieprawidłowy format adresu email"
- Request nie jest wysyłany do API
- Loading state nie pojawia się

**Status:** ⬜ Do przetestowania

---

### Test 4: Walidacja formularza (hasło za krótkie)

**Kroki:**

1. Otwórz http://localhost:4321/login
2. Wpisz email: `test@coinect.pl`
3. Wpisz hasło: `short` (< 8 znaków)
4. Kliknij "Zaloguj się"

**Oczekiwany rezultat:**

- ❌ Błąd pod polem hasło: "Hasło musi zawierać minimum 8 znaków"
- Request nie jest wysyłany do API

**Status:** ⬜ Do przetestowania

---

### Test 5: Poprawne logowanie

**Kroki:**

1. Otwórz http://localhost:4321/login
2. Wpisz email: `test@coinect.pl`
3. Wpisz hasło: `Test1234`
4. Kliknij "Zaloguj się"

**Oczekiwany rezultat:**

- ⏳ Loading state (spinner) pojawia się na przycisku
- ✅ Przekierowanie na `/time-entries`
- Użytkownik jest zalogowany

**Sprawdź w DevTools:**

- Application → Cookies → localhost
- Powinny być obecne cookies: `sb-*-auth-token`, `sb-*-auth-token-code-verifier`

**Status:** ⬜ Do przetestowania

---

### Test 6: Utrzymanie sesji

**Warunek wstępny:** Jesteś zalogowany (Test 5 przeszedł)

**Kroki:**

1. Odśwież stronę (F5)
2. **Oczekiwany rezultat:** Pozostajesz na `/time-entries`, nie zostałeś wylogowany

**Status:** ⬜ Do przetestowania

---

### Test 7: Przekierowanie zalogowanego z /login

**Warunek wstępny:** Jesteś zalogowany

**Kroki:**

1. Próbuj wejść na http://localhost:4321/login
2. **Oczekiwany rezultat:** Automatyczne przekierowanie na `/time-entries`

**Status:** ⬜ Do przetestowania

---

### Test 8: Dostęp do chronionych stron bez logowania

**Warunek wstępny:** Jesteś wylogowany

**Kroki:**

1. Wyczyść cookies (Application → Clear site data)
2. Próbuj wejść na http://localhost:4321/time-entries
3. **Oczekiwany rezultat:** Przekierowanie na `/login`

**Status:** ⬜ Do przetestowania

---

### Test 9: Link "Zapomniałeś hasła?"

**Kroki:**

1. Na stronie /login kliknij "Zapomniałeś hasła?"
2. **Oczekiwany rezultat:** Przekierowanie na `/forgot-password`

**Status:** ⬜ Do przetestowania

---

### Test 10: Link "Załóż nowe konto"

**Kroki:**

1. Na stronie /login kliknij "Załóż nowe konto"
2. **Oczekiwany rezultat:** Przekierowanie na `/register`

**Status:** ⬜ Do przetestowania

---

## Testowanie techniczne (DevTools)

### Test Network Request

**Kroki:**

1. Otwórz DevTools → Network
2. Zaloguj się z poprawnymi danymi
3. Znajdź request do `/api/auth/login`

**Sprawdź Request:**

```
POST /api/auth/login
Content-Type: application/json

{
  "email": "test@coinect.pl",
  "password": "Test1234"
}
```

**Sprawdź Response (200 OK):**

```json
{
  "success": true,
  "user": {
    "id": "uuid-here",
    "email": "test@coinect.pl"
  }
}
```

**Sprawdź Response Headers:**

- `Set-Cookie` powinien zawierać cookies Supabase

**Status:** ⬜ Do przetestowania

---

### Test Cookies

**Kroki:**

1. Po zalogowaniu otwórz DevTools → Application → Cookies
2. **Oczekiwane cookies:**
   - `sb-<project-ref>-auth-token` - access token
   - `sb-<project-ref>-auth-token-code-verifier` - code verifier

**Sprawdź atrybuty:**

- HttpOnly: ✅ (dla bezpieczeństwa)
- SameSite: Lax lub Strict
- Secure: ✅ (w produkcji na HTTPS)

**Status:** ⬜ Do przetestowania

---

### Test Console Errors

**Kroki:**

1. Otwórz DevTools → Console
2. Wykonaj wszystkie powyższe testy
3. **Oczekiwany rezultat:** Brak błędów w konsoli (z wyjątkiem expected validation errors)

**Status:** ⬜ Do przetestowania

---

## Testowanie na urządzeniach mobilnych

### Responsywność formularza

**Kroki:**

1. Otwórz DevTools → Toggle device toolbar
2. Wybierz iPhone 12 Pro
3. Sprawdź formularz logowania

**Oczekiwany rezultat:**

- ✅ Formularz jest w pełni widoczny
- ✅ Pola są wystarczająco duże do kliknięcia
- ✅ Przycisk "Zaloguj się" jest dostępny bez scrollowania
- ✅ Wszystkie elementy są czytelne

**Status:** ⬜ Do przetestowania

---

## Znane problemy do rozwiązania (jeśli wystąpią)

### Problem: Cookies nie są ustawiane

**Możliwe przyczyny:**

1. CORS - sprawdź czy frontend i backend są na tej samej domenie
2. Secure flag - w dev powinien być disabled
3. SameSite - sprawdź ustawienia

**Rozwiązanie:**

- Sprawdź konfigurację `createSupabaseServerClient`
- Upewnij się, że context.cookies działa poprawnie

---

### Problem: Przekierowanie nie działa

**Możliwe przyczyny:**

1. Middleware nie działa
2. Session nie jest odczytywana z cookies

**Rozwiązanie:**

- Sprawdź logi w terminalu
- Dodaj console.log w middleware

---

### Problem: "Invalid credentials" mimo prawidłowych danych

**Możliwe przyczyny:**

1. Użytkownik nie istnieje w Supabase Auth
2. Hasło jest nieprawidłowe
3. Email confirmation required (w Supabase settings)

**Rozwiązanie:**

- Sprawdź Supabase Dashboard → Authentication → Users
- Wyłącz email confirmation w Supabase settings (dla dev)

---

## Checklist przed push do produkcji

- [ ] Wszystkie testy manualne przeszły
- [ ] Cookies są ustawiane poprawnie
- [ ] Sesja jest utrzymywana po odświeżeniu
- [ ] Przekierowania działają zgodnie z oczekiwaniami
- [ ] Błędy są wyświetlane czytelnie
- [ ] Formularz jest responsywny
- [ ] Brak błędów w konsoli
- [ ] Build projektu przechodzi bez błędów
- [ ] ENV variables są ustawione w środowisku produkcyjnym
- [ ] HTTPS jest włączone (secure cookies)

---

## Zgłaszanie błędów

Jeśli znajdziesz błąd, zgłoś go z następującymi informacjami:

1. **Tytuł:** Krótki opis problemu
2. **Kroki do odtworzenia:** Dokładne kroki
3. **Oczekiwany rezultat:** Co powinno się stać
4. **Faktyczny rezultat:** Co się stało
5. **Screenshots:** Jeśli możliwe
6. **Console errors:** Błędy z DevTools Console
7. **Network:** Request/Response z DevTools Network
8. **Środowisko:** Browser, OS, wersja
