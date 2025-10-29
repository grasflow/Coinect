import type { Page, Locator } from "@playwright/test";

export class ClientsPage {
  readonly page: Page;

  // Main elements
  readonly pageHeading: Locator;
  readonly pageDescription: Locator;
  readonly addClientButton: Locator;
  readonly searchInput: Locator;
  readonly clientsTable: Locator;
  readonly clientsCount: Locator;
  readonly emptyState: Locator;

  // Client form dialog elements
  readonly clientFormDialog: Locator;
  readonly clientFormTitle: Locator;
  readonly clientNameInput: Locator;
  readonly clientTaxIdInput: Locator;
  readonly clientEmailInput: Locator;
  readonly clientPhoneInput: Locator;
  readonly clientStreetInput: Locator;
  readonly clientCityInput: Locator;
  readonly clientPostalCodeInput: Locator;
  readonly clientCountryInput: Locator;
  readonly clientCurrencySelect: Locator;
  readonly clientHourlyRateInput: Locator;
  readonly clientFormSubmitButton: Locator;
  readonly clientFormCancelButton: Locator;
  readonly gusLookupButton: Locator;

  // Delete dialog elements (not readonly - assigned dynamically in deleteClient method)
  deleteDialog!: Locator;
  deleteDialogTitle!: Locator;
  deleteDialogDescription!: Locator;
  deleteConfirmButton!: Locator;
  deleteCancelButton!: Locator;

  constructor(page: Page) {
    this.page = page;

    // Main elements
    this.pageHeading = page.locator("h1").filter({ hasText: "Klienci" });
    this.pageDescription = page.locator("p").filter({ hasText: "Zarządzaj swoimi klientami" });
    this.addClientButton = page.locator("button").filter({ hasText: "Dodaj klienta" }).first();
    this.searchInput = page.locator('input[placeholder="Szukaj klientów..."]');
    this.clientsTable = page.locator("table");
    this.clientsCount = page.locator("h2").filter({ hasText: /Lista klientów \(\d+\)/ });
    this.emptyState = page.locator("text=Brak klientów");

    // Client form dialog elements
    this.clientFormDialog = page.locator('[role="dialog"]');
    this.clientFormTitle = this.clientFormDialog.locator('[data-slot="dialog-title"]');
    this.clientNameInput = this.clientFormDialog.locator("#name");
    this.clientTaxIdInput = this.clientFormDialog.locator("#tax_id");
    this.clientEmailInput = this.clientFormDialog.locator("#email");
    this.clientPhoneInput = this.clientFormDialog.locator("#phone");
    this.clientStreetInput = this.clientFormDialog.locator("#street");
    this.clientCityInput = this.clientFormDialog.locator("#city");
    this.clientPostalCodeInput = this.clientFormDialog.locator("#postal_code");
    this.clientCountryInput = this.clientFormDialog.locator("#country");
    this.clientCurrencySelect = this.clientFormDialog.locator('[data-slot="select-trigger"]').first();
    this.clientHourlyRateInput = this.clientFormDialog.locator("#default_hourly_rate");
    this.clientFormSubmitButton = this.clientFormDialog.locator('button[type="submit"]');
    this.clientFormCancelButton = this.clientFormDialog.locator("button").filter({ hasText: "Anuluj" });
    this.gusLookupButton = this.clientFormDialog.locator('button[title="Pobierz dane z Białej Listy VAT"]');
  }

  async goto() {
    await this.page.goto("/clients");
  }

  async waitForPageLoad() {
    await this.pageHeading.waitFor({ state: "visible" });
  }

  async addClient(clientData: {
    name: string;
    taxId?: string;
    email?: string;
    phone?: string;
    street?: string;
    city?: string;
    postalCode?: string;
    country?: string;
    currency?: string;
    hourlyRate?: number;
  }) {
    await this.addClientButton.click();
    await this.clientFormDialog.waitFor({ state: "visible" });

    await this.clientNameInput.fill(clientData.name);

    if (clientData.taxId) {
      await this.clientTaxIdInput.fill(clientData.taxId);
    }

    if (clientData.email) {
      await this.clientEmailInput.fill(clientData.email);
    }

    if (clientData.phone) {
      await this.clientPhoneInput.fill(clientData.phone);
    }

    if (clientData.street) {
      await this.clientStreetInput.fill(clientData.street);
    }

    if (clientData.city) {
      await this.clientCityInput.fill(clientData.city);
    }

    if (clientData.postalCode) {
      await this.clientPostalCodeInput.fill(clientData.postalCode);
    }

    if (clientData.country) {
      await this.clientCountryInput.fill(clientData.country);
    }

    if (clientData.currency) {
      await this.clientCurrencySelect.click();
      await this.page.locator('[data-slot="select-item"]').filter({ hasText: clientData.currency }).click();
    }

    if (clientData.hourlyRate) {
      await this.clientHourlyRateInput.fill(clientData.hourlyRate.toString());
    }

    await this.clientFormSubmitButton.click();

    // Wait for either success (dialog closes) or error (error message appears)
    await Promise.race([
      this.clientFormDialog.waitFor({ state: "hidden", timeout: 10000 }),
      this.page
        .locator('[role="alert"], .text-destructive')
        .waitFor({ state: "visible", timeout: 10000 })
        .then(async () => {
          const errorText = await this.page.locator('[role="alert"], .text-destructive').textContent();
          throw new Error(`Form submission failed: ${errorText}`);
        }),
    ]);
  }

  async searchClients(searchTerm: string) {
    await this.searchInput.fill(searchTerm);
  }

  async getClientRow(clientName: string): Promise<Locator> {
    return this.clientsTable.locator("tbody tr").filter({ hasText: clientName });
  }

  async editClient(
    clientName: string,
    updatedData: Partial<{
      name: string;
      taxId?: string;
      email?: string;
      phone?: string;
      street?: string;
      city?: string;
      postalCode?: string;
      country?: string;
      currency?: string;
      hourlyRate?: number;
    }>
  ) {
    const clientRow = await this.getClientRow(clientName);

    // Upewnij się że wiersz klienta jest widoczny przed próbą kliknięcia
    await clientRow.waitFor({ state: "visible", timeout: 10000 });

    const editButton = clientRow
      .locator("button")
      .filter({ has: this.page.locator("svg") })
      .first();
    await editButton.click();

    await this.clientFormDialog.waitFor({ state: "visible" });

    if (updatedData.name) {
      await this.clientNameInput.fill(updatedData.name);
    }

    if (updatedData.taxId !== undefined) {
      await this.clientTaxIdInput.fill(updatedData.taxId || "");
    }

    if (updatedData.email !== undefined) {
      await this.clientEmailInput.fill(updatedData.email || "");
    }

    if (updatedData.phone !== undefined) {
      await this.clientPhoneInput.fill(updatedData.phone || "");
    }

    if (updatedData.street !== undefined) {
      await this.clientStreetInput.fill(updatedData.street || "");
    }

    if (updatedData.city !== undefined) {
      await this.clientCityInput.fill(updatedData.city || "");
    }

    if (updatedData.postalCode !== undefined) {
      await this.clientPostalCodeInput.fill(updatedData.postalCode || "");
    }

    if (updatedData.country !== undefined) {
      await this.clientCountryInput.fill(updatedData.country || "");
    }

    if (updatedData.currency) {
      await this.clientCurrencySelect.click();
      await this.page.locator('[data-slot="select-item"]').filter({ hasText: updatedData.currency }).click();
    }

    if (updatedData.hourlyRate !== undefined) {
      await this.clientHourlyRateInput.fill(updatedData.hourlyRate?.toString() || "");
    }

    await this.clientFormSubmitButton.click();

    // Wait for either success (dialog closes) or error (error message appears)
    await Promise.race([
      this.clientFormDialog.waitFor({ state: "hidden", timeout: 10000 }),
      this.page
        .locator('[role="alert"], .text-destructive')
        .waitFor({ state: "visible", timeout: 10000 })
        .then(async () => {
          const errorText = await this.page.locator('[role="alert"], .text-destructive').textContent();
          throw new Error(`Edit form submission failed: ${errorText}`);
        }),
    ]);
  }

  async deleteClient(clientName: string) {
    const clientRow = await this.getClientRow(clientName);
    const deleteButton = clientRow
      .locator("button")
      .filter({ has: this.page.locator("svg") })
      .last();
    await deleteButton.click();

    // Wait for delete dialog and confirm
    this.deleteDialog = this.page.locator('[role="dialog"]').filter({ hasText: "Usunąć klienta?" });
    this.deleteDialogTitle = this.deleteDialog.locator('[data-slot="dialog-title"]');
    this.deleteDialogDescription = this.deleteDialog.locator('[data-slot="dialog-description"]');
    // Find delete button by text (variant destructive, last button with "Usuń" text)
    this.deleteConfirmButton = this.deleteDialog.getByRole("button", { name: /^Usuń/ }).last();
    this.deleteCancelButton = this.deleteDialog.getByRole("button", { name: "Anuluj" }).last();

    // Wait for button to be visible and enabled
    await this.deleteConfirmButton.waitFor({ state: "visible", timeout: 5000 });

    // Debug: get all buttons in dialog
    const allButtons = await this.deleteDialog.locator("button").all();
    console.log("All buttons in dialog:", await Promise.all(allButtons.map((b) => b.textContent())));

    // Find the destructive button (red button with "Usuń" text)
    const destructiveButton = this.deleteDialog.locator("button").filter({ hasText: "Usuń" });

    // Click delete button with click options
    await destructiveButton.click({
      delay: 100,
    });

    // Wait for the client row to disappear from the table
    await Promise.race([
      clientRow.waitFor({ state: "detached", timeout: 15000 }),
      this.page
        .locator('[role="alert"], .text-destructive')
        .waitFor({ state: "visible", timeout: 15000 })
        .then(async () => {
          const errorText = await this.page.locator('[role="alert"], .text-destructive').textContent();
          throw new Error(`Delete failed: ${errorText}`);
        }),
    ]).catch(async (error) => {
      // If timeout, check if row still exists in DOM
      const stillExists = await clientRow.count();
      if (stillExists > 0) {
        console.log(
          "Client row still exists after timeout. Dialog state:",
          await this.deleteDialog.getAttribute("data-state")
        );
        throw error;
      }
      throw error;
    });
  }

  async lookupClientByNIP(nip: string) {
    await this.clientTaxIdInput.fill(nip);
    await this.gusLookupButton.click();
  }

  async getClientsCount(): Promise<number> {
    const countText = await this.clientsCount.textContent();
    const match = countText?.match(/Lista klientów \((\d+)\)/);
    return match ? parseInt(match[1]) : 0;
  }

  async isClientVisible(clientName: string): Promise<boolean> {
    const clientRow = await this.getClientRow(clientName);
    return clientRow.isVisible();
  }

  getClientLocator(clientName: string): Locator {
    return this.clientsTable.locator("tbody tr").filter({ hasText: clientName });
  }
}
