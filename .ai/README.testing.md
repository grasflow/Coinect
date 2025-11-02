# Dokumentacja testowania

## Przegląd

Projekt używa dwóch frameworków testowych:

- **Vitest** - testy jednostkowe i integracyjne
- **Playwright** - testy E2E

## Testy jednostkowe (Vitest)

### Uruchamianie testów

```bash
# Tryb watch (development)
npm run test

# Uruchom wszystkie testy raz
npm run test:run

# Interfejs UI
npm run test:ui

# Pokrycie kodu
npm run test:coverage

# Watch mode z filtrem
npm run test:watch -- button
```

### Struktura testów

Testy jednostkowe znajdują się obok testowanego kodu z rozszerzeniem `.test.ts` lub `.test.tsx`:

```
src/
  components/
    ui/
      button.tsx
      button.test.tsx  ← Test
  lib/
    utils.ts
    utils.test.ts     ← Test
```

### Pisanie testów

```typescript
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@test/helpers/test-utils';
import { MyComponent } from './MyComponent';

describe('MyComponent', () => {
  it('renderuje się poprawnie', () => {
    render(<MyComponent title="Test" />);
    expect(screen.getByText('Test')).toBeInTheDocument();
  });

  it('obsługuje kliknięcie', async () => {
    const handleClick = vi.fn();
    render(<MyComponent onClick={handleClick} />);

    await userEvent.click(screen.getByRole('button'));
    expect(handleClick).toHaveBeenCalled();
  });
});
```

### Mock Service Worker (MSW)

MSW mockuje zewnętrzne API (Supabase, OpenRouter, NBP, GUS).

Handlery znajdują się w `test/mocks/handlers.ts`:

```typescript
http.get("https://api.example.com/data", () => {
  return HttpResponse.json({ data: "mock" });
});
```

### Fabryki mocków

Używaj fabryk z `test/helpers/mock-factories.ts`:

```typescript
import { mockProfile, mockClient } from "@test/helpers/mock-factories";

const testProfile = mockProfile({ full_name: "Custom Name" });
const testClient = mockClient({ email: "custom@email.com" });
```

## Testy E2E (Playwright)

### Uruchamianie testów

```bash
# Uruchom wszystkie testy E2E
npm run test:e2e

# Tryb UI (interaktywny)
npm run test:e2e:ui

# Tryb headed (widoczna przeglądarka)
npm run test:e2e:headed

# Debug pojedynczego testu
npm run test:e2e:debug

# Pokaż ostatni raport
npm run test:e2e:report
```

### Struktura testów E2E

```
e2e/
  fixtures/        ← Współdzielone fixture'y (np. auth)
  pages/           ← Page Object Models
  *.spec.ts        ← Pliki testowe
```

### Page Object Model

```typescript
// e2e/pages/login.page.ts
import { Page, Locator } from "@playwright/test";

export class LoginPage {
  readonly page: Page;
  readonly emailInput: Locator;
  readonly submitButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.emailInput = page.locator('input[type="email"]');
    this.submitButton = page.locator('button[type="submit"]');
  }

  async goto() {
    await this.page.goto("/login");
  }

  async login(email: string, password: string) {
    await this.emailInput.fill(email);
    await this.submitButton.click();
  }
}
```

### Pisanie testów E2E

```typescript
import { test, expect } from "@playwright/test";
import { LoginPage } from "./pages/login.page";

test("użytkownik może się zalogować", async ({ page }) => {
  const loginPage = new LoginPage(page);
  await loginPage.goto();
  await loginPage.login("test@example.com", "password");

  await expect(page).toHaveURL("/dashboard");
});
```

### Fixture autentykacji

Używaj fixture'a dla testów wymagających zalogowania:

```typescript
import { test, expect } from "./fixtures/auth.fixture";

test("wyświetla dane użytkownika", async ({ authenticatedPage }) => {
  // Użytkownik jest już zalogowany
  await expect(authenticatedPage.locator("h1")).toBeVisible();
});
```

### Testy dostępności (a11y)

```typescript
import AxeBuilder from "@axe-core/playwright";

test("strona jest dostępna", async ({ page }) => {
  await page.goto("/");

  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations).toEqual([]);
});
```

## Uruchamianie wszystkich testów

```bash
# Uruchom testy jednostkowe i E2E
npm run test:all
```

## CI/CD

Pipeline GitHub Actions automatycznie uruchamia:

- Testy jednostkowe z pokryciem kodu
- Testy E2E w przeglądarce Chromium
- Generuje raporty i artefakty

## Najlepsze praktyki

### Vitest

1. Używaj `vi.fn()` dla mocków funkcji
2. Wykorzystuj `mockImplementation()` dla dynamicznych mocków
3. Stosuj `describe` dla grupowania powiązanych testów
4. Nazywaj testy opisowo: `it('robi coś konkretnego')`
5. Stosuj AAA pattern (Arrange-Act-Assert)

### Playwright

1. Używaj Page Object Model dla wielokrotnie używanych stron
2. Preferuj selektory oparte na rolach (`getByRole`)
3. Czekaj na elementy zamiast używać `sleep()`
4. Izoluj testy - każdy test powinien być niezależny
5. Używaj fixture'ów dla współdzielonej logiki

## Pokrycie kodu

Minimalne progi pokrycia (konfigurowane w `vitest.config.ts`):

- Lines: 70%
- Functions: 70%
- Branches: 70%
- Statements: 70%

## Debugowanie

### Vitest

```bash
# Debug w VS Code
# Dodaj breakpoint i uruchom przez VS Code debugger

# Log w konsoli
console.log('debug:', variable);
```

### Playwright

```bash
# Debug mode
npm run test:e2e:debug

# Headed mode (widoczna przeglądarka)
npm run test:e2e:headed

# Trace viewer (po błędzie)
npx playwright show-trace trace.zip
```

## Zasoby

- [Vitest Docs](https://vitest.dev)
- [Playwright Docs](https://playwright.dev)
- [Testing Library](https://testing-library.com)
- [MSW Docs](https://mswjs.io)
