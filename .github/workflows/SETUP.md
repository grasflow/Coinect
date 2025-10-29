# Instrukcja konfiguracji CI/CD

## 1. Konfiguracja GitHub Secrets

Przejdź do Settings → Secrets and variables → Actions w swoim repozytorium GitHub i dodaj następujące sekrety:

```
SUPABASE_URL=https://twoj-projekt.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
TEST_USER_EMAIL=test@test.com
TEST_USER_PASSWORD=Test123456
```

> ⚠️ **UWAGA**: `SUPABASE_SERVICE_ROLE_KEY` to wrażliwy klucz z pełnymi uprawnieniami.
> Znajdziesz go w Supabase Dashboard → Settings → API → service_role key.
> **Nigdy nie commituj go do repozytorium!**

## 2. Uruchomienie pipeline

### Automatyczne uruchomienie

Pipeline uruchomi się automatycznie przy każdym push do brancha `master`.

### Ręczne uruchomienie

1. Przejdź do zakładki "Actions" w repozytorium
2. Wybierz workflow "CI Pipeline"
3. Kliknij "Run workflow"
4. Wybierz branch (domyślnie master)
5. Kliknij "Run workflow"

## 3. Monitorowanie pipeline

### Status jobów

- ✅ Zielony - sukces
- ❌ Czerwony - błąd
- 🟡 Żółty - w trakcie

### Artefakty

Po zakończeniu pipeline możesz pobrać:

- `coverage-report` - raport pokrycia testami jednostkowymi
- `playwright-report` - raport testów E2E
- `dist` - build produkcyjny (tylko gdy wszystkie testy przejdą)

## 4. Struktura pipeline

```
master push / manual trigger
        ↓
    [Lint]
        ↓
    ┌───┴───┐
    │       │
[Unit]  [E2E]
    │       │
    └───┬───┘
        ↓
    [Build]
```

### Czas wykonania (przybliżony)

- Lint: ~1 min
- Unit Tests: ~2 min
- E2E Tests: ~3-5 min
- Build: ~2 min
- **Całość: ~8-10 min**

## 5. Troubleshooting

### Problem: E2E testy failują

- Sprawdź czy sekrety Supabase są poprawne
- Sprawdź czy TEST_USER_EMAIL i TEST_USER_PASSWORD są ustawione
- Sprawdź logi w zakładce Actions

### Problem: Build failuje

- Sprawdź logi buildu
- Upewnij się że kod przechodzi wszystkie testy lokalnie
- Sprawdź czy wszystkie dependencje są w package.json

### Problem: Timeout

- E2E testy mają timeout 90s na test
- Jeśli Supabase jest wolny, zwiększ timeout w playwright.config.ts
