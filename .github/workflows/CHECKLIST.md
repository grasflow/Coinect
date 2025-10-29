# Checklist przed uruchomieniem CI/CD

## ✅ Pre-deployment Checklist

### 1. GitHub Secrets

- [ ] `SUPABASE_URL` skonfigurowany
- [ ] `SUPABASE_ANON_KEY` skonfigurowany
- [ ] `SUPABASE_SERVICE_ROLE_KEY` skonfigurowany
- [ ] `TEST_USER_EMAIL` skonfigurowany (np. test@test.com)
- [ ] `TEST_USER_PASSWORD` skonfigurowany (min. 8 znaków)

### 2. Testy lokalne

- [ ] `npm run lint` - przechodzi bez błędów
- [ ] `npm run test:run` - wszystkie testy jednostkowe działają
- [ ] `npm run test:e2e` - testy E2E działają lokalnie
- [ ] `npm run build` - build produkcyjny działa

### 3. Konfiguracja projektu

- [ ] Plik `.nvmrc` istnieje (Node 22.14.0)
- [ ] `package.json` zawiera wszystkie wymagane skrypty
- [ ] `playwright.config.ts` jest poprawnie skonfigurowany
- [ ] `vitest.config.ts` jest poprawnie skonfigurowany

### 4. Supabase

- [ ] Projekt Supabase jest aktywny
- [ ] Migracje są zaktualizowane
- [ ] Service role key ma odpowiednie uprawnienia
- [ ] Test user może być utworzony (lub już istnieje)

### 5. Repository

- [ ] Branch `master` istnieje
- [ ] Workflow file jest w `.github/workflows/ci.yml`
- [ ] `.gitignore` nie ignoruje wymaganych plików

## 🚀 Pierwsze uruchomienie

### Opcja A: Automatyczne (push do master)

```bash
git add .
git commit -m "feat: add CI/CD pipeline"
git push origin master
```

### Opcja B: Manualne

1. Idź do Actions w GitHub
2. Wybierz "CI Pipeline"
3. Kliknij "Run workflow"
4. Wybierz branch `master`
5. Kliknij "Run workflow"

## 📊 Po uruchomieniu

### Sprawdź:

- [ ] Wszystkie joby się uruchomiły
- [ ] Lint przeszedł
- [ ] Unit tests przeszły
- [ ] E2E tests przeszły
- [ ] Build zakończył się sukcesem
- [ ] Artifacts zostały wygenerowane

### W przypadku błędów:

1. Sprawdź logi w zakładce Actions
2. Sprawdź czy wszystkie secrets są poprawne
3. Sprawdź czy testy przechodzą lokalnie
4. Sprawdź SETUP.md dla szczegółów troubleshootingu

## 🔧 Testowanie pipeline lokalnie

### Symulacja environment CI:

```bash
export CI=true
npm run lint
npm run test:run
npm run test:e2e
npm run build
```

### Test z używaniem secrets lokalnie:

Utwórz plik `.env.test` (nie commituj go!):

```bash
SUPABASE_URL=https://twoj-projekt.supabase.co
SUPABASE_ANON_KEY=twoj-anon-key
SUPABASE_SERVICE_ROLE_KEY=twoj-service-key
TEST_USER_EMAIL=test@test.com
TEST_USER_PASSWORD=Test123456
```

Następnie:

```bash
source .env.test
npm run test:e2e
```

## 📝 Notatki

### Typowe problemy:

1. **E2E timeout** - zwiększ timeouty w `playwright.config.ts`
2. **Service key błędny** - zweryfikuj w Supabase Dashboard
3. **User już istnieje** - to normalne, global-setup radzi sobie z tym
4. **Build fails** - sprawdź zmienne środowiskowe w job build

### Performance:

- Pierwszy run: ~10-12 min (instalacja dependencies)
- Kolejne runy: ~8-10 min (cache dependencies)
