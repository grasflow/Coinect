# 🚀 Szybki start - następna sesja

## Problem w skrócie
**Rejestracja i logowanie NIE działa na https://my.coinect.pl** ❌

### Błędy:
- Register: `SIGNUP_ERROR` (400)
- Login: `INVALID_CREDENTIALS` (401)

---

## Co JUŻ DZIAŁA ✅

1. ✅ Build jest prawidłowy (zmienne Supabase są w dist/)
2. ✅ GitHub Secrets ustawione
3. ✅ Deployment się powiódł (3h temu)
4. ✅ Lokalna wersja działa

---

## Główny problem 🎯

**Cloudflare prawdopodobnie serwuje STARY BUILD bez Supabase credentials.**

### Dowód:
W Console na `my.coinect.pl/register` **NIE MA** tego loga:
```
[Supabase Browser] Environment check:
```

Ten log **MUSI** się pojawić (patrz: `src/db/supabase.browser.ts:18`)

---

## Co sprawdzić NAJPIERW

### 1. Test w Console (F12)

Na `https://my.coinect.pl/register` wklej w Console:

```javascript
console.log('PUBLIC_SUPABASE_URL:', import.meta.env.PUBLIC_SUPABASE_URL);
console.log('PUBLIC_SUPABASE_KEY:', import.meta.env.PUBLIC_SUPABASE_KEY);
```

**Oczekiwany wynik:**
```
PUBLIC_SUPABASE_URL: https://lmijmesmitafugoukznb.supabase.co
PUBLIC_SUPABASE_KEY: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Jeśli undefined** → **TO JEST PROBLEM!** Stary build bez zmiennych.

---

### 2. Sprawdź Supabase Auth Settings

```
https://supabase.com/dashboard/project/lmijmesmitafugoukznb/settings/auth
```

**Kluczowe pytanie:**
- ❓ Czy **"Confirm email"** jest włączone?
  - Jeśli **TAK** i nie ma SMTP → **TO JEST PROBLEM!**
  - Rozwiązanie: Wyłącz "Confirm email" ALBO skonfiguruj SMTP

---

### 3. Test bezpośrednio do Supabase API

```bash
curl -X POST https://lmijmesmitafugoukznb.supabase.co/auth/v1/signup \
  -H "apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0" \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"SecurePass123!@#"}'
```

- **Działa** → Problem w buildzie aplikacji (cache)
- **Nie działa** → Problem w Supabase (auth settings)

---

## Szybkie rozwiązania

### Opcja A: Wymuś nowy deployment

```bash
git commit --allow-empty -m "Force cache clear"
git push origin master
```

Poczekaj 5 minut → Sprawdź `my.coinect.pl` w incognito.

---

### Opcja B: Wyłącz "Confirm email" w Supabase

1. Otwórz: https://supabase.com/dashboard/project/lmijmesmitafugoukznb/settings/auth
2. Znajdź **"Enable Email Confirmation"**
3. **Wyłącz** (disable)
4. Save
5. Spróbuj się zarejestrować ponownie

---

## Pliki do przeczytania

- **Szczegółowe:** [PRODUCTION_ISSUE_SUMMARY.md](PRODUCTION_ISSUE_SUMMARY.md)
- **GitHub Secrets:** [GITHUB_SECRETS_SETUP.md](GITHUB_SECRETS_SETUP.md)
- **Deployment:** [DEPLOYMENT.md](DEPLOYMENT.md)

---

## Kluczowe linki

- 🌐 Produkcja: https://my.coinect.pl
- 🔧 GitHub Actions: https://github.com/grasflow/Coinect/actions
- 💾 Supabase: https://supabase.com/dashboard/project/lmijmesmitafugoukznb
- ☁️ Cloudflare: https://dash.cloudflare.com → Pages → coinect

---

## TL;DR - Co zrobić

1. **Sprawdź Console na my.coinect.pl** - czy są zmienne Supabase?
2. **Sprawdź Supabase Auth Settings** - czy "Confirm email" = OFF?
3. **Test curl** - czy Supabase API działa bezpośrednio?
4. **Wymuś redeploy** - git push empty commit

**Najbardziej prawdopodobne:** Cache problem lub "Confirm email" włączone bez SMTP.
