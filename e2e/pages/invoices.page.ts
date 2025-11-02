import type { Page, Locator } from "@playwright/test";
import { expect } from "@playwright/test";

export class InvoicesPage {
  readonly page: Page;

  // Main elements
  readonly pageHeading: Locator;
  readonly pageDescription: Locator;
  readonly newInvoiceButton: Locator;
  readonly invoicesTable: Locator;
  readonly invoicesCount: Locator;
  readonly emptyState: Locator;

  // Filters
  readonly clientFilter: Locator;
  readonly statusFilter: Locator;
  readonly currencyFilter: Locator;
  readonly dateRangeFilter: Locator;
  readonly clearFiltersButton: Locator;

  // Invoice actions (in rows)
  readonly downloadPdfButtons: Locator;
  readonly editButtons: Locator;
  readonly deleteButtons: Locator;
  readonly togglePaidButtons: Locator;

  // Delete dialog (assigned dynamically in deleteInvoice method)
  deleteDialog!: Locator;
  deleteDialogTitle!: Locator;
  deleteDialogDescription!: Locator;
  deleteConfirmButton!: Locator;
  deleteCancelButton!: Locator;

  // Pagination
  readonly previousPageButton: Locator;
  readonly nextPageButton: Locator;
  readonly currentPageInfo: Locator;

  constructor(page: Page) {
    this.page = page;

    // Main elements
    this.pageHeading = page.locator("h1").filter({ hasText: "Faktury" });
    this.pageDescription = page.locator("p").filter({ hasText: "Zarządzaj fakturami i śledź płatności" });
    this.newInvoiceButton = page.locator("button").filter({ hasText: "Nowa faktura" });
    this.invoicesTable = page.locator("table");
    this.invoicesCount = page.getByTestId("invoices-count");
    this.emptyState = page.locator("text=Brak faktur");

    // Filters
    this.clientFilter = page.locator("#filter-client").locator("..").locator('[data-slot="select-trigger"]');
    this.statusFilter = page.locator("#filter-status").locator("..").locator('[data-slot="select-trigger"]');
    this.currencyFilter = page.locator("#filter-currency").locator("..").locator('[data-slot="select-trigger"]');
    this.dateRangeFilter = page.locator("button").filter({ hasText: /Wybierz zakres/ });
    this.clearFiltersButton = page.locator("button").filter({ hasText: "Wyczyść filtry" }).first();

    // Invoice actions
    this.downloadPdfButtons = page.locator('button[title="Pobierz PDF"]');
    this.editButtons = page.locator('button[title="Edytuj fakturę"]');
    this.deleteButtons = page.locator('button[title="Usuń fakturę"]');
    this.togglePaidButtons = page
      .locator('button[title*="Oznacz jako"]')
      .or(page.locator("button").locator('svg[class*="text-green"]').locator(".."))
      .or(page.locator("button").locator('svg[class*="text-muted"]').locator(".."));

    // Pagination
    this.previousPageButton = page.locator("button").filter({ hasText: "Poprzednia" });
    this.nextPageButton = page.locator("button").filter({ hasText: "Następna" });
    this.currentPageInfo = page.getByTestId("pagination-info");
  }

  async goto() {
    await this.page.goto("/invoices");
  }

  async waitForPageLoad() {
    await this.pageHeading.waitFor({ state: "visible" });
  }

  async createNewInvoice() {
    // Ensure page is fully loaded and hydrated
    await this.page.waitForLoadState("domcontentloaded");
    await this.page.waitForLoadState("networkidle", { timeout: 10000 });

    // Wait for button to be visible and enabled
    await this.newInvoiceButton.waitFor({ state: "visible", timeout: 10000 });
    await expect(this.newInvoiceButton).toBeEnabled({ timeout: 5000 });

    // Additional wait to ensure React hydration is complete
    await this.page.waitForTimeout(500);

    // Start waiting for navigation BEFORE clicking (prevents race conditions)
    const navigationPromise = this.page.waitForURL("/invoices/new", { timeout: 30000 });

    await this.newInvoiceButton.click();

    // Wait for navigation to complete
    await navigationPromise;
  }

  async filterByClient(clientName: string) {
    // Ensure page is fully loaded and hydrated
    await this.page.waitForLoadState("domcontentloaded");
    // Wait for filter to be ready
    await this.clientFilter.waitFor({ state: "visible", timeout: 5000 });
    await this.page.waitForTimeout(500);

    await this.clientFilter.click();
    // Give React time to open the dropdown after click
    await this.page.waitForTimeout(100);
    // Wait for dropdown to be visible
    await this.page.locator('[data-slot="select-content"]').waitFor({ state: "visible", timeout: 5000 });
    await this.page.locator('[data-slot="select-item"]').filter({ hasText: clientName }).click();
  }

  async filterByStatus(status: "all" | "paid" | "unpaid") {
    const statusText = {
      all: "Wszystkie",
      paid: "Zapłacone",
      unpaid: "Niezapłacone",
    };

    // Ensure page is fully loaded and hydrated
    await this.page.waitForLoadState("domcontentloaded");
    // Wait for filter to be ready
    await this.statusFilter.waitFor({ state: "visible", timeout: 5000 });
    await this.page.waitForTimeout(500);

    await this.statusFilter.click();
    // Give React time to open the dropdown after click
    await this.page.waitForTimeout(100);
    // Wait for dropdown to be visible
    await this.page.locator('[data-slot="select-content"]').waitFor({ state: "visible", timeout: 5000 });
    await this.page.locator('[data-slot="select-item"]').filter({ hasText: statusText[status] }).click();
  }

  async filterByCurrency(currency: "all" | "PLN" | "EUR" | "USD") {
    const currencyText = {
      all: "Wszystkie",
      PLN: "PLN",
      EUR: "EUR",
      USD: "USD",
    };

    // Ensure page is fully loaded and hydrated
    await this.page.waitForLoadState("domcontentloaded");
    // Wait for filter to be ready
    await this.currencyFilter.waitFor({ state: "visible", timeout: 5000 });
    await this.page.waitForTimeout(500);

    await this.currencyFilter.click();
    // Wait for dropdown to be visible
    await this.page.locator('[data-slot="select-content"]').waitFor({ state: "visible", timeout: 5000 });
    await this.page.locator('[data-slot="select-item"]').filter({ hasText: currencyText[currency] }).click();
  }

  async clearFilters() {
    await this.clearFiltersButton.click();
  }

  async getInvoiceRow(invoiceNumber: string): Promise<Locator> {
    return this.invoicesTable.locator("tbody tr").filter({ hasText: invoiceNumber });
  }

  async downloadInvoicePDF(invoiceNumber: string) {
    const invoiceRow = await this.getInvoiceRow(invoiceNumber);
    const downloadButton = invoiceRow.locator('button[title="Pobierz PDF"]');

    const downloadPromise = this.page.waitForEvent("download");
    await downloadButton.click();
    return downloadPromise;
  }

  async editInvoice(invoiceNumber: string) {
    const invoiceRow = await this.getInvoiceRow(invoiceNumber);
    const editButton = invoiceRow.locator('button[title="Edytuj fakturę"]');
    await editButton.click();
  }

  async toggleInvoicePaidStatus(invoiceNumber: string) {
    const invoiceRow = await this.getInvoiceRow(invoiceNumber);
    const toggleButton = invoiceRow.locator('button[title*="Oznacz jako"]');
    await toggleButton.click();
  }

  async deleteInvoice(invoiceNumber: string) {
    const invoiceRow = await this.getInvoiceRow(invoiceNumber);
    const deleteButton = invoiceRow.locator('button[title="Usuń fakturę"]');
    await deleteButton.click();

    // Wait for delete dialog and confirm
    this.deleteDialog = this.page.locator('[role="dialog"]').filter({ hasText: "Potwierdź usunięcie" });
    this.deleteDialogTitle = this.deleteDialog.locator('[data-slot="dialog-title"]');
    this.deleteDialogDescription = this.deleteDialog.locator('[data-slot="dialog-description"]');
    this.deleteConfirmButton = this.deleteDialog.locator("button").filter({ hasText: "Usuń fakturę" });
    this.deleteCancelButton = this.deleteDialog.locator("button").filter({ hasText: "Anuluj" });

    await this.deleteConfirmButton.click();

    // Wait a bit for the mutation to process
    await this.page.waitForTimeout(1000);

    // Try to wait for success toast (but don't fail if it doesn't appear)
    try {
      await this.page.locator('[data-sonner-toast][data-type="success"]').waitFor({ state: "visible", timeout: 3000 });
    } catch {
      // Toast might appear and disappear quickly, that's ok
    }

    // Wait for dialog to actually disappear from DOM or be hidden
    await this.page.waitForSelector('[role="dialog"]', { state: "hidden", timeout: 30000 }).catch(async () => {
      // If still visible, try waiting for it to be detached
      await this.page.waitForSelector('[role="dialog"]', { state: "detached", timeout: 10000 });
    });
  }

  async goToNextPage() {
    if (await this.nextPageButton.isEnabled()) {
      await this.nextPageButton.click();
    }
  }

  async goToPreviousPage() {
    if (await this.previousPageButton.isEnabled()) {
      await this.previousPageButton.click();
    }
  }

  async getInvoicesCount(): Promise<number> {
    try {
      // Try using data-testid first
      const countText = await this.invoicesCount.textContent({ timeout: 3000 });
      const match = countText?.match(/Lista faktur \((\d+)\)/);
      if (match) return parseInt(match[1]);
    } catch {
      // Fallback: search by text content
      const fallbackLocator = this.page.locator("text=/Lista faktur \\((\\d+)\\)/");
      const countText = await fallbackLocator.textContent().catch(() => null);
      const match = countText?.match(/Lista faktur \((\d+)\)/);
      if (match) return parseInt(match[1]);
    }

    // If both fail, count table rows directly
    const rows = this.invoicesTable.locator("tbody tr");
    return await rows.count().catch(() => 0);
  }

  async isInvoiceVisible(invoiceNumber: string): Promise<boolean> {
    const invoiceRow = await this.getInvoiceRow(invoiceNumber);
    return invoiceRow.isVisible();
  }

  async getInvoiceStatus(invoiceNumber: string): Promise<string> {
    const invoiceRow = await this.getInvoiceRow(invoiceNumber);
    const statusCell = invoiceRow.locator("td").nth(4); // Status column
    const badge = statusCell.locator('[data-slot="badge"]');
    return (await badge.textContent())?.trim() || "";
  }

  async getInvoiceAmount(invoiceNumber: string): Promise<string> {
    const invoiceRow = await this.getInvoiceRow(invoiceNumber);
    const amountCell = invoiceRow.locator("td").nth(3); // Amount column
    return (await amountCell.textContent())?.trim() || "";
  }

  async getInvoiceClient(invoiceNumber: string): Promise<string> {
    const invoiceRow = await this.getInvoiceRow(invoiceNumber);
    const clientCell = invoiceRow.locator("td").nth(2); // Client column
    const clientName = clientCell.locator("div.font-medium");
    return (await clientName.textContent())?.trim() || "";
  }
}
