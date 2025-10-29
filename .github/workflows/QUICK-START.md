# ⚡ Quick Start - CI/CD Pipeline

**Czas setup: ~10 minut**

## 🎯 Cel

Skonfigurować i uruchomić automatyczne testowanie i budowanie projektu przy każdym push do `master`.

## ✅ 3 kroki do uruchomienia

### Krok 1: Dodaj sekrety w GitHub (5 min)

1. Idź do swojego repo na GitHubie
2. **Settings** → **Secrets and variables** → **Actions**
3. Kliknij **New repository secret**
4. Dodaj **5 sekretów**:

| Nazwa                       | Gdzie znaleźć                                      | Przykład                  |
| --------------------------- | -------------------------------------------------- | ------------------------- |
| `SUPABASE_URL`              | Supabase Dashboard → Settings → API                | `https://xxx.supabase.co` |
| `SUPABASE_ANON_KEY`         | Supabase Dashboard → Settings → API → anon/public  | `eyJhbGc...`              |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase Dashboard → Settings → API → service_role | `eyJhbGc...`              |
| `TEST_USER_EMAIL`           | Wymyśl email testowy                               | `test@test.com`           |
| `TEST_USER_PASSWORD`        | Wymyśl hasło (min 8 znaków)                        | `Test123456`              |

⚠️ **UWAGA**: `SUPABASE_SERVICE_ROLE_KEY` to wrażliwy klucz - **NIGDY** nie commituj go do repo!

---

### Krok 2: Sprawdź czy testy działają lokalnie (3 min)

```bash
# Sprawdź wszystko lokalnie przed uruchomieniem w CI
npm run lint          # Powinno przejść bez błędów
npm run test:run      # Wszystkie testy jednostkowe
npm run build         # Build produkcyjny

# Opcjonalnie (wymaga konfiguracji Supabase lokalnie):
npm run test:e2e      # Testy E2E
```

Jeśli wszystko przechodzi ✅ → idziesz do kroku 3!

Jeśli coś failuje ❌ → napraw lokalnie przed uruchomieniem CI.

---

### Krok 3: Uruchom pipeline (2 min)

**Opcja A: Automatyczne (push do master)**

```bash
git add .
git commit -m "feat: add CI/CD pipeline"
git push origin master
```

**Opcja B: Manualne**

1. GitHub → zakładka **Actions**
2. Wybierz **CI Pipeline**
3. **Run workflow** → wybierz branch `master` → **Run workflow**

---

## 📊 Co się dzieje w pipeline?

```
Push → Lint (1 min) → Unit Tests (2 min) + E2E Tests (3-5 min) → Build (2 min)
                ↓                    ↓              ↓                    ↓
              Pass                 Pass          Pass               ✅ SUCCESS
```

**Całość:** ~8-10 minut

---

## 🎉 Gotowe!

Pipeline teraz uruchamia się automatycznie przy każdym push do `master`.

### Sprawdź status:

- GitHub → **Actions** → Zobacz running/completed workflows
- Zielony ✅ = wszystko OK
- Czerwony ❌ = coś nie działa (sprawdź logi)

### Pobierz artefakty:

- **coverage-report** - raport pokrycia kodu testami
- **playwright-report** - raport testów E2E
- **dist** - gotowy build produkcyjny

---

## 🚨 Problemy?

### "Secrets not found"

→ Wróć do Kroku 1, sprawdź czy wszystkie 5 sekretów jest dodanych

### "Tests fail in CI but pass locally"

→ Sprawdź [DEBUG.md](./DEBUG.md)

### "Timeout during E2E tests"

→ Sprawdź czy Supabase URL i klucze są poprawne

### Inne problemy

→ Zobacz [DEBUG.md](./DEBUG.md) dla pełnego troubleshootingu

---

## 📚 Więcej info?

- **[INDEX.md](./INDEX.md)** - pełny index wszystkich dokumentów
- **[SETUP.md](./SETUP.md)** - szczegółowa instrukcja setup
- **[DEBUG.md](./DEBUG.md)** - debugowanie i troubleshooting
- **[ARCHITECTURE.md](./ARCHITECTURE.md)** - jak działa pipeline

---

## ⚙️ Zaawansowane

### Dodaj badge do README

```markdown
[![CI Pipeline](https://github.com/{OWNER}/{REPO}/actions/workflows/ci.yml/badge.svg)](https://github.com/{OWNER}/{REPO}/actions/workflows/ci.yml)
```

Zobacz [STATUS-BADGE.md](./STATUS-BADGE.md)

### Usuń stary test.yml

```bash
git rm .github/workflows/test.yml
git commit -m "chore: remove old test workflow"
```

Zobacz [MIGRATION.md](./MIGRATION.md)

---

**Czas na kawę ☕ - pipeline pracuje za Ciebie!**
