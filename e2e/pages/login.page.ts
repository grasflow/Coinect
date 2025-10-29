import type { Page, Locator } from "@playwright/test";

export class LoginPage {
  readonly page: Page;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly submitButton: Locator;
  readonly errorMessage: Locator;

  constructor(page: Page) {
    this.page = page;
    this.emailInput = page.locator('input[type="email"]');
    this.passwordInput = page.locator('input[type="password"]');
    this.submitButton = page.locator('button[type="submit"]');
    this.errorMessage = page.locator('[role="alert"]');
  }

  async goto() {
    await this.page.goto("/login");
  }

  async login(email: string, password: string) {
    // Czekaj na załadowanie formularza
    await this.emailInput.waitFor({ state: "visible" });
    await this.passwordInput.waitFor({ state: "visible" });

    // Wypełnij pola używając .pressSequentially() żeby triggerować onChange events
    // fill() nie triggeruje onChange w React, przez co formData state nie jest updated
    await this.emailInput.click();
    await this.emailInput.pressSequentially(email, { delay: 50 }); // Delay symuluje naturalne pisanie

    await this.passwordInput.click();
    await this.passwordInput.pressSequentially(password, { delay: 50 });

    // Daj React czas na batch update state przed kliknięciem submit
    await this.page.waitForTimeout(200);

    // Kliknij submit i czekaj na odpowiedź API oraz przekierowanie
    const [response] = await Promise.all([
      this.page.waitForResponse((resp) => resp.url().includes("/api/auth/login"), { timeout: 30000 }),
      this.submitButton.click(),
    ]);

    // Sprawdź czy login się powiódł
    if (!response.ok()) {
      const body = await response.text();
      throw new Error(`Login API failed: ${response.status()} - ${body}`);
    }

    // Czekaj na przekierowanie na dashboard (LoginForm robi window.location.href)
    await this.page.waitForURL("/dashboard", { timeout: 30000 });

    // Czekaj na załadowanie strony
    await this.page.waitForLoadState("load");
  }

  async waitForDashboard() {
    await this.page.waitForURL("/dashboard", { timeout: 30000 });
  }
}
