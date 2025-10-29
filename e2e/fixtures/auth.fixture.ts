import { test as base, type Page } from "@playwright/test";
import { LoginPage } from "../pages/login.page";

interface AuthFixtures {
  authenticatedPage: any;
}

export const test = base.extend<AuthFixtures>({
  authenticatedPage: async ({ page }: { page: Page }, use: (page: any) => Promise<void>) => {
    const loginPage = new LoginPage(page);

    // Pobierz dane logowania ze zmiennych środowiskowych
    const testEmail = process.env.TEST_USER_EMAIL || "test@test.pl";
    const testPassword = process.env.TEST_USER_PASSWORD || "test12345";

    // Przejdź do strony logowania i zaloguj się
    await loginPage.goto();

    // Poczekaj na pełne załadowanie strony przed logowaniem
    await page.waitForLoadState("networkidle");

    await loginPage.login(testEmail, testPassword);

    await use(page);
  },
});

export { expect } from "@playwright/test";
