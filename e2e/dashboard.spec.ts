import { test, expect } from "./fixtures/auth.fixture";
import { DashboardPage } from "./pages/dashboard.page";

test.describe("Dashboard", () => {
  test("wyświetla dashboard po zalogowaniu", async ({ authenticatedPage }) => {
    const dashboardPage = new DashboardPage(authenticatedPage);
    await dashboardPage.waitForPageLoad();

    await expect(dashboardPage.heading).toBeVisible();
    await expect(dashboardPage.navigation).toBeVisible();
  });

  test("nawiguje do strony time entries", async ({ authenticatedPage }) => {
    const dashboardPage = new DashboardPage(authenticatedPage);
    await dashboardPage.waitForPageLoad();

    await dashboardPage.navigateToTimeEntries();
    await expect(authenticatedPage).toHaveURL("/time-entries");
  });

  test("nawiguje do strony faktur", async ({ authenticatedPage }) => {
    const dashboardPage = new DashboardPage(authenticatedPage);
    await dashboardPage.waitForPageLoad();

    await dashboardPage.navigateToInvoices();
    await expect(authenticatedPage).toHaveURL("/invoices");
  });

  test("nawiguje do strony klientów", async ({ authenticatedPage }) => {
    const dashboardPage = new DashboardPage(authenticatedPage);
    await dashboardPage.waitForPageLoad();

    await dashboardPage.navigateToClients();
    await expect(authenticatedPage).toHaveURL("/clients");
  });
});
