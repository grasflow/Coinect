import type { Page, Locator } from "@playwright/test";
import { expect } from "@playwright/test";

export class InvoiceGeneratorPage {
  readonly page: Page;

  // Main elements
  readonly pageTitle: Locator;
  readonly stepIndicator: Locator;
  readonly nextButton: Locator;
  readonly previousButton: Locator;
  readonly generateInvoiceButton: Locator;

  // Step 1: Client Selection
  readonly clientSelect: Locator;
  readonly invoiceModeTabs: Locator;
  readonly timeEntriesModeTab: Locator;
  readonly manualModeTab: Locator;

  // Step 2: Items Selection
  readonly timeEntriesSelector: Locator;
  readonly timeEntryCheckboxes: Locator;
  readonly manualItemsEditor: Locator;
  readonly addManualItemButton: Locator;

  // Step 3: Settings and Summary
  readonly issueDateInput: Locator;
  readonly saleDateInput: Locator;
  readonly vatRateInput: Locator;
  readonly summaryPanel: Locator;

  // Navigation and dialogs
  readonly backToInvoicesLink: Locator;
  readonly cancelButton: Locator;

  constructor(page: Page) {
    this.page = page;

    // Main elements
    this.pageTitle = page.locator("h1").filter({ hasText: "Nowa Faktura" });
    this.stepIndicator = page.locator("[data-step-indicator]");
    this.nextButton = page.locator("button").filter({ hasText: "Dalej" });
    this.previousButton = page.locator("button").filter({ hasText: "Wstecz" });
    this.generateInvoiceButton = page.locator("button").filter({ hasText: "Wygeneruj fakturę" });

    // Step 1: Client Selection
    this.clientSelect = page
      .locator('[data-testid="client-select"]')
      .or(page.locator('select, [role="combobox"]').first());
    this.invoiceModeTabs = page.locator('[role="tablist"]');
    this.timeEntriesModeTab = page.locator('[role="tab"]').filter({ hasText: "Z wpisów czasu" });
    this.manualModeTab = page.locator('[role="tab"]').filter({ hasText: "Faktura manualna" });

    // Step 2: Items Selection
    this.timeEntriesSelector = page.locator('[data-testid="time-entries-selector"]');
    this.timeEntryCheckboxes = page.locator('input[type="checkbox"][data-testid*="time-entry"]');
    this.manualItemsEditor = page.locator('[data-testid="manual-items-editor"]');
    this.addManualItemButton = page.locator("button").filter({ hasText: "Dodaj pozycję" });

    // Step 3: Settings and Summary
    this.issueDateInput = page.locator('input[type="date"]').first();
    this.saleDateInput = page.locator('input[type="date"]').last();
    this.vatRateInput = page.getByRole("combobox", { name: /Stawka VAT/i });
    this.summaryPanel = page.locator("text=Podsumowanie").first();

    // Navigation
    this.backToInvoicesLink = page.locator('a[href="/invoices"]');
    this.cancelButton = page.locator("button").filter({ hasText: "Anuluj" });
  }

  async goto() {
    await this.page.goto("/invoices/new");
  }

  async waitForPageLoad() {
    await this.pageTitle.waitFor({ state: "visible" });
    await this.invoiceModeTabs.waitFor({ state: "visible" });
    await this.clientSelect.waitFor({ state: "visible" });
  }

  async selectClient(clientName?: string) {
    // Wait for page to be fully loaded and hydrated
    await this.page.waitForLoadState("domcontentloaded");
    await this.page.waitForLoadState("networkidle");

    // Wait for loading skeleton to disappear - SelectTrigger appears when loading is done
    await this.page.waitForSelector('#client-select', { state: "attached", timeout: 15000 });

    // Wait for SelectTrigger with client-select id to be visible (more reliable than role="combobox")
    const clientSelect = this.page.locator('#client-select').first();
    await clientSelect.waitFor({ state: "visible", timeout: 10000 });

    // Wait until combobox is enabled - check multiple conditions
    await this.page.waitForFunction(
      () => {
        const trigger = document.querySelector('#client-select');
        if (!trigger) return false;
        
        // Check if disabled via attribute
        if (trigger.hasAttribute("disabled")) return false;
        
        // Check if disabled via aria-disabled
        const ariaDisabled = trigger.getAttribute("aria-disabled");
        if (ariaDisabled === "true") return false;
        
        // Check if disabled via data-disabled (Radix UI)
        if (trigger.hasAttribute("data-disabled")) return false;
        
        // Check if disabled via pointer-events or opacity (Radix UI adds these when disabled)
        const computedStyle = window.getComputedStyle(trigger);
        if (computedStyle.pointerEvents === "none") return false;
        if (computedStyle.opacity === "0.5" && computedStyle.cursor === "not-allowed") return false;
        
        return true;
      },
      { timeout: 20000 }
    );

    await clientSelect.click();

    // Wait for the dropdown to appear
    const listbox = this.page.locator('[role="listbox"]');
    await listbox.waitFor({ state: "visible" });

    // Wait for at least one option to be rendered (check both inside listbox and in portals)
    const optionLocator = this.page.getByRole("option");

    try {
      await optionLocator.first().waitFor({ state: "visible", timeout: 10000 });
    } catch (error) {
      // Check if there are any options at all (even if not visible)
      const optionCount = await optionLocator.count();

      throw new Error(
        `No client options found in dropdown. ` +
        `Options count: ${optionCount}. ` +
        `Ensure test data includes at least one client before running this test.`
      );
    }

    // If specific client provided, search for it; otherwise pick first
    let option;
    if (clientName) {
      // Try partial text match (case insensitive)
      option = this.page.getByRole("option", { name: new RegExp(clientName, "i") });

      // Fallback: if exact match not found, use first option
      const matchCount = await option.count();
      if (matchCount === 0) {
        console.warn(`Client "${clientName}" not found, selecting first available option`);
        option = this.page.getByRole("option").first();
      }
    } else {
      option = this.page.getByRole("option").first();
    }

    await option.click();
  }

  async selectInvoiceMode(mode: "time-entries" | "manual") {
    const tab = mode === "time-entries" ? this.timeEntriesModeTab : this.manualModeTab;

    // Ensure tabs container is loaded and tab is visible
    await this.invoiceModeTabs.waitFor({ state: "visible" });
    await tab.waitFor({ state: "visible" });

    // Click only if not already selected (Radix UI uses data-state instead of aria-selected)
    const isActive = await tab.getAttribute("data-state");
    if (isActive !== "active") {
      await tab.click();
    }
  }

  async selectTimeEntries(entryIds: string[]) {
    await this.page.locator("text=Wpisy czasu do zafakturowania").waitFor({ state: "visible" });

    // Check if there's an alert about no time entries
    const noEntriesAlert = this.page.locator("text=Brak niezafakturowanych wpisów czasu");
    const hasNoEntries = await noEntriesAlert.isVisible().catch(() => false);

    if (hasNoEntries) {
      throw new Error("Selected client has no unbilled time entries. Cannot proceed with time-entries mode.");
    }

    const allCheckboxes = this.page.locator('[role="checkbox"]');

    // Wait for checkboxes with a reasonable timeout
    await expect(allCheckboxes.first()).toBeVisible({ timeout: 5000 });

    const count = await allCheckboxes.count();

    for (let i = 1; i < Math.min(entryIds.length + 1, count); i++) {
      await allCheckboxes.nth(i).click();
    }
  }

  async addManualItem(description: string, quantity: number, unitPrice: number) {
    // Click "Dodaj pozycję" button
    await this.addManualItemButton.click();

    // Wait a bit for the new item to be added to the DOM
    await this.page.waitForTimeout(500);

    // Find the newly added item fields using the actual placeholders
    const descriptionInputs = this.page.locator('input[placeholder="np. Konsultacje IT"]');
    const quantityInputs = this.page.locator('input[type="number"][placeholder="1"]');
    const priceInputs = this.page.locator('input[type="number"][placeholder="100.00"]');

    const lastDescription = descriptionInputs.last();
    const lastQuantity = quantityInputs.last();
    const lastPrice = priceInputs.last();

    await lastDescription.fill(description);
    await lastQuantity.fill(quantity.toString());
    await lastPrice.fill(unitPrice.toString());
  }

  async setInvoiceDates(issueDate: string, saleDate: string) {
    await this.issueDateInput.fill(issueDate);
    await this.saleDateInput.fill(saleDate);
  }

  async setVatRate(vatRate: number) {
    await this.vatRateInput.waitFor({ state: "visible" });

    // Check if the value is already set
    const currentValue = await this.vatRateInput.textContent();
    if (currentValue?.includes(`${vatRate}%`)) {
      // Value already set, no need to change
      return;
    }

    // Click to open dropdown
    await this.vatRateInput.click();

    // Wait for listbox to be visible
    await this.page.locator('[role="listbox"]').waitFor({ state: "visible" });

    // Select the option with the vat rate value
    const option = this.page.getByRole("option", { name: `${vatRate}%` });
    await option.click();
  }

  async goToNextStep() {
    // Wait for button to be enabled (form validation passes)
    await this.nextButton.waitFor({ state: "visible" });
    await expect(this.nextButton).toBeEnabled({ timeout: 10000 });
    await this.nextButton.click();
  }

  async goToPreviousStep() {
    await this.previousButton.click();
  }

  async generateInvoice() {
    // Start waiting for navigation BEFORE clicking (prevents race conditions)
    const navigationPromise = this.page.waitForURL(/\/invoices$/, { timeout: 10000 });

    await this.generateInvoiceButton.click();

    // Wait for navigation to complete
    await navigationPromise;
  }

  async cancel() {
    await this.cancelButton.click();
  }

  async goBackToInvoices() {
    await this.backToInvoicesLink.click();
  }

  async getCurrentStep(): Promise<number> {
    // Check step-specific content in reverse order (most specific first)
    // This prevents false positives from elements still in DOM but hidden

    // Step 3: Generate button is unique to step 3
    const generateButton = await this.generateInvoiceButton.isVisible().catch(() => false);
    if (generateButton) {
      return 3;
    }

    // Step 2: Check for step 2 specific visible text
    const timeEntriesText = this.page.locator("text=Wpisy czasu do zafakturowania");
    const addItemButton = this.page.locator("button", { hasText: "Dodaj pozycję" });

    const isTimeEntriesVisible = await timeEntriesText.isVisible().catch(() => false);
    const isAddItemVisible = await addItemButton.isVisible().catch(() => false);

    if (isTimeEntriesVisible || isAddItemVisible) {
      return 2;
    }

    // Step 1: Default - client selection step
    return 1;
  }

  async waitForStep(step: number) {
    // Wait for step-specific elements to be visible
    switch (step) {
      case 1:
        await this.clientSelect.waitFor({ state: "visible" });
        break;
      case 2:
        // Wait for step 2 content - either time entries section OR manual items editor
        // Use waitFor with OR logic - at least one should be visible
        try {
          await this.page.locator("text=Wpisy czasu do zafakturowania").waitFor({ state: "visible", timeout: 5000 });
        } catch {
          // If time entries text not found, wait for manual items section
          await this.page.locator("text=Pozycje faktury").first().waitFor({ state: "visible" });
        }
        break;
      case 3:
        // Wait for generate button which is unique to step 3
        await this.generateInvoiceButton.waitFor({ state: "visible" });
        break;
    }
  }
}
