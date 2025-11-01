# Deployment Guide - Cloudflare Pages

## Przegląd

Aplikacja Coinect jest wdrażana na Cloudflare Pages i używa Supabase jako backendu.

## Środowiska

### Local Development
- **Supabase**: Lokalny (Docker) - `http://127.0.0.1:54321`
- **Config**: `.env` file
- **Start**: `npx supabase start && npm run dev`

### Production
- **Supabase**: Cloud - `https://lmijmesmitafugoukznb.supabase.co`
- **Config**: Cloudflare Pages Environment Variables
- **Deployment**: Automatic via Git push

## Konfiguracja Production na Cloudflare Pages

### 1. Przejdź do Cloudflare Dashboard

1. Otwórz [Cloudflare Dashboard](https://dash.cloudflare.com)
2. Wybierz **Pages** z menu po lewej
3. Wybierz projekt **coinect**
4. Przejdź do **Settings** → **Environment variables**


### 3. Jak dodać zmienną:

1. Kliknij **"Add variable"**
2. Wpisz nazwę zmiennej (np. `SUPABASE_URL`)
3. Wpisz wartość
4. Wybierz **Production** environment
5. Kliknij **"Save"**
6. Powtórz dla każdej zmiennej

### 4. Redeploy

Po dodaniu wszystkich zmiennych:
1. Przejdź do **Deployments**
2. Kliknij **"Retry deployment"** na ostatnim deploymencie
3. Lub zrób `git push` żeby uruchomić nowy deployment

## Weryfikacja

Po deploymencie sprawdź:

1. Otwórz `https://my.coinect.pl`
2. Spróbuj się zarejestrować z nowym emailem
3. Sprawdź czy użytkownik pojawia się w Supabase Dashboard
4. Spróbuj się zalogować

## Pobieranie prawidłowych kluczy Supabase

Jeśli potrzebujesz pobrać klucze z Supabase:

1. Otwórz [Supabase Dashboard](https://supabase.com/dashboard)
2. Wybierz projekt **Coinect**
3. Przejdź do **Settings** → **API**
4. Skopiuj:
   - **Project URL** → to jest twój `SUPABASE_URL`
   - **anon/public key** → to jest twój `SUPABASE_KEY`

## Build Command

Cloudflare Pages powinien używać:
- **Build command**: `npm run build`
- **Build output directory**: `dist`
- **Root directory**: `/`

## Troubleshooting

### Problem: "Missing SUPABASE_URL environment variable"
- Upewnij się, że zmienne są ustawione dla środowiska **Production**
- Redeploy aplikację po dodaniu zmiennych

### Problem: "Invalid login credentials"
- Sprawdź czy użytkownik istnieje w produkcyjnej bazie Supabase
- Lokalny Supabase i produkcyjny to osobne bazy danych

### Problem: Zmiany nie są widoczne
- Wyczyść cache przeglądarki
- Sprawdź czy deployment się powiódł w Cloudflare Dashboard
- Sprawdź logi deploymentu

## Migracje bazy danych

Żeby zsynchronizować schemat lokalnej bazy z produkcyjną:

```bash
# 1. Link to production
npx supabase link --project-ref lmijmesmitafugoukznb

# 2. Push migrations
npx supabase db push

# lub pull schema from production
npx supabase db pull
```

## Kontakt

W razie problemów sprawdź:
- Logi w Cloudflare Pages Dashboard
- Logi w Supabase Dashboard
- Browser console dla błędów klienta
