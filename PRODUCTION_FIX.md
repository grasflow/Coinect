# 🚨 FIX: Nie mogę się zalogować/zarejestrować na produkcji

## Problem
Nie możesz się zalogować ani założyć konta na **https://my.coinect.pl**

## Rozwiązanie (5 minut)

Twój deployment idzie przez GitHub Actions, więc **musisz ustawić GitHub Secrets**.

### ✅ Krok 1: Przejdź do GitHub Secrets

1. Otwórz: `https://github.com/[TWOJA-NAZWA]/Coinect/settings/secrets/actions`
2. Lub: **Repo → Settings → Secrets and variables → Actions**

### ✅ Krok 2: Dodaj te 2 sekrety

Kliknij **"New repository secret"** i dodaj:

**Secret 1:**
```
Name: SUPABASE_URL
Secret: https://lmijmesmitafugoukznb.supabase.co
```

**Secret 2:**
```
Name: SUPABASE_KEY
Secret: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0
```

### ✅ Krok 3: Trigger deployment

```bash
git commit --allow-empty -m "Fix: Add Supabase secrets"
git push origin master
```

### ✅ Krok 4: Sprawdź

1. Przejdź do **Actions** na GitHubie
2. Poczekaj aż workflow się skończy (~5 min)
3. Sprawdź krok **"Verify environment variables"** - powinno być ✅
4. Otwórz **https://my.coinect.pl/register** w incognito
5. Załóż konto - **powinno działać!** 🎉

---

## Jeśli potrzebujesz więcej szczegółów

- [GITHUB_SECRETS_SETUP.md](GITHUB_SECRETS_SETUP.md) - pełna instrukcja GitHub Secrets
- [DEPLOYMENT.md](DEPLOYMENT.md) - szczegóły deploymentu
- [CLOUDFLARE_SETUP.md](CLOUDFLARE_SETUP.md) - dla deploymentu bez GitHub Actions

---

## Dlaczego to nie działało?

Workflow buildu na GitHubie potrzebuje zmiennych Supabase, ale nie miało dostępu do nich (secrets były puste). Teraz po dodaniu secrets, build będzie miał prawidłowy URL i klucz do Supabase wkompilowane w kod.
