# Konfiguracja GitHub Secrets - WAŻNE!

## ⚠️ Problem
Deployment idzie przez **GitHub Actions** → **Cloudflare Pages**, więc zmienne środowiskowe muszą być w **GitHub Secrets**, NIE na Cloudflare Pages!

## 📍 Gdzie ustawić zmienne?

**✅ TUTAJ:** GitHub Repository Secrets
**❌ NIE TUTAJ:** Cloudflare Pages Environment Variables (nie są używane!)

---

## Instrukcja krok po kroku

### 1. Otwórz swoje repozytorium na GitHub

```
https://github.com/[TWOJA-NAZWA]/Coinect
```

### 2. Przejdź do Settings

1. Kliknij **"Settings"** w górnym menu repo
2. Z menu po lewej wybierz **"Secrets and variables"** → **"Actions"**

### 3. Dodaj następujące Secrets

Kliknij **"New repository secret"** i dodaj:

#### Secret 1: SUPABASE_URL
- **Name**: `SUPABASE_URL`
- **Secret**: `https://lmijmesmitafugoukznb.supabase.co`
- Kliknij **"Add secret"**

#### Secret 2: SUPABASE_KEY
- **Name**: `SUPABASE_KEY`
- **Secret**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0`
- Kliknij **"Add secret"**

#### Secret 3: CLOUDFLARE_API_TOKEN
Jeśli jeszcze nie masz:
- **Name**: `CLOUDFLARE_API_TOKEN`
- **Secret**: [Twój Cloudflare API Token]
- Kliknij **"Add secret"**

**Jak uzyskać Cloudflare API Token:**
1. Otwórz https://dash.cloudflare.com/profile/api-tokens
2. Kliknij **"Create Token"**
3. Wybierz szablon **"Edit Cloudflare Workers"**
4. Skopiuj token (pokażą go tylko raz!)

#### Secret 4: CLOUDFLARE_ACCOUNT_ID
- **Name**: `CLOUDFLARE_ACCOUNT_ID`
- **Secret**: [Twoje Account ID]

**Jak znaleźć Account ID:**
1. Otwórz https://dash.cloudflare.com
2. Po prawej stronie zobacz **"Account ID"**
3. Skopiuj

#### Secret 5: CLOUDFLARE_PROJECT_NAME
- **Name**: `CLOUDFLARE_PROJECT_NAME`
- **Secret**: `coinect` (lub jak nazwałeś projekt na Cloudflare Pages)

---

### 4. Sprawdź czy wszystkie sekrety są ustawione

Powinieneś widzieć w **Actions secrets**:

```
Repository secrets (5)
├─ SUPABASE_URL
├─ SUPABASE_KEY
├─ CLOUDFLARE_API_TOKEN
├─ CLOUDFLARE_ACCOUNT_ID
└─ CLOUDFLARE_PROJECT_NAME
```

---

### 5. Uruchom nowy deployment

**Opcja A: Push do mastera**
```bash
git commit --allow-empty -m "Trigger deployment with new secrets"
git push origin master
```

**Opcja B: Manual trigger**
1. Przejdź do zakładki **"Actions"** na GitHubie
2. Wybierz workflow **"Deploy to Cloudflare Pages"**
3. Kliknij **"Run workflow"** → **"Run workflow"**

---

### 6. Sprawdź deployment

1. Przejdź do **"Actions"** na GitHubie
2. Kliknij na najnowszy workflow run
3. Sprawdź czy wszystkie kroki przeszły ✅
4. W kroku **"Verify environment variables in build"** powinieneś zobaczyć:
   ```
   ✅ Znaleziono URL Supabase w buildzie
   ✅ Znaleziono klucz Supabase w buildzie
   ```

---

### 7. Testuj produkcję

Po deploymencie (2-3 minuty):

1. Otwórz https://my.coinect.pl **w incognito**
2. Przejdź do `/register`
3. Załóż nowe konto
4. **Powinno działać!** ✅

---

## Dlaczego GitHub Secrets, a nie Cloudflare?

Twój workflow robi:
```
GitHub Actions BUILD → Cloudflare Pages DEPLOY
```

Zmienne są potrzebne **podczas buildu** (na GitHubie), nie podczas deploy (na Cloudflare).

Workflow używa `${{ secrets.SUPABASE_URL }}` z GitHub Secrets podczas `npm run build`.

---

## Troubleshooting

### ❌ Workflow fails na kroku "Build production"
- Sprawdź czy `SUPABASE_URL` i `SUPABASE_KEY` są ustawione w GitHub Secrets
- Sprawdź czy nazwy są dokładnie takie (case-sensitive!)

### ⚠️ "Nie znaleziono URL Supabase w buildzie"
- Sekrety mogą być puste
- Sprawdź czy skopiowałeś pełny URL/key bez spacji

### ❌ Workflow fails na kroku "Deploy to Cloudflare Pages"
- Sprawdź `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`, `CLOUDFLARE_PROJECT_NAME`
- Sprawdź czy token ma odpowiednie uprawnienia

### 🔄 Nadal nie mogę się zalogować
- Wyczyść cache przeglądarki (Cmd+Shift+R)
- Sprawdź Console (F12) - powinno być `https://lmijmesmitafugoukznb.supabase.co`
- Sprawdź czy deployment się powiódł (zielony ✅ w Actions)

---

## Bezpieczeństwo

✅ GitHub Secrets są szyfrowane i bezpieczne
✅ Nie będą widoczne w logach
✅ Tylko ty i GitHub Actions mają dostęp

⚠️ Klucze Supabase w tym dokumencie to klucze **demo** - bezpieczne do użycia publicznego
