import type { Page, Locator } from "@playwright/test";
import { expect } from "@playwright/test";

export class TimeEntriesPage {
  readonly page: Page;

  // Main elements
  readonly pageHeading: Locator;
  readonly pageDescription: Locator;
  readonly addTimeEntryButton: Locator;
  readonly exportCsvButton: Locator;
  readonly timeEntriesTable: Locator;
  readonly timeEntriesCount: Locator;
  readonly emptyState: Locator;

  // Filters
  readonly clientFilter: Locator;
  readonly dateRangeFilter: Locator;
  readonly statusFilter: Locator;
  readonly clearFiltersButton: Locator;

  // Time entry form dialog elements
  readonly timeEntryFormDialog: Locator;
  readonly timeEntryFormTitle: Locator;
  readonly clientSelect: Locator;
  readonly datePicker: Locator;
  readonly hoursInput: Locator;
  readonly minutesInput: Locator;
  readonly hourlyRateInput: Locator;
  readonly currencySelect: Locator;
  readonly publicDescriptionTextarea: Locator;
  readonly privateNoteTextarea: Locator;
  readonly timeEntryFormSubmitButton: Locator;
  readonly timeEntryFormCancelButton: Locator;

  // Delete dialog elements (assigned dynamically in deleteTimeEntry method)
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
    this.pageHeading = page.locator("h1").filter({ hasText: "Wpisy Czasu" });
    this.pageDescription = page.locator("p").filter({ hasText: "Zarządzaj swoimi wpisami czasu pracy" });
    this.addTimeEntryButton = page.locator("button").filter({ hasText: "Dodaj wpis" });
    this.exportCsvButton = page.locator("button").filter({ hasText: "Eksportuj CSV" });
    this.timeEntriesTable = page.locator("table");
    this.timeEntriesCount = page.locator("h2").filter({ hasText: /Wpisy czasu \(\d+\)/ });
    this.emptyState = page.locator("text=Nie znaleziono wpisów czasu.");

    // Filters
    this.clientFilter = page.locator('[data-slot="select-trigger"]').first();
    this.dateRangeFilter = page.locator("button").filter({ hasText: /Wybierz zakres/ });
    this.statusFilter = page.locator('[data-slot="select-trigger"]').nth(1);
    this.clearFiltersButton = page.locator("button").filter({ hasText: "Wyczyść" });

    // Time entry form dialog elements
    this.timeEntryFormDialog = page.locator('[role="dialog"]');
    this.timeEntryFormTitle = this.timeEntryFormDialog.locator('[data-slot="dialog-title"]');
    this.clientSelect = this.timeEntryFormDialog
      .locator("#client_id")
      .locator("..")
      .locator('[data-slot="select-trigger"]');
    this.datePicker = this.timeEntryFormDialog.getByRole("button", { name: /Data/ });
    this.hoursInput = this.timeEntryFormDialog.locator("#hours");
    this.minutesInput = this.timeEntryFormDialog.locator("#minutes");
    this.hourlyRateInput = this.timeEntryFormDialog.locator("#hourly_rate");
    this.currencySelect = this.timeEntryFormDialog
      .locator("#currency")
      .locator("..")
      .locator('[data-slot="select-trigger"]');
    this.publicDescriptionTextarea = this.timeEntryFormDialog.locator("textarea").first();
    this.privateNoteTextarea = this.timeEntryFormDialog.locator("textarea").last();
    this.timeEntryFormSubmitButton = this.timeEntryFormDialog.locator('button[type="submit"]');
    this.timeEntryFormCancelButton = this.timeEntryFormDialog.locator("button").filter({ hasText: "Anuluj" });

    // Pagination
    this.previousPageButton = page.locator("button").filter({ hasText: "Poprzednia" });
    this.nextPageButton = page.locator("button").filter({ hasText: "Następna" });
    this.currentPageInfo = page.locator("div").filter({ hasText: /Strona \d+ z \d+/ });
  }

  async goto() {
    await this.page.goto("/time-entries");
  }

  async waitForPageLoad() {
    await this.pageHeading.waitFor({ state: "visible" });
  }

  async addTimeEntry(timeEntryData: {
    clientName: string;
    date: string;
    hours: number;
    minutes?: number;
    hourlyRate?: number;
    currency?: string;
    publicDescription?: string;
    privateNote?: string;
  }) {
    // Ensure page is fully loaded and React is hydrated
    await this.page.waitForLoadState("domcontentloaded");
    await this.page.waitForLoadState("networkidle", { timeout: 5000 }).catch(() => {
      // Continue if network doesn't go idle
    });

    // Wait for button to be ready and clickable
    await this.addTimeEntryButton.waitFor({ state: "visible", timeout: 5000 });
    await this.page.waitForTimeout(500);

    await this.addTimeEntryButton.click();
    // Wait for dialog to appear with increased timeout and better error handling
    await this.timeEntryFormDialog.waitFor({ state: "visible", timeout: 10000 });
    // Ensure dialog is fully rendered before interacting
    await this.page.waitForTimeout(300);

    // Select client
    await this.clientSelect.click();
    // Wait for dropdown to be visible
    await this.page.locator('[data-slot="select-content"]').waitFor({ state: "visible", timeout: 5000 });
    await this.page.locator('[data-slot="select-item"]').filter({ hasText: timeEntryData.clientName }).click();

    // Select date
    await this.datePicker.click();

    // Wait for calendar popover to appear
    const calendarPopover = this.page
      .locator('[data-slot="popover-content"]')
      .filter({ has: this.page.locator('[data-slot="calendar"]') });
    await calendarPopover.waitFor({ state: "visible", timeout: 10000 });

    // Wait a bit for calendar to fully render
    await this.page.waitForTimeout(300);

    // Click on the specific date - use data-day attribute
    const dateToSelect = new Date(timeEntryData.date);
    const dateString = dateToSelect.toLocaleDateString();

    // Try to find button by data-day attribute first
    const dayButton = calendarPopover.locator(`button[data-day="${dateString}"]`);
    const dayButtonCount = await dayButton.count();

    if (dayButtonCount > 0) {
      // First try without force to ensure event handlers fire
      try {
        await dayButton.first().click({ timeout: 2000 });
      } catch {
        // If that fails (element intercepted), use force as fallback
        await dayButton.first().click({ force: true });
      }
    } else {
      // Fallback: find by text content
      const day = dateToSelect.getDate().toString();
      const dayButtonFallback = calendarPopover
        .locator("button")
        .filter({ hasText: new RegExp(`^${day}$`) })
        .first();
      try {
        await dayButtonFallback.click({ timeout: 2000 });
      } catch {
        await dayButtonFallback.click({ force: true });
      }
    }

    // Wait for the calendar popover to close after date selection
    await calendarPopover.waitFor({ state: "hidden", timeout: 5000 }).catch(() => {
      // Popover might close quickly
    });

    // Give React Hook Form time to update validation state after date selection
    await this.page.waitForTimeout(500);

    // Fill hours (required field)
    await this.hoursInput.fill(timeEntryData.hours.toString());

    // Fill minutes if provided
    if (timeEntryData.minutes !== undefined) {
      await this.minutesInput.fill(timeEntryData.minutes.toString());
    }

    // Fill hourly rate if provided
    if (timeEntryData.hourlyRate !== undefined) {
      await this.hourlyRateInput.fill(timeEntryData.hourlyRate.toString());
    }

    // Select currency if provided
    if (timeEntryData.currency) {
      await this.currencySelect.click();
      // Wait for dropdown to be visible
      await this.page.locator('[data-slot="select-content"]').waitFor({ state: "visible", timeout: 5000 });
      await this.page.locator('[data-slot="select-item"]').filter({ hasText: timeEntryData.currency }).click();
    }

    // Fill descriptions if provided
    if (timeEntryData.publicDescription) {
      await this.publicDescriptionTextarea.fill(timeEntryData.publicDescription);
    }

    if (timeEntryData.privateNote) {
      await this.privateNoteTextarea.fill(timeEntryData.privateNote);
    }

    // Wait for form validation to complete and submit button to become enabled
    // The form uses react-hook-form with mode: 'all', so validation should update after all fields are filled
    await this.timeEntryFormSubmitButton.waitFor({ state: "visible", timeout: 5000 });

    // Try to wait for the button to become enabled, with a fallback if it doesn't
    try {
      await expect(this.timeEntryFormSubmitButton).toBeEnabled({ timeout: 10000 });
    } catch (_error) {
      // If button is still disabled, log the form state for debugging
      const dateValue = await this.datePicker.textContent();
      const clientValue = await this.clientSelect.textContent();
      const hoursValue = await this.hoursInput.inputValue();
      const errorMessages = await this.page.locator(".text-destructive").allTextContents();

      throw new Error(
        `Submit button is still disabled after filling form. ` +
          `Date: ${dateValue}, Client: ${clientValue}, Hours: ${hoursValue}, ` +
          `Validation errors: ${errorMessages.join(", ")}`
      );
    }

    await this.timeEntryFormSubmitButton.click();

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

    // Wait for React Query to refetch and update the table
    // We wait for network idle to ensure the refetch request has completed
    await this.page.waitForLoadState("networkidle", { timeout: 5000 }).catch(() => {
      // If network doesn't go idle, that's ok - continue anyway
    });
  }

  async editTimeEntry(
    date: string,
    clientName: string,
    updatedData: Partial<{
      date: string;
      hours: number;
      minutes: number;
      hourlyRate: number;
      currency: string;
      publicDescription: string;
      privateNote: string;
    }>
  ) {
    // Convert date from YYYY-MM-DD to Polish format (dd MMM yyyy)
    const dateObj = new Date(date);
    const displayDate = dateObj.toLocaleDateString("pl-PL", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });

    const timeEntryRow = this.timeEntriesTable
      .locator("tbody tr")
      .filter({
        hasText: displayDate,
      })
      .filter({ hasText: clientName });

    // Wait for the row to be visible
    await timeEntryRow.waitFor({ state: "visible", timeout: 10000 });

    // Find edit button - it has title="Edytuj" or is the first button in actions cell
    const editButton = timeEntryRow
      .getByRole("button", { name: /Edytuj/i })
      .or(timeEntryRow.locator("td").last().locator("button").first());
    await editButton.click();

    await this.timeEntryFormDialog.waitFor({ state: "visible" });

    // Update date if provided
    if (updatedData.date) {
      await this.datePicker.click();

      // Wait for calendar popover to appear
      const calendarPopover = this.page
        .locator('[data-slot="popover-content"]')
        .filter({ has: this.page.locator('[data-slot="calendar"]') });
      await calendarPopover.waitFor({ state: "visible", timeout: 10000 });

      // Wait a bit for calendar to fully render
      await this.page.waitForTimeout(300);

      // Click on the specific date - use data-day attribute
      const dateToSelect = new Date(updatedData.date);
      const dateString = dateToSelect.toLocaleDateString();

      // Try to find button by data-day attribute first
      const dayButton = calendarPopover.locator(`button[data-day="${dateString}"]`);
      const dayButtonCount = await dayButton.count();

      if (dayButtonCount > 0) {
        // Use force: true to bypass pointer-events interception from the parent dialog
        await dayButton.first().click({ force: true });
      } else {
        // Fallback: find by text content
        const day = dateToSelect.getDate().toString();
        await calendarPopover
          .locator("button")
          .filter({ hasText: new RegExp(`^${day}$`) })
          .first()
          .click({ force: true });
      }

      // Wait for the date validation error to disappear (if it exists)
      await this.page
        .locator("text=Data jest wymagana")
        .waitFor({ state: "hidden", timeout: 5000 })
        .catch(() => {
          // If error text doesn't exist or is already hidden, that's fine
        });
    }

    // Update hours if provided
    if (updatedData.hours !== undefined) {
      await this.hoursInput.fill(updatedData.hours.toString());
    }

    // Update minutes if provided
    if (updatedData.minutes !== undefined) {
      await this.minutesInput.fill(updatedData.minutes.toString());
    }

    // Update hourly rate if provided
    if (updatedData.hourlyRate !== undefined) {
      await this.hourlyRateInput.fill(updatedData.hourlyRate.toString());
    }

    // Update currency if provided
    if (updatedData.currency) {
      await this.currencySelect.click();
      // Wait for dropdown to be visible
      await this.page.locator('[data-slot="select-content"]').waitFor({ state: "visible", timeout: 5000 });
      await this.page.locator('[data-slot="select-item"]').filter({ hasText: updatedData.currency }).click();
    }

    // Update descriptions if provided
    if (updatedData.publicDescription !== undefined) {
      await this.publicDescriptionTextarea.fill(updatedData.publicDescription);
    }

    if (updatedData.privateNote !== undefined) {
      await this.privateNoteTextarea.fill(updatedData.privateNote);
    }

    await this.timeEntryFormSubmitButton.click();

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

    // Wait for React Query to refetch and update the table
    // We wait for network idle to ensure the refetch request has completed
    await this.page.waitForLoadState("networkidle", { timeout: 5000 }).catch(() => {
      // If network doesn't go idle, that's ok - continue anyway
    });
  }

  async deleteTimeEntry(date: string, clientName: string, description?: string) {
    // Convert date from YYYY-MM-DD to Polish format (dd MMM yyyy)
    const dateObj = new Date(date);
    const displayDate = dateObj.toLocaleDateString("pl-PL", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });

    let timeEntryRow = this.timeEntriesTable
      .locator("tbody tr")
      .filter({
        hasText: displayDate,
      })
      .filter({ hasText: clientName });

    // If description provided, use it to uniquely identify the row
    if (description) {
      timeEntryRow = timeEntryRow.filter({ hasText: description });
    }

    // Wait for the row to be visible
    await timeEntryRow.waitFor({ state: "visible", timeout: 10000 });

    // Find delete button - it has title="Usuń" or is the second button in actions cell
    const deleteButton = timeEntryRow
      .getByRole("button", { name: /Usuń/i })
      .or(timeEntryRow.locator("td").last().locator("button").last());
    await deleteButton.click();

    // Wait for delete dialog and confirm
    this.deleteDialog = this.page.locator('[role="dialog"]');
    await this.deleteDialog.waitFor({ state: "visible", timeout: 10000 });

    this.deleteDialogTitle = this.deleteDialog.locator('[data-slot="dialog-title"]');
    this.deleteDialogDescription = this.deleteDialog.locator('[data-slot="dialog-description"]');
    this.deleteConfirmButton = this.deleteDialog.locator("button").filter({ hasText: "Usuń" });
    this.deleteCancelButton = this.deleteDialog.locator("button").filter({ hasText: "Anuluj" });

    await this.deleteConfirmButton.click();

    // Wait for success toast to appear
    await this.page.locator('[data-sonner-toast][data-type="success"]').waitFor({ state: "visible", timeout: 5000 });

    // Wait for dialog to close
    await this.page.waitForFunction(
      () => {
        const dialog = document.querySelector('[role="dialog"]');
        return !dialog || getComputedStyle(dialog).display === "none" || !dialog.isConnected;
      },
      { timeout: 20000 }
    );

    // Wait for React Query to refetch and update the table
    // We wait for network idle to ensure the refetch request has completed
    await this.page.waitForLoadState("networkidle", { timeout: 5000 }).catch(() => {
      // If network doesn't go idle, that's ok - continue anyway
    });

    // Give React time to rerender the table after refetch
    await this.page.waitForTimeout(1000);
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

  async filterByStatus(status: "all" | "billed" | "unbilled") {
    const statusText = {
      all: "Wszystkie",
      billed: "Zafakturowane",
      unbilled: "Niezafakturowane",
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

  async clearFilters() {
    await this.clearFiltersButton.click();
  }

  async exportToCsv() {
    // Wait for the page to be fully loaded and React to hydrate
    await this.page.waitForLoadState("networkidle", { timeout: 10000 }).catch(() => {
      // Continue if network doesn't go idle
    });

    // Ensure button is visible and clickable
    await this.exportCsvButton.waitFor({ state: "visible", timeout: 5000 });

    // Set up response listener BEFORE clicking to avoid race condition
    const [response] = await Promise.all([
      this.page.waitForResponse((response) => response.url().includes("/api/time-entries/export"), { timeout: 30000 }),
      this.exportCsvButton.click(),
    ]);

    if (!response.ok()) {
      const body = await response.text();
      throw new Error(`Export failed with status ${response.status()}: ${body}`);
    }

    // Wait for the success toast
    await this.page.locator('[data-sonner-toast][data-type="success"]').waitFor({ state: "visible", timeout: 5000 });

    // Return a mock download object that matches Playwright's Download interface
    return {
      suggestedFilename: () => {
        // Extract filename from Content-Disposition header or use default
        const contentDisposition = response.headers()["content-disposition"];
        if (contentDisposition) {
          const match = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
          if (match && match[1]) {
            return match[1].replace(/['"]/g, "");
          }
        }
        return `wpisy-czasu_${new Date().toISOString().split("T")[0]}.csv`;
      },
    };
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

  async getTimeEntriesCount(): Promise<number> {
    const countText = await this.timeEntriesCount.textContent();
    const match = countText?.match(/Wpisy czasu \((\d+)\)/);
    return match ? parseInt(match[1]) : 0;
  }

  async isTimeEntryVisible(date: string, clientName: string, description?: string): Promise<boolean> {
    // Convert date from YYYY-MM-DD to Polish format (dd MMM yyyy)
    // The table displays dates using date-fns format with Polish locale
    const dateObj = new Date(date);
    const displayDate = dateObj.toLocaleDateString("pl-PL", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });

    let timeEntryRow = this.timeEntriesTable
      .locator("tbody tr")
      .filter({
        hasText: displayDate,
      })
      .filter({ hasText: clientName });

    // If description provided, use it to uniquely identify the row
    if (description) {
      timeEntryRow = timeEntryRow.filter({ hasText: description });
    }

    try {
      // Wait for the row to appear in the table (with timeout)
      await timeEntryRow.waitFor({ state: "visible", timeout: 10000 });
      return true;
    } catch {
      // If timeout, check if it's actually visible (edge case)
      return timeEntryRow.isVisible();
    }
  }

  async getTimeEntryStatus(date: string, clientName: string): Promise<string> {
    // Convert date from YYYY-MM-DD to Polish format (dd MMM yyyy)
    const dateObj = new Date(date);
    const displayDate = dateObj.toLocaleDateString("pl-PL", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });

    const timeEntryRow = this.timeEntriesTable
      .locator("tbody tr")
      .filter({
        hasText: displayDate,
      })
      .filter({ hasText: clientName });

    const statusCell = timeEntryRow.locator("td").nth(6); // Status column
    return (await statusCell.textContent())?.trim() || "";
  }
}
