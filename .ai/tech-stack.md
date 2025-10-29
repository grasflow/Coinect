Frontend - Astro z React dla komponentów interaktywnych:

- Astro 5 pozwala na tworzenie szybkich, wydajnych stron i aplikacji z minimalną ilością JavaScript
- React 19 zapewni interaktywność tam, gdzie jest potrzebna
- TypeScript 5 dla statycznego typowania kodu i lepszego wsparcia IDE
- Tailwind 4 pozwala na wygodne stylowanie aplikacji
- Shadcn/ui zapewnia bibliotekę dostępnych komponentów React, na których oprzemy UI

Backend - Supabase jako kompleksowe rozwiązanie backendowe:

- Zapewnia bazę danych PostgreSQL
- Zapewnia SDK w wielu językach, które posłużą jako Backend-as-a-Service
- Jest rozwiązaniem open source, które można hostować lokalnie lub na własnym serwerze
- Posiada wbudowaną autentykację użytkowników

AI - Komunikacja z modelami przez usługę Openrouter.ai:

- Dostęp do szerokiej gamy modeli (OpenAI, Anthropic, Google i wiele innych), które pozwolą nam znaleźć rozwiązanie zapewniające wysoką efektywność i niskie koszta
- Pozwala na ustawianie limitów finansowych na klucze API

Testy jednostkowe i integracyjne:

- Vitest 2.0+ z @vitest/ui - natywna integracja z Vite/Astro, ~10x szybszy niż Jest
- @testing-library/react + @testing-library/jest-dom - user-centric testing dla React 19
- Vitest Browser Mode - component testing w rzeczywistej przeglądarce dla edge cases
- MSW (Mock Service Worker) 2.0 - mockowanie zewnętrznych API (OpenRouter, GUS, NBP)
- @supabase/postgres-testing - nowoczesny framework dla testów PostgreSQL
- Zod test utils - walidacja schematów

Testy E2E i UI:

- Playwright - cross-browser testing (Chrome/Firefox/Safari) dla pełnych flow użytkownika
- axe-playwright - automatyczne testy accessibility w CI
- @axe-core/react - runtime monitoring dostępności w development
- Percy/Chromatic - visual regression testing (snapshoty UI)

Testy wydajnościowe i bezpieczeństwa:

- k6 (Grafana) - load testing z JavaScript scripting
- Lighthouse CI - performance metrics dla frontend
- Snyk - automatyczne skanowanie vulnerabilities w dependencies
- GitHub Advanced Security - CodeQL static analysis
- OWASP ZAP - penetration testing

Dodatkowe narzędzia testowe:

- Pact.io - contract testing dla API endpoints (frontend ↔ backend)
- Snaplet - seed data snapshots dla konsystentnych testów
- Stryker Mutator - mutation testing dla krytycznych serwisów (opcjonalnie, post-MVP)

CI/CD i Hosting:

- Github Actions do tworzenia pipeline'ów CI/CD z pełną integracją testów
- DigitalOcean do hostowania aplikacji za pośrednictwem obrazu docker
