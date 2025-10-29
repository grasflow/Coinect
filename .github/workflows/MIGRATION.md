# Migracja z test.yml do ci.yml

## Obecna sytuacja

W projekcie istnieją dwa workflow'y:

- `test.yml` - stary workflow (branches: main, develop)
- `ci.yml` - nowy minimalny setup (branch: master)

## Różnice

### test.yml

- ❌ Używa Node.js 20 (projekt wymaga 22.14.0)
- ❌ Triggeruje się na `main` i `develop` (projekt używa `master`)
- ❌ Brak lintingu
- ❌ Brak buildu produkcyjnego
- ❌ E2E testy bez wymaganych zmiennych środowiskowych Supabase
- ❌ Używa starszych wersji actions (v4)
- ✅ Integracja z Codecov

### ci.yml (nowy)

- ✅ Używa Node.js z .nvmrc (22.14.0)
- ✅ Triggeruje się na `master`
- ✅ Zawiera linting
- ✅ Zawiera build produkcyjny
- ✅ E2E testy z pełną konfiguracją Supabase
- ✅ Najnowsze wersje actions (v5, v6)
- ✅ Optymalizacja: równoległe uruchamianie testów
- ❌ Brak integracji Codecov (można dodać)

## Zalecana akcja

### Opcja 1: Zastąp test.yml przez ci.yml

```bash
git rm .github/workflows/test.yml
git add .github/workflows/ci.yml
git commit -m "chore: migrate to new CI pipeline"
```

### Opcja 2: Zachowaj oba (niezalecane)

Jeśli chcesz zachować `test.yml` dla innych branchy (develop), zmień trigger w `ci.yml`:

```yaml
on:
  push:
    branches:
      - master
      - main # dodaj jeśli używasz main
  pull_request:
    branches:
      - master
  workflow_dispatch:
```

I w `test.yml` zmień na:

```yaml
on:
  push:
    branches: [develop]
  pull_request:
    branches: [develop]
```

### Opcja 3: Połącz oba workflow

Stwórz jeden kompletny workflow z Codecov:

```yaml
# W ci.yml dodaj po coverage upload:
- name: Upload coverage to Codecov
  uses: codecov/codecov-action@v5
  if: always()
  with:
    files: ./coverage/coverage-final.json
    flags: unittests
```

## Krok po kroku (zalecane)

1. **Usuń stary workflow:**

   ```bash
   git rm .github/workflows/test.yml
   ```

2. **Zweryfikuj ci.yml:**
   - Sprawdź czy wszystkie sekrety są skonfigurowane (SETUP.md)
   - Uruchom workflow manualnie
   - Zweryfikuj czy wszystkie testy przechodzą

3. **Opcjonalnie dodaj Codecov do ci.yml:**

   ```yaml
   - name: Upload coverage to Codecov
     uses: codecov/codecov-action@v5
     if: always()
     with:
       files: ./coverage/coverage-final.json
       token: ${{ secrets.CODECOV_TOKEN }}
   ```

4. **Commit zmian:**
   ```bash
   git add .github/workflows/
   git commit -m "chore: migrate to optimized CI pipeline"
   git push origin master
   ```

## Potencjalne problemy

### Branch naming

- Stary workflow: `main`, `develop`
- Nowy workflow: `master`
- **Rozwiązanie**: Zweryfikuj aktualny branch główny używając `git branch -a`

### Node version

- Stary workflow: Node 20
- Projekt: Node 22.14.0
- **Rozwiązanie**: ci.yml używa .nvmrc, automatycznie poprawna wersja

### Codecov token

Jeśli chcesz używać Codecov:

1. Zarejestruj się na codecov.io
2. Dodaj repo
3. Dodaj `CODECOV_TOKEN` do GitHub Secrets
4. Dodaj kroki uploadowania do ci.yml

## Podsumowanie

**Zalecenie:** Usuń `test.yml` i używaj tylko `ci.yml`.

Nowy workflow jest:

- ✅ Bardziej kompletny (lint + test + build)
- ✅ Szybszy (równoległe testy)
- ✅ Aktualny (najnowsze wersje tools i actions)
- ✅ Zgodny z projektem (Node 22, master branch)
