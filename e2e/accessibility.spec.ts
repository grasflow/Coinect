import { test, expect } from "./fixtures/auth.fixture";
import AxeBuilder from "@axe-core/playwright";

test.describe("Accessibility Tests", () => {
  test("strona główna nie ma problemów z dostępnością", async ({ page }) => {
    await page.goto("/");

    // Poczekaj na załadowanie strony
    await page.waitForLoadState("networkidle");

    const accessibilityScanResults = await new AxeBuilder({ page }).analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test("strona logowania nie ma problemów z dostępnością", async ({ page }) => {
    await page.goto("/login");

    // Poczekaj na załadowanie strony
    await page.waitForLoadState("networkidle");

    const accessibilityScanResults = await new AxeBuilder({ page }).analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test("dashboard nie ma problemów z dostępnością", async ({ authenticatedPage }) => {
    const accessibilityScanResults = await new AxeBuilder({ page: authenticatedPage })
      .include("main") // Skup się tylko na głównym obszarze contentu
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });
});
