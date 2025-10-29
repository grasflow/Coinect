# Podsumowanie integracji frontendu z backendem - Autentykacja

## Co zostało zrobione

### 1. Endpointy API

Utworzone endpointy autentykacji:
- ✅ `POST /api/auth/login` - Logowanie użytkownika
- ✅ `POST /api/auth/register` - Rejestracja nowego użytkownika
- ✅ `POST /api/auth/logout` - Wylogowanie użytkownika
- ✅ `POST /api/auth/forgot-password` - Wysyłanie emaila z linkiem resetującym

**Uwaga:** Endpoint `POST /api/auth/reset-password` został usunięty, ponieważ reset hasła jest obsługiwany bezpośrednio przez klienta Supabase w przeglądarce (bezpieczniejsze rozwiązanie).

### 2. Komponenty React

Wszystkie komponenty zostały połączone z backendem:

#### LoginForm.tsx
- Walidacja po stronie klienta (Zod)
- Wysyłanie danych do `/api/auth/login`
- Obsługa błędów (nieprawidłowe dane, błędy sieciowe)
- Automatyczne przekierowanie po sukcesie do `/time-entries`
- Wyświetlanie komunikatu sukcesu po resecie hasła

#### RegisterForm.tsx
- Walidacja pełnych danych rejestracyjnych
- Wysyłanie do `/api/auth/register`
- Obsługa danych opcjonalnych (NIP, adres)
- Walidacja hasła (minimum 8 znaków, litera + cyfra)
- Potwierdzenie hasła

#### ForgotPasswordForm.tsx
- Prosty formularz z emailem
- Wysyłanie do `/api/auth/forgot-password`
- Wyświetlanie komunikatu sukcesu po wysłaniu emaila
- Link powrotu do logowania

#### ResetPasswordForm.tsx
- **Specjalne rozwiązanie:** Używa `supabaseBrowserClient` bezpośrednio
- Sprawdza sesję recovery z Supabase (automatycznie ustawianą przez magic link)
- Walidacja nowego hasła
- Automatyczne wylogowanie po zmianie hasła
- Przekierowanie do logowania z komunikatem sukcesu

#### UserMenu.tsx
- Dialog potwierdzenia wylogowania
- Wywołanie `/api/auth/logout`
- Przekierowanie po wylogowaniu

### 3. Middleware autentykacji

Plik: `src/middleware/index.ts`

Funkcjonalności:
- Automatyczne przekierowanie niezalogowanych na `/login`
- Blokada stron auth dla zalogowanych użytkowników
- Dostęp do publicznych ścieżek bez logowania
- Wstrzykiwanie `supabase` do `context.locals`

Chronione routes:
- `/time-entries`
- `/clients`
- `/` (dashboard - przekierowuje na time-entries)

Publiczne routes:
- `/kitchen-sink`

Auth routes (dostępne tylko dla niezalogowanych):
- `/login`
- `/register`
- `/forgot-password`
- `/reset-password`

### 4. Supabase Configuration

#### Klienty Supabase

1. **supabase.server.ts** - Server-side
   - `createSupabaseServerClient(cookies)` - używany w middleware i API
   - Automatyczna obsługa cookies przez `@supabase/ssr`

2. **supabase.browser.ts** - Client-side
   - `supabaseBrowserClient` - używany w komponentach React
   - Automatyczne zarządzanie sesjami

3. **supabase.client.ts** - Legacy (deprecated)
   - Zachowany dla kompatybilności z istniejącymi endpointami
   - `DEFAULT_USER_ID` - fallback do testowania

#### Zmienne środowiskowe

Wszystkie zmienne w pliku `.env` (należy utworzyć lokalnie):

```bash
# Public keys
PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0

# Server keys
SUPABASE_URL=http://127.0.0.1:54321
SUPABASE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0

# OpenRouter (opcjonalne)
OPENROUTER_API_KEY=your_key_here
```

### 5. AuthService

Plik: `src/lib/services/auth.service.ts`

Centralizuje logikę autentykacji:
- `login(email, password)` - Logowanie
- `register(data)` - Rejestracja + tworzenie profilu
- `logout()` - Wylogowanie
- `getSession()` - Pobieranie sesji
- `getCurrentUser()` - Pobieranie użytkownika
- `sendPasswordResetEmail(email, redirectUrl)` - Reset hasła
- `updatePassword(newPassword)` - Zmiana hasła

### 6. Walidacja Zod

Plik: `src/lib/validation/auth.schema.ts`

Schematy:
- `loginSchema` - email + hasło (min 8 znaków)
- `registerSchema` - pełne dane + potwierdzenie hasła
- `forgotPasswordSchema` - email
- `resetPasswordSchema` - nowe hasło + potwierdzenie

### 7. Obsługa błędów

Plik: `src/lib/errors.ts`

Klasa `AuthError` z kodami:
- `INVALID_CREDENTIALS` - Nieprawidłowe dane logowania
- `EMAIL_TAKEN` - Email już zajęty
- `WEAK_PASSWORD` - Za słabe hasło
- `LOGIN_ERROR` / `SIGNUP_ERROR` - Ogólne błędy
- `PASSWORD_RESET_ERROR` - Błąd resetu hasła
- `PASSWORD_UPDATE_ERROR` - Błąd aktualizacji hasła

## Jak to działa

### Flow logowania

1. Użytkownik wpisuje email i hasło w `LoginForm`
2. Walidacja po stronie klienta (Zod)
3. POST do `/api/auth/login`
4. Backend wywołuje `AuthService.login()`
5. Supabase ustawia cookies przez `createSupabaseServerClient`
6. Zwrócenie sukcesu do frontendu
7. Frontend przekierowuje na `/time-entries`
8. Middleware odczytuje cookies i przepuszcza do chronionej strony

### Flow rejestracji

1. Użytkownik wypełnia formularz w `RegisterForm`
2. Walidacja (hasło, NIP, itp.)
3. POST do `/api/auth/register`
4. Backend:
   - Tworzy użytkownika w Supabase Auth
   - Trigger w bazie tworzy profil automatycznie
   - Opcjonalnie aktualizuje profil dodatkowymi danymi
5. Automatyczne zalogowanie + przekierowanie

### Flow resetowania hasła

1. Użytkownik wpisuje email w `ForgotPasswordForm`
2. POST do `/api/auth/forgot-password`
3. Backend wysyła email przez Supabase (z linkiem zawierającym token)
4. Użytkownik klika link → otwarcie `/reset-password#access_token=...`
5. `ResetPasswordForm` sprawdza sesję recovery
6. Zmiana hasła bezpośrednio przez `supabaseBrowserClient.auth.updateUser()`
7. Wylogowanie + przekierowanie do logowania

### Flow wylogowania

1. Kliknięcie "Wyloguj" w `UserMenu`
2. Dialog potwierdzenia
3. POST do `/api/auth/logout`
4. Backend wywołuje `supabase.auth.signOut()`
5. Przekierowanie do `/login`

## Konfiguracja Supabase Local

### Wymagane kroki

1. **Instalacja Supabase CLI:**
   ```bash
   brew install supabase/tap/supabase
   ```

2. **Uruchomienie lokalnej instancji:**
   ```bash
   supabase start
   ```

3. **Utworzenie pliku `.env`** z kluczami API (jak wyżej)

4. **Uruchomienie aplikacji:**
   ```bash
   npm run dev
   ```

### Konfiguracja emaili (localhost)

Supabase lokalnie używa **Inbucket** do przechwytywania emaili:
- URL: http://localhost:54324
- Wszystkie emaile (resetowanie hasła, potwierdzenia) są dostępne w Inbucket
- Nie są wysyłane prawdziwe emaile

### Supabase Studio

Lokalne GUI do zarządzania bazą:
```bash
supabase studio
```
Lub: http://localhost:54323

## Istniejące endpointy z auth

Wszystkie endpointy API już obsługują autentykację z fallbackiem:

### Clients
- `GET /api/clients` - Pobiera klientów zalogowanego użytkownika
- `POST /api/clients` - Tworzy klienta dla zalogowanego użytkownika
- `PUT /api/clients/[id]` - Aktualizuje (tylko swojego klienta)
- `DELETE /api/clients/[id]` - Usuwa (soft delete, tylko swojego)

### Time Entries
- `GET /api/time-entries` - Pobiera wpisy zalogowanego użytkownika
- `POST /api/time-entries` - Tworzy wpis dla zalogowanego użytkownika
- `PUT /api/time-entries/[id]` - Aktualizuje (tylko swój wpis)
- `DELETE /api/time-entries/[id]` - Usuwa (tylko swój wpis)

**Uwaga:** Endpointy używają `DEFAULT_USER_ID` jako fallback, gdy brak autentykacji. To pozwala na testowanie bez logowania, ale w produkcji ten fallback powinien być usunięty.

## Co dalej

### Rekomendowane ulepszenia

1. **Usunąć DEFAULT_USER_ID z produkcji**
   - Wymagać autentykacji dla wszystkich endpointów API
   - Zwracać 401 Unauthorized zamiast fallbacku

2. **Email confirmation**
   - Supabase może wymagać potwierdzenia emaila przed logowaniem
   - Konfiguracja w `supabase/config.toml`: `enable_email_confirmations = true`

3. **Rate limiting**
   - Dodać limitowanie prób logowania
   - Konfiguracja w Supabase lub własny middleware

4. **Session refresh**
   - Implementacja automatycznego odświeżania tokenów
   - Obsługa w `supabase.browser.ts`

5. **User profile page**
   - Strona `/profile` do edycji danych użytkownika
   - Zmiana hasła bez resetu

6. **Social auth** (opcjonalnie)
   - Google, GitHub, itp.
   - Konfiguracja w Supabase

## Testowanie

### Scenariusze testowe

1. ✅ Rejestracja nowego użytkownika
2. ✅ Logowanie z poprawnymi danymi
3. ✅ Logowanie z błędnymi danymi
4. ✅ Zapomnienie hasła → email → reset
5. ✅ Wylogowanie
6. ✅ Dostęp do chronionej strony bez logowania → redirect
7. ✅ Dostęp do strony logowania po zalogowaniu → redirect

### Dane testowe

Baza danych uruchamia się z czystą strukturą bez danych testowych. Użytkownicy muszą być utworzeni przez rejestrację.

## Troubleshooting

### Problem: "Invalid JWT token"
**Rozwiązanie:** Sprawdź czy klucze w `.env` zgadzają się z output `supabase status`

### Problem: "Email not confirmed"
**Rozwiązanie:** W trybie lokalnym to jest wyłączone. Sprawdź Inbucket: http://localhost:54324

### Problem: "CORS error"
**Rozwiązanie:** Sprawdź `supabase/config.toml` → `additional_redirect_urls`

### Problem: "Cannot read cookies"
**Rozwiązanie:** Upewnij się, że używasz `createSupabaseServerClient()` w middleware/API

## Dokumentacja techniczna

- [Supabase Auth Docs](https://supabase.com/docs/guides/auth)
- [Supabase SSR Package](https://supabase.com/docs/guides/auth/server-side/creating-a-client)
- [Astro Middleware](https://docs.astro.build/en/guides/middleware/)

