# 🚨 Podsumowanie problemu produkcyjnego - my.coinect.pl

**Data:** 31 października 2025
**Status:** NIE ROZWIĄZANE ❌

---

## Problem

**Nie można się zarejestrować ani zalogować na https://my.coinect.pl**

### Objawy:
- **Rejestracja:** Status 400, błąd `{"error":{"code":"SIGNUP_ERROR","message":"Nie udało się utworzyć konta"}}`
- **Logowanie:** Status 401, błąd `{"error":{"code":"INVALID_CREDENTIALS","message":"Nieprawidłowy email lub hasło"}}`
- Lokalna wersja (localhost) działa poprawnie ✅

---

## Co zostało sprawdzone i naprawione ✅

### 1. Lokalne środowisko
- ✅ Lokalne Supabase działa (Docker)
- ✅ `.env` używa `http://127.0.0.1:54321`
- ✅ Rejestracja i logowanie działa lokalnie
- ✅ Naprawiono `supabase.client.ts` (używa `PUBLIC_` zmiennych)

### 2. GitHub Secrets (CI/CD)
- ✅ **SUPABASE_URL** ustawione: `https://lmijmesmitafugoukznb.supabase.co`
- ✅ **SUPABASE_KEY** ustawione (JWT token)
- ✅ Są zarówno w **Repository secrets** jak i **Environment secrets (coinect Production)**

### 3. GitHub Actions Deployment
- ✅ Ostatni workflow: **Success** (zielony)
- ✅ Commit: "Fix production authentication..." (848b798)
- ✅ Czas: 3 godziny temu
- ✅ **Build verification pokazuje:**
  ```
  ✅ Znaleziono URL Supabase w buildzie
  ✅ Znaleziono klucz Supabase w buildzie (format JWT)
  📊 Liczba plików JS: 51
  📊 Rozmiar dist/: 6.6M
  ```

### 4. Produkcyjna baza danych
- ✅ Schema zsynchronizowana: `npx supabase db push --linked` - "Remote database is up to date"
- ✅ Wszystkie migracje aplikowane
- ✅ Triggery i tabele istnieją

### 5. Cloudflare Pages
- ✅ Zmienne środowiskowe ustawione (choć nie używane, bo deployment przez GitHub Actions)
- ✅ Deployment przez GitHub Actions + Wrangler

---

## Co NIE działa ❌

### 1. Brak loga Supabase w Console
Na `https://my.coinect.pl/register` w Console **NIE MA** loga:
```
[Supabase Browser] Environment check:
```

Ten log **POWINIEN** się pojawić przy ładowaniu strony (patrz: `src/db/supabase.browser.ts:18-21`).

### 2. API zwraca błędy
- `/api/auth/register` → 400 Bad Request → "SIGNUP_ERROR"
- `/api/auth/login` → 401 Unauthorized → "INVALID_CREDENTIALS"

### 3. Prawdopodobna przyczyna
**Cloudflare cache** - stara wersja buildu bez Supabase env vars jest cachowana i serwowana.

---

## Architektura deploymentu

```
Local Machine
    ↓ git push
GitHub Repository
    ↓ trigger
GitHub Actions (.github/workflows/master.yml)
    ↓ build with secrets
    ├─ SUPABASE_URL=${{ secrets.SUPABASE_URL }}
    ├─ SUPABASE_KEY=${{ secrets.SUPABASE_KEY }}
    ├─ PUBLIC_SUPABASE_URL=${{ secrets.SUPABASE_URL }}
    └─ PUBLIC_SUPABASE_KEY=${{ secrets.SUPABASE_KEY }}
    ↓ wrangler deploy
Cloudflare Pages (my.coinect.pl)
```

**Zmienne w Cloudflare Pages Dashboard NIE SĄ UŻYWANE** - deployment idzie przez GitHub Actions!

---

## Pliki kluczowe

### 1. GitHub Actions Workflow
**Plik:** `.github/workflows/master.yml:96-105`
```yaml
- name: Build production
  env:
    NODE_ENV: production
    SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
    SUPABASE_KEY: ${{ secrets.SUPABASE_KEY }}
    PUBLIC_SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
    PUBLIC_SUPABASE_KEY: ${{ secrets.SUPABASE_KEY }}
  run: npm run build
```

### 2. Supabase Browser Client
**Plik:** `src/db/supabase.browser.ts:5-6`
```typescript
const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL || import.meta.env.SUPABASE_URL;
const supabaseAnonKey = import.meta.env.PUBLIC_SUPABASE_KEY || import.meta.env.SUPABASE_KEY;
```

**Powinien logować (linia 18-21):**
```typescript
if (import.meta.env.DEV) {
  console.log("[Supabase Browser] Environment check:", envCheck);
}
```

### 3. Auth Service
**Plik:** `src/lib/services/auth.service.ts:55-75`
- Rejestracja wywołuje `supabase.auth.signUp()`
- Błąd "SIGNUP_ERROR" jest rzucany gdy Supabase zwraca błąd

---

## Następne kroki do debugowania

### 1. Sprawdź czy nowy build jest używany
W Console na `my.coinect.pl/register`:
```javascript
// Wklej to w Console:
console.log('PUBLIC_SUPABASE_URL:', import.meta.env.PUBLIC_SUPABASE_URL);
console.log('SUPABASE_URL:', import.meta.env.SUPABASE_URL);
```

**Oczekiwany output:**
```
PUBLIC_SUPABASE_URL: https://lmijmesmitafugoukznb.supabase.co
```

**Jeśli undefined** → stary build, cache problem

### 2. Sprawdź Supabase Auth Settings

Otwórz:
```
https://supabase.com/dashboard/project/lmijmesmitafugoukznb/settings/auth
```

Sprawdź:
- [ ] **Enable Email Signup** - czy włączone?
- [ ] **Confirm email** - czy włączone? (jeśli TAK, może blokować rejestrację)
- [ ] **Enable Email Confirmations** - sprawdź ustawienie
- [ ] **Email Provider (SMTP)** - czy skonfigurowany? (potrzebny jeśli confirm email = true)

### 3. Wymuś nowy deployment

```bash
git commit --allow-empty -m "Force redeploy to clear cache"
git push origin master
```

Poczekaj 3-5 minut, potem sprawdź.

### 4. Sprawdź w Network Tab

Na `my.coinect.pl/register` → DevTools → Network:
1. Wyczyść (Clear)
2. Odśwież stronę
3. Znajdź requesty do JS files (np. `ResetPasswordForm.*.js`)
4. Kliknij → Response → szukaj tekstu `lmijmesmitafugoukznb`
5. Jeśli NIE MA → stary build

### 5. Test z curl (bezpośrednio API)

```bash
curl -X POST https://lmijmesmitafugoukznb.supabase.co/auth/v1/signup \
  -H "apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "SecurePass123!@#"
  }'
```

**Jeśli to zadziała** → problem w buildzie aplikacji
**Jeśli to NIE zadziała** → problem w konfiguracji Supabase

---

## Dokumentacja utworzona

- ✅ `GITHUB_SECRETS_SETUP.md` - jak ustawić GitHub Secrets
- ✅ `CLOUDFLARE_SETUP.md` - jak ustawić Cloudflare (dla deploymentu bez GitHub Actions)
- ✅ `PRODUCTION_FIX.md` - szybki przewodnik rozwiązania
- ✅ `DEPLOYMENT.md` - szczegółowy przewodnik deploymentu

---

## Kluczowe URLs

- **Produkcja:** https://my.coinect.pl
- **GitHub Actions:** https://github.com/grasflow/Coinect/actions
- **Supabase Dashboard:** https://supabase.com/dashboard/project/lmijmesmitafugoukznb
- **Cloudflare Pages:** https://dash.cloudflare.com → Pages → coinect

---

## Kontekst techniczny

- **Framework:** Astro 5.15.3
- **Adapter:** @astrojs/cloudflare
- **Auth:** Supabase Auth
- **Deployment:** GitHub Actions → Wrangler → Cloudflare Pages
- **Branch:** master
- **Node:** Zobacz `.nvmrc`

---

## Pytania do następnej sesji

1. **Czy w Console na my.coinect.pl widzisz log `[Supabase Browser] Environment check:`?**
   - Jeśli NIE → cache problem
   - Jeśli TAK → pokaż cały obiekt

2. **Czy w Supabase Dashboard Auth Settings jest włączone "Confirm email"?**
   - Jeśli TAK i nie ma SMTP → to jest problem!

3. **Czy test curl bezpośrednio do Supabase API działa?**
   - Sprawdzi czy problem jest w Supabase czy w aplikacji

4. **Jaki hash pliku JS widzisz w Network Tab?**
   - Np. `RegisterForm.BP7WAYGH.js`
   - Sprawdź czy ten sam jest w GitHub Actions artifacts

---

## Status końcowy

❌ **Problem nie rozwiązany**
✅ **Build jest prawidłowy** (zmienne są w dist/)
❌ **Produkcja nie używa nowego buildu** (prawdopodobnie cache)

**Najbardziej prawdopodobna przyczyna:** Cloudflare Pages cache - stara wersja strony bez Supabase credentials jest serwowana użytkownikom.

**Zalecana akcja:** Wymuszenie nowego deploymentu + hard refresh w incognito.
