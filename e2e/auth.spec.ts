import { test, expect } from "@playwright/test";
import { LoginPage } from "./pages/login.page";

test.describe("Autentykacja", () => {
  test("wyświetla formularz logowania", async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();

    await expect(loginPage.emailInput).toBeVisible();
    await expect(loginPage.passwordInput).toBeVisible();
    await expect(loginPage.submitButton).toBeVisible();
  });

  test("wyświetla błąd przy niepoprawnych danych", async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();

    // Wypełnij formularz z błędnymi danymi
    // Użyj .pressSequentially() zamiast .fill() - triggeruje onChange w React
    await loginPage.emailInput.click();
    await loginPage.emailInput.pressSequentially("invalid@example.com", { delay: 50 });

    await loginPage.passwordInput.click();
    await loginPage.passwordInput.pressSequentially("wrongpassword", { delay: 50 });

    // Daj React czas na batch state updates
    await page.waitForTimeout(200);

    await loginPage.submitButton.click();

    // Poczekaj na error alert (główny test)
    await expect(loginPage.errorMessage).toBeVisible({ timeout: 15000 });
    await expect(loginPage.errorMessage).toContainText(/Nieprawidłow|email|hasło/i);

    // Sprawdź czy nie przekierowało (nadal na /login)
    await expect(page).toHaveURL(/\/login/);
  });

  test("przekierowuje do dashboardu po poprawnym logowaniu", async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();

    // Pobierz dane logowania ze zmiennych środowiskowych
    const testEmail = process.env.TEST_USER_EMAIL || "test@test.pl";
    const testPassword = process.env.TEST_USER_PASSWORD || "test12345";

    await loginPage.login(testEmail, testPassword);

    // Login już czeka na dashboard, więc tylko potwierdzamy URL
    await expect(page).toHaveURL("/dashboard");
  });

  test("ma dostępny formularz logowania (a11y)", async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();

    // Sprawdź podstawowe elementy dostępności
    const emailLabel = page.locator('label[for*="email"]');
    const passwordLabel = page.locator('label[for*="password"]');

    await expect(emailLabel).toBeVisible();
    await expect(passwordLabel).toBeVisible();
  });
});
