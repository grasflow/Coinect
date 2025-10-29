import type { Page, Locator } from "@playwright/test";

export class DashboardPage {
  readonly page: Page;
  readonly heading: Locator;
  readonly navigation: Locator;

  constructor(page: Page) {
    this.page = page;
    this.heading = page.locator("main h1");
    this.navigation = page.locator("nav");
  }

  async goto() {
    await this.page.goto("/dashboard");
  }

  async waitForPageLoad() {
    await this.heading.waitFor({ state: "visible" });
  }

  async navigateToTimeEntries() {
    await this.page.click('a[href="/time-entries"]');
  }

  async navigateToInvoices() {
    await this.page.click('a[href="/invoices"]');
  }

  async navigateToClients() {
    await this.page.click('a[href="/clients"]');
  }
}
