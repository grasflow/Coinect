# CI/CD Documentation Index

Witaj w dokumentacji CI/CD dla projektu Coinect! Poniżej znajdziesz przewodnik po wszystkich dostępnych dokumentach.

## 📋 Szybki Start

**⚡ Jeśli konfigurujesz CI/CD po raz pierwszy:**
→ Zobacz [QUICK-START.md](./QUICK-START.md) - 3 kroki, 10 minut setup!

**Lub bardziej szczegółowo:**

1. Przeczytaj [CHECKLIST.md](./CHECKLIST.md) - upewnij się, że masz wszystko gotowe
2. Przeczytaj [SETUP.md](./SETUP.md) - szczegółowa instrukcja konfiguracji
3. Uruchom workflow manualnie lub push do `master`
4. Zobacz [README.md](./README.md) - wymagane sekrety i podstawowe info

## 📚 Dokumenty

### 0. [QUICK-START.md](./QUICK-START.md) ⚡

**3 kroki do uruchomienia pipeline (10 minut)**

- Dodaj sekrety w GitHub
- Sprawdź testy lokalnie
- Uruchom pipeline
- Szybkie troubleshooting

**Dla kogo:** Wszyscy - najlepszy punkt startu!

---

### 1. [README.md](./README.md)

**Podstawowe informacje o pipeline**

- Wymagane GitHub Secrets
- Opis wszystkich jobs
- Wersja Node.js

**Dla kogo:** Wszyscy członkowie zespołu

---

### 2. [SETUP.md](./SETUP.md)

**Instrukcja konfiguracji krok po kroku**

- Jak dodać GitHub Secrets
- Jak uruchomić pipeline (automatycznie/manualnie)
- Jak monitorować status
- Jak pobrać artifacts
- Troubleshooting

**Dla kogo:** DevOps, osoby konfigurujące CI/CD

---

### 3. [CHECKLIST.md](./CHECKLIST.md)

**Checklist przed uruchomieniem**

- ✅ Pre-deployment checklist
- Testy lokalne
- Konfiguracja projektu
- Weryfikacja Supabase
- Pierwsze uruchomienie
- Testowanie pipeline lokalnie

**Dla kogo:** DevOps, przed pierwszym deployment

---

### 4. [ARCHITECTURE.md](./ARCHITECTURE.md)

**Szczegółowa architektura pipeline**

- Diagram Mermaid przepływu pracy
- Szczegóły każdego joba (timeouty, dependencies, etc.)
- Optymalizacje (równoległość, cache)
- Monitoring i debugowanie
- Bezpieczeństwo
- Skalowanie (jak rozbudować pipeline)

**Dla kogo:** DevOps, zaawansowani użytkownicy

---

### 5. [MIGRATION.md](./MIGRATION.md)

**Migracja ze starego test.yml**

- Porównanie test.yml vs ci.yml
- Zalecenia
- Krok po kroku instrukcja migracji
- Potencjalne problemy i rozwiązania

**Dla kogo:** Zespół migrujący z test.yml

---

### 6. [STATUS-BADGE.md](./STATUS-BADGE.md)

**Badge'e dla README**

- Jak dodać CI status badge
- Dodatkowe badge'e (coverage, license, node version)
- Przykładowy header README

**Dla kogo:** Osoby zarządzające dokumentacją projektu

---

### 7. [DEBUG.md](./DEBUG.md)

**Debugowanie i troubleshooting**

- Szybka diagnostyka problemów
- Testowanie lokalne (symulacja CI)
- Najczęstsze problemy i rozwiązania
- Monitoring i logi
- Advanced debugging
- Dobre praktyki

**Dla kogo:** DevOps, wszyscy debugujący problemy z pipeline

---

### 8. [IMPROVEMENTS.md](./IMPROVEMENTS.md)

**Zastosowane ulepszenia i best practices**

- Bezpieczeństwo (permissions, secrets scoping)
- Performance (concurrency, timeouts, kompresja)
- Weryfikacja wersji akcji
- Porównanie przed/po
- Zgodność z wytycznymi

**Dla kogo:** DevOps, zaawansowani użytkownicy, code reviewers

---

## 🚀 Workflow Files

### [ci.yml](./ci.yml)

**Główny workflow CI/CD**

Jobs:

1. **Lint** → ESLint (~1 min)
2. **Unit Tests** → Vitest + coverage (~2 min)
3. **E2E Tests** → Playwright (~3-5 min)
4. **Build** → Astro production build (~2 min)

Trigger:

- Push do `master`
- Manual dispatch

---

### [test.yml](./test.yml)

**⚠️ Stary workflow (do usunięcia)**

Zobacz [MIGRATION.md](./MIGRATION.md) dla szczegółów.

---

## 🎯 Dla różnych use case'ów

### "Chcę tylko uruchomić pipeline"

→ [SETUP.md](./SETUP.md) sekcja 2

### "Pipeline failuje, co robić?"

→ [DEBUG.md](./DEBUG.md) lub [SETUP.md](./SETUP.md) sekcja 5

### "Chcę dodać nowy job do pipeline"

→ [ARCHITECTURE.md](./ARCHITECTURE.md) sekcja Skalowanie

### "Chcę zrozumieć jak działa cały pipeline"

→ [ARCHITECTURE.md](./ARCHITECTURE.md)

### "Muszę skonfigurować CI/CD od zera"

→ [CHECKLIST.md](./CHECKLIST.md) → [SETUP.md](./SETUP.md)

### "Mam stary test.yml, co z nim zrobić?"

→ [MIGRATION.md](./MIGRATION.md)

---

## 📊 Status Pipeline

Sprawdź aktualny status pipeline:

- GitHub Actions: https://github.com/{OWNER}/{REPO}/actions

Pobierz artifacts z ostatniego uruchomienia:

1. Wejdź w Actions
2. Wybierz workflow run
3. Scroll w dół do "Artifacts"
4. Pobierz: coverage-report, playwright-report, lub dist

---

## 🔧 Wymagania

### GitHub Secrets (5 sekretów)

```
SUPABASE_URL
SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
TEST_USER_EMAIL
TEST_USER_PASSWORD
```

Zobacz [README.md](./README.md) dla szczegółów.

### Node.js Version

- **22.14.0** (z pliku .nvmrc)

### Czas wykonania

- **~8-10 min** całość
- **~1 min** lint
- **~2 min** unit tests
- **~3-5 min** E2E tests
- **~2 min** build

---

## 📞 Pomoc

Jeśli masz pytania:

1. Sprawdź [DEBUG.md](./DEBUG.md) dla szczegółowego troubleshootingu
2. Sprawdź [SETUP.md](./SETUP.md) sekcję Troubleshooting
3. Sprawdź logi w GitHub Actions
4. Sprawdź czy testy przechodzą lokalnie (`npm run test:all`)
5. Sprawdź czy sekrety są poprawnie skonfigurowane

---

## 📝 Contributing

Jeśli chcesz ulepszyć pipeline:

1. Przeczytaj [ARCHITECTURE.md](./ARCHITECTURE.md)
2. Testuj zmiany lokalnie
3. Stwórz PR z opisem zmian
4. Upewnij się, że pipeline przechodzi

---

**Ostatnia aktualizacja:** 2025-10-29
**Wersja:** 1.0.0
**Kontakt:** Zobacz SETUP.md
