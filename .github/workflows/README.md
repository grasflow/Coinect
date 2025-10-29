# CI/CD Setup

## Wymagane GitHub Secrets

Aby pipeline CI/CD działał poprawnie, należy skonfigurować następujące sekrety w ustawieniach repozytorium GitHub (Settings → Secrets and variables → Actions):

### Supabase

- `SUPABASE_URL` - URL do projektu Supabase
- `SUPABASE_ANON_KEY` - Publiczny klucz API Supabase
- `SUPABASE_SERVICE_ROLE_KEY` - Service role key (wymagany do tworzenia użytkowników testowych)

### Testy E2E

- `TEST_USER_EMAIL` - Email użytkownika testowego (np. test@test.com)
- `TEST_USER_PASSWORD` - Hasło użytkownika testowego (min. 8 znaków)

## Workflow: CI Pipeline

### Trigger

- Push do brancha `master`
- Ręczne uruchomienie (workflow_dispatch)

### Jobs

#### 1. Lint

- ESLint sprawdzanie kodu
- Blokuje dalsze joby w przypadku błędów

#### 2. Unit Tests (równolegle z E2E po lincie)

- Testy jednostkowe (Vitest)
- Upload raportu coverage

#### 3. E2E Tests (równolegle z Unit po lincie)

- Testy end-to-end (Playwright)
- Tylko Chrome dla szybkości
- Upload raportu Playwright

#### 4. Build

- Build produkcyjny Astro
- Uruchamia się tylko gdy testy przejdą
- Upload artifacts (dist/)

### Node.js

Pipeline używa wersji Node.js z pliku `.nvmrc` (obecnie 22.14.0)

## Funkcje bezpieczeństwa i optymalizacji

### Concurrency Control

- Pipeline automatycznie anuluje poprzednie uruchomienia dla tego samego brancha
- Oszczędza czas i zasoby gdy pushujemy wiele commitów

### Timeouts

- Każdy job ma timeout zapobiegający nieskończonym hangom
- Lint: 5 min, Unit: 10 min, E2E: 20 min, Build: 10 min

### Permissions

- Minimalne wymagane uprawnienia (contents: read, actions: read)
- Zwiększa bezpieczeństwo pipeline

### Kompresja artifacts

- Artifacts są kompresowane (level 6)
- Zmniejsza zużycie storage o ~40-60%
