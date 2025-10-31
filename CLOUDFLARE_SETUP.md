# Konfiguracja Cloudflare Pages - Zmienne Środowiskowe

## Problem
Po deploymencie na Cloudflare Pages formularz logowania/rejestracji pokazuje błąd "required" przy validacji pól, mimo że dane są prawidłowo wypełnione.

## Przyczyna
Kod serwerowy (Cloudflare Workers) nie ma dostępu do zmiennych środowiskowych `SUPABASE_URL` i `SUPABASE_KEY`, przez co autentykacja nie działa poprawnie.

## Rozwiązanie

### Krok 1: Skonfiguruj zmienne w Cloudflare Pages Dashboard

1. **Zaloguj się do Cloudflare Dashboard**: https://dash.cloudflare.com/

2. **Przejdź do swojego projektu**:
   - Workers & Pages → Twój projekt (prawdopodobnie "coinect")

3. **Otwórz ustawienia zmiennych środowiskowych**:
   - Zakładka "Settings"
   - Sekcja "Environment variables"

4. **Dodaj zmienne dla środowiska Production**:

   Kliknij "Add variable" i dodaj następujące zmienne:

   | Zmienna | Wartość |
   |---------|---------|
   | `SUPABASE_URL` | Twój Supabase Project URL (np. `https://xxxxx.supabase.co`) |
   | `SUPABASE_KEY` | Twój Supabase Anon/Public Key (zaczyna się od `eyJ...`) |

5. **Zapisz zmiany**:
   - Kliknij "Save" przy każdej zmiennej

6. **Zredeploy aplikację**:
   - Możesz to zrobić przez:
     - **Opcja A**: Push do branch `master` (automatyczny deployment przez GitHub Actions)
     - **Opcja B**: W Cloudflare Dashboard → "Deployments" → "Retry deployment"

### Krok 2: Znajdowanie wartości Supabase

Jeśli nie masz zapisanych wartości Supabase:

1. **Zaloguj się do Supabase Dashboard**: https://supabase.com/dashboard

2. **Wybierz swój projekt**

3. **Przejdź do Settings → API**:
   - **Project URL**: To jest wartość dla `SUPABASE_URL`
   - **Project API keys → anon public**: To jest wartość dla `SUPABASE_KEY`

### Krok 3: Weryfikacja

Po skonfigurowaniu zmiennych i redeploymencie:

1. **Otwórz swoją stronę logowania** (https://my.coinect.pl/login)

2. **Otwórz konsole przeglądarki** (F12 → Console)

3. **Sprawdź logi**:
   - Powinien pojawić się log: `[Supabase Browser] Environment check:`
   - Sprawdź czy `url` i `key` mają wartości ✅ SET

4. **Przetestuj logowanie**:
   - Wpisz prawidłowe dane logowania
   - Kliknij "Zaloguj się"
   - Jeśli wszystko działa poprawnie, zostaniesz przekierowany do `/dashboard`

### Krok 4: Debugging (jeśli nadal nie działa)

Jeśli problem nadal występuje, sprawdź:

1. **GitHub Actions workflow log**:
   - Przejdź do: https://github.com/[twoje-repo]/actions
   - Kliknij na ostatni workflow run
   - Sprawdź krok "Verify environment variables in build"
   - Powinien pokazać ✅ że znalazł URL i klucz Supabase w buildzie

2. **Konsola przeglądarki**:
   - Otwórz F12 → Console
   - Sprawdź czy widzisz `[Supabase Browser] Environment check:`
   - Jeśli widzisz ❌ MISSING - znaczy że zmienne nie zostały wstrzyknięte podczas buildu

3. **Network tab**:
   - Otwórz F12 → Network
   - Spróbuj się zalogować
   - Sprawdź czy request do `/api/auth/login` się wykonuje
   - Sprawdź response - powinien zwrócić odpowiedni kod błędu lub sukces

## Zmiany w projekcie (już wykonane)

Następujące zmiany zostały już zastosowane w projekcie:

### 1. GitHub Actions Workflow (`.github/workflows/master.yml`)
- ✅ Dodano krok weryfikacji zmiennych środowiskowych po buildzie
- ✅ Zmienne `PUBLIC_SUPABASE_URL` i `PUBLIC_SUPABASE_KEY` są ustawione podczas buildu

### 2. Astro Config (`astro.config.mjs`)
- ✅ Dodano `vite.define` do wymuszenia wstrzykiwania zmiennych do kodu klienckiego
- ✅ Zapewnia, że zmienne są dostępne w przeglądarce

### 3. Supabase Browser Client (`src/db/supabase.browser.ts`)
- ✅ Dodano sprawdzanie czy zmienne są ustawione
- ✅ Lepsze error handling z informacyjnymi komunikatami
- ✅ Rzuca błąd jeśli zmienne nie są dostępne (łatwiejsze debugowanie)

## Dlaczego to się dzieje?

### Build-time vs Runtime

- **Build-time** (GitHub Actions):
  - Zmienne są wstrzykiwane do kodu JavaScript podczas kompilacji
  - Kod kliencki (przeglądarka) otrzymuje zmienne jako stałe wartości w JS

- **Runtime** (Cloudflare Workers):
  - Kod serwerowy (API endpoints) działa na Cloudflare Workers
  - Potrzebuje dostępu do zmiennych środowiskowych w runtime
  - Te zmienne MUSZĄ być skonfigurowane w Cloudflare Pages Dashboard

### Czemu to nie działa automatycznie?

Cloudflare Pages nie dziedziczy zmiennych środowiskowych z GitHub Actions. Zmienne ustawione w workflow są używane tylko podczas buildu. Runtime (Cloudflare Workers) wymaga osobnej konfiguracji.

## Kontakt

Jeśli nadal masz problemy:
1. Sprawdź logi w GitHub Actions
2. Sprawdź konsole przeglądarki
3. Upewnij się, że zmienne w Cloudflare Pages są poprawnie ustawione
4. Sprawdź czy Supabase URL i Key są prawidłowe

---

**Ostatnia aktualizacja**: 2025-10-31
