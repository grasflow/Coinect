# Debugowanie CI/CD Pipeline

## 🔍 Szybka diagnostyka

### Sprawdź status pipeline

```bash
# Otwórz w przeglądarce
open https://github.com/{OWNER}/{REPO}/actions
```

### Sprawdź logi ostatniego run'a

```bash
# Używając GitHub CLI
gh run list --limit 5
gh run view <run-id> --log
```

## 🧪 Testowanie lokalne (symulacja CI)

### 1. Pełna symulacja pipeline

```bash
# Ustaw zmienne środowiskowe CI
export CI=true

# Uruchom wszystkie kroki
npm ci                  # ~30s
npm run lint            # ~10s
npm run test:run        # ~30s
npm run test:e2e        # ~3min
npm run build           # ~1min

# Wyczyść
unset CI
```

### 2. Testuj z variables Supabase

```bash
# Utwórz plik .env.ci (nie commituj!)
cat > .env.ci << EOF
SUPABASE_URL=your_url
SUPABASE_ANON_KEY=your_key
SUPABASE_SERVICE_ROLE_KEY=your_service_key
TEST_USER_EMAIL=test@test.com
TEST_USER_PASSWORD=Test123456
EOF

# Załaduj zmienne
source .env.ci

# Uruchom testy E2E
npm run test:e2e

# Wyczyść
rm .env.ci
```

### 3. Testuj tylko część pipeline

```bash
# Tylko lint
npm run lint

# Tylko unit tests
npm run test:run

# Tylko E2E (wymaga Supabase env vars)
npm run test:e2e

# Tylko build
npm run build
```

## 🐛 Najczęstsze problemy

### Problem: "Secrets not found"

```bash
# Sprawdź czy secrets są skonfigurowane
# GitHub → Settings → Secrets and variables → Actions

# Lista wymaganych:
# - SUPABASE_URL
# - SUPABASE_ANON_KEY
# - SUPABASE_SERVICE_ROLE_KEY
# - TEST_USER_EMAIL
# - TEST_USER_PASSWORD
```

**Rozwiązanie:**

1. Dodaj brakujące secrets w GitHub
2. Sprawdź czy nie ma literówek w nazwach
3. Zobacz SETUP.md sekcja 1

---

### Problem: "Timeout podczas E2E testów"

```bash
# Logi pokażą coś typu:
# "Timeout 90000ms exceeded"
```

**Rozwiązanie:**

1. Sprawdź czy Supabase jest dostępny
2. Zwiększ timeout w `playwright.config.ts`:
   ```typescript
   timeout: 120000, // 120s zamiast 90s
   ```
3. Sprawdź logi Supabase w dashboard

---

### Problem: "Node version mismatch"

```bash
# Pipeline używa wersji z .nvmrc
cat .nvmrc  # Powinna być 22.14.0
```

**Rozwiązanie:**
Nie zmieniaj ręcznie wersji w workflow - zmień `.nvmrc`:

```bash
echo "22.14.0" > .nvmrc
```

---

### Problem: "npm ci failed"

```bash
# Zazwyczaj package-lock.json jest out of sync
```

**Rozwiązanie:**

```bash
rm -rf node_modules package-lock.json
npm install
git add package-lock.json
git commit -m "chore: update package-lock.json"
```

---

### Problem: "Build artifacts nie są tworzone"

```bash
# Sprawdź czy dist/ jest w .gitignore
grep "dist" .gitignore

# Sprawdź czy build się udał
npm run build
ls -la dist/
```

**Rozwiązanie:**

1. `dist/` **powinien** być w .gitignore (nie commitujemy buildu)
2. Artifacts są uploadowane przez GitHub Actions (action upload-artifact)
3. Pobierz z Actions → workflow run → Artifacts section

---

### Problem: "Coverage threshold not met"

```bash
# Vitest wymaga 70% coverage
# Logi pokażą które pliki nie mają wystarczającego pokrycia
```

**Rozwiązanie:**

```bash
# Lokalnie sprawdź coverage
npm run test:coverage

# Otwórz raport HTML
open coverage/index.html

# Dodaj testy dla plików z niskim pokryciem
```

---

### Problem: "E2E user creation failed"

```bash
# global-setup.ts nie może utworzyć użytkownika testowego
```

**Rozwiązanie:**

1. Sprawdź `SUPABASE_SERVICE_ROLE_KEY` - czy jest poprawny?
2. Sprawdź czy Supabase jest online
3. Sprawdź czy user już istnieje (to OK, setup radzi sobie z tym)

**Debug lokalnie:**

```bash
# Uruchom script manualnie
npx ts-node scripts/check-and-create-test-user.ts
```

---

## 📊 Monitoring i logi

### Zobacz pełne logi joba

```bash
# GitHub CLI
gh run view <run-id> --log

# Lub w przeglądarce:
# Actions → wybierz run → kliknij job → rozwiń steps
```

### Pobierz artifacts lokalnie

```bash
# GitHub CLI
gh run download <run-id>

# Lub w przeglądarce:
# Actions → wybierz run → scroll w dół → Artifacts
```

### Sprawdź coverage raport

```bash
# Po pobraniu artifacts
cd coverage-report
open index.html
```

### Sprawdź Playwright raport

```bash
# Po pobraniu artifacts
cd playwright-report
npx playwright show-report .
```

---

## 🔧 Advanced debugging

### Re-run failed jobs

```bash
# GitHub CLI
gh run rerun <run-id> --failed

# Lub w przeglądarce:
# Actions → wybierz run → Re-run failed jobs
```

### Debug E2E w headed mode (lokalnie)

```bash
# Uruchom testy z widoczną przeglądarką
npm run test:e2e:headed

# Lub z debuggerem
npm run test:e2e:debug
```

### Sprawdź czy actions są deprecated

```bash
# Dla każdej używanej action sprawdź:
curl -s https://api.github.com/repos/actions/checkout | grep '"archived":'
curl -s https://api.github.com/repos/actions/setup-node | grep '"archived":'
curl -s https://api.github.com/repos/actions/upload-artifact | grep '"archived":'
```

### Testuj workflow syntax

```bash
# Zainstaluj act (local GitHub Actions runner)
brew install act

# Uruchom workflow lokalnie
act push -W .github/workflows/ci.yml

# Uwaga: act ma ograniczenia, nie wszystko zadziała identycznie
```

---

## 📝 Dobre praktyki debugowania

### 1. Zawsze najpierw testuj lokalnie

```bash
npm run lint
npm run test:all
npm run build
```

### 2. Używaj --verbose dla więcej logów

```bash
# Vitest
npm run test:run -- --reporter=verbose

# Playwright
npm run test:e2e -- --reporter=list
```

### 3. Sprawdź diff przed push

```bash
git diff origin/master
```

### 4. Używaj draft PR do testowania

```bash
# Jeśli chcesz testować bez merge
gh pr create --draft --title "test: CI pipeline"
```

---

## 🆘 Pomoc

Jeśli problem nie został rozwiązany:

1. **Sprawdź logi** - GitHub Actions → wybierz run → logi każdego stepu
2. **Sprawdź lokalne testy** - czy przechodzą lokalnie?
3. **Sprawdź SETUP.md** - sekcja Troubleshooting
4. **Sprawdź CHECKLIST.md** - czy wszystko skonfigurowane?
5. **Sprawdź GitHub Discussions** - może ktoś miał podobny problem

---

**Last updated:** 2025-10-29
