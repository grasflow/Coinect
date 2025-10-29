# 🚀 START HERE - CI/CD Pipeline Setup

## 👋 Witaj!

Utworzyłem kompletny setup CI/CD dla projektu Coinect. Oto co masz:

## ✨ Co zostało utworzone?

### 🔧 Główny workflow: `ci.yml`

```
Lint → Unit Tests + E2E Tests → Build Production
 ↓          ↓           ↓              ↓
Pass      Pass        Pass          ✅ SUCCESS
```

**Uruchamia się:**

- Automatycznie przy push do `master`
- Manualnie z zakładki Actions

**Zawiera:**

- ✅ ESLint checking
- ✅ Vitest unit tests (70% coverage)
- ✅ Playwright E2E tests
- ✅ Production build
- ✅ Artifacts (coverage, playwright reports, dist)

---

## 📚 Dokumentacja (10 plików)

### 🎯 Zacznij tutaj:

**[QUICK-START.md](./QUICK-START.md)** - 3 kroki, 10 minut do uruchomienia

### 📖 Pełny przewodnik:

**[INDEX.md](./INDEX.md)** - Index wszystkich dokumentów

### 🔑 Najważniejsze:

| Dokument            | Kiedy użyć                              |
| ------------------- | --------------------------------------- |
| **QUICK-START.md**  | ⚡ Chcę szybko uruchomić pipeline       |
| **SETUP.md**        | 📖 Szczegółowa instrukcja setup         |
| **DEBUG.md**        | 🐛 Pipeline failuje, szukam rozwiązania |
| **CHECKLIST.md**    | ✅ Przed pierwszym uruchomieniem        |
| **ARCHITECTURE.md** | 🏗️ Chcę zrozumieć jak to działa         |
| **README.md**       | ℹ️ Podstawowe info i wymagane sekrety   |
| **MIGRATION.md**    | 🔄 Migracja ze starego test.yml         |
| **STATUS-BADGE.md** | 🎨 Dodaj badge do README                |
| **INDEX.md**        | 🗺️ Gdzie szukać informacji              |

---

## 🎬 Pierwsze kroki (TERAZ!)

### 1️⃣ Dodaj GitHub Secrets (5 min)

GitHub → Settings → Secrets and variables → Actions → New secret

Dodaj **5 sekretów:**

```
SUPABASE_URL
SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
TEST_USER_EMAIL
TEST_USER_PASSWORD
```

📖 Zobacz [QUICK-START.md](./QUICK-START.md) krok 1 dla szczegółów

---

### 2️⃣ Sprawdź lokalnie (3 min)

```bash
npm run lint
npm run test:run
npm run build
```

Wszystko działa? ✅ Idź dalej!

---

### 3️⃣ Uruchom pipeline (2 min)

**Opcja A: Push do master**

```bash
git add .
git commit -m "feat: add CI/CD pipeline"
git push origin master
```

**Opcja B: Manualne**
GitHub → Actions → CI Pipeline → Run workflow

---

## 📊 Status

Sprawdź status pipeline:

```
https://github.com/{OWNER}/{REPO}/actions
```

---

## 🆘 Pomoc

**Pipeline failuje?**
→ [DEBUG.md](./DEBUG.md)

**Nie wiesz od czego zacząć?**
→ [QUICK-START.md](./QUICK-START.md)

**Potrzebujesz szczegółów?**
→ [INDEX.md](./INDEX.md)

---

## 📝 Checklist przed push

- [ ] Przeczytałem QUICK-START.md
- [ ] Dodałem 5 sekretów w GitHub
- [ ] Testy przechodzą lokalnie
- [ ] Gotowy do push!

---

## 🎉 Gratulacje!

Po skonfigurowaniu będziesz mieć:

- ✅ Automatyczne testowanie przy każdym push
- ✅ Automatyczny build produkcyjny
- ✅ Raporty coverage i E2E
- ✅ Pewność że kod działa przed merge

**Czas setup: ~10 minut**
**Czas oszczędzony później: bezcenny** ⏱️

---

## 🔗 Quick Links

- [QUICK-START.md](./QUICK-START.md) - Zacznij tutaj!
- [INDEX.md](./INDEX.md) - Pełny index
- [ci.yml](./ci.yml) - Workflow file
- [README.md](./README.md) - Podstawy

---

**Gotowy? Zaczynamy!** 🚀

→ [QUICK-START.md](./QUICK-START.md)
