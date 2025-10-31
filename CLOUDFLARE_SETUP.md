# Konfiguracja Cloudflare Pages - Krok po kroku

## Problem
Nie możesz się zalogować ani założyć konta na produkcji (my.coinect.pl).

## Rozwiązanie
Musisz ustawić zmienne środowiskowe na Cloudflare Pages.

## Instrukcja krok po kroku

### 1. Otwórz Cloudflare Dashboard
```
https://dash.cloudflare.com
```

### 2. Przejdź do swojego projektu
1. Kliknij **"Pages"** w menu po lewej
2. Znajdź i kliknij projekt **"coinect"** (lub jak go nazwałeś)

### 3. Otwórz ustawienia Environment Variables
1. Kliknij zakładkę **"Settings"**
2. Z menu po lewej wybierz **"Environment variables"**

### 4. Dodaj zmienne dla Production

Kliknij **"Add variable"** i dodaj następujące zmienne **JEDNA PO DRUGIEJ**:

#### Zmienna 1:
- **Variable name**: `SUPABASE_URL`
- **Value**: `https://lmijmesmitafugoukznb.supabase.co`
- **Environment**: Production ✅ (zaznacz checkbox)
- Kliknij **"Save"**

#### Zmienna 2:
- **Variable name**: `SUPABASE_KEY`
- **Value**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0`
- **Environment**: Production ✅
- Kliknij **"Save"**

#### Zmienna 3:
- **Variable name**: `PUBLIC_SUPABASE_URL`
- **Value**: `https://lmijmesmitafugoukznb.supabase.co`
- **Environment**: Production ✅
- Kliknij **"Save"**

#### Zmienna 4:
- **Variable name**: `PUBLIC_SUPABASE_KEY`
- **Value**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0`
- **Environment**: Production ✅
- Kliknij **"Save"**

#### Zmienna 5:
- **Variable name**: `PUBLIC_ENV_NAME`
- **Value**: `production`
- **Environment**: Production ✅
- Kliknij **"Save"**

#### Zmienna 6:
- **Variable name**: `OPENROUTER_API_KEY`
- **Value**: `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`
- **Environment**: Production ✅
- Kliknij **"Save"**

### 5. Redeploy aplikacji

Po dodaniu wszystkich zmiennych:

1. Przejdź do zakładki **"Deployments"**
2. Znajdź ostatni deployment
3. Kliknij **menu (三)** po prawej stronie
4. Wybierz **"Retry deployment"**

ALBO po prostu zrób:
```bash
git push
```

### 6. Sprawdź czy działa

Po deploymencie (trwa ~2-3 minuty):

1. Otwórz https://my.coinect.pl w **nowej karcie incognito**
2. Przejdź do `/register`
3. Spróbuj założyć nowe konto
4. Powinno zadziałać! ✅

## Jak sprawdzić czy zmienne są ustawione?

W zakładce **"Environment variables"** powinieneś widzieć:

```
Production environment (6 variables)
├─ SUPABASE_URL
├─ SUPABASE_KEY
├─ PUBLIC_SUPABASE_URL
├─ PUBLIC_SUPABASE_KEY
├─ PUBLIC_ENV_NAME
└─ OPENROUTER_API_KEY
```

## Troubleshooting

### Problem: Nadal nie mogę się zalogować
1. Sprawdź czy deployment się zakończył (zielony ✓)
2. Wyczyść cache przeglądarki (Cmd+Shift+R lub Ctrl+Shift+R)
3. Otwórz w incognito
4. Sprawdź Console w DevTools (F12) - szukaj błędów

### Problem: "Missing SUPABASE_URL"
- Sprawdź czy zmienne są ustawione dla **Production** (nie Preview)
- Zrób retry deployment

### Problem: Nie widzę projektu "coinect" na Cloudflare
- Sprawdź czy jesteś w odpowiednim koncie Cloudflare
- Sprawdź czy projekt jest połączony z Git

## Bezpieczeństwo

⚠️ **WAŻNE**:
- Klucze Supabase w tym dokumencie to klucze **demo** - są bezpieczne do użycia
- Jeśli używasz prawdziwych kluczy produkcyjnych, **NIGDY** ich nie commituj do Git
- `.env` i inne pliki z kluczami są w `.gitignore`
