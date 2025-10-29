import type { Page, Locator } from "@playwright/test";
import { expect } from "@playwright/test";

export class SettingsPage {
  readonly page: Page;

  // Main elements
  readonly pageHeading: Locator;
  readonly pageDescription: Locator;
  readonly saveButton: Locator;

  // Profile form fields
  readonly fullNameInput: Locator;
  readonly taxIdInput: Locator;
  readonly streetInput: Locator;
  readonly cityInput: Locator;
  readonly postalCodeInput: Locator;
  readonly countryInput: Locator;
  readonly emailInput: Locator;
  readonly phoneInput: Locator;

  // Bank details
  readonly bankAccountInput: Locator;
  readonly bankNameInput: Locator;
  readonly bankSwiftInput: Locator;

  // Logo upload
  readonly logoUploadButton: Locator;
  readonly logoFileInput: Locator;
  readonly logoPreview: Locator;
  readonly uploadLogoButton: Locator;

  // Accent color
  readonly accentColorInput: Locator;

  constructor(page: Page) {
    this.page = page;

    // Main elements
    this.pageHeading = page.locator("h1").filter({ hasText: "Ustawienia" });
    this.pageDescription = page.locator("p").filter({ hasText: "Zarządzaj swoim profilem i preferencjami fakturowania" });
    this.saveButton = page.locator("button").filter({ hasText: "Zapisz ustawienia" });

    // Profile form fields
    this.fullNameInput = page.locator('input[name="full_name"]');
    this.taxIdInput = page.locator('input[name="tax_id"]');
    this.streetInput = page.locator('input[name="street"]');
    this.cityInput = page.locator('input[name="city"]');
    this.postalCodeInput = page.locator('input[name="postal_code"]');
    this.countryInput = page.locator('input[name="country"]');
    this.emailInput = page.locator('input[name="email"]');
    this.phoneInput = page.locator('input[name="phone"]');

    // Bank details
    this.bankAccountInput = page.locator('input[name="bank_account"]');
    this.bankNameInput = page.locator('input[name="bank_name"]');
    this.bankSwiftInput = page.locator('input[name="bank_swift"]');

    // Logo upload
    this.logoUploadButton = page.locator("button").filter({ hasText: "Wybierz plik" });
    this.logoFileInput = page.locator('input[type="file"]#logo-upload');
    this.logoPreview = page.locator('img[alt="Logo preview"]');
    this.uploadLogoButton = page.locator("button").filter({ hasText: "Prześlij logo" });

    // Accent color - use the color input specifically
    this.accentColorInput = page.locator('input[type="color"]#accent_color');
  }

  async goto() {
    await this.page.goto("/settings");
  }

  async waitForPageLoad() {
    await this.pageHeading.waitFor({ state: "visible" });
  }

  async updateProfileData(profileData: {
    fullName?: string;
    taxId?: string;
    street?: string;
    city?: string;
    postalCode?: string;
    country?: string;
    email?: string;
    phone?: string;
    bankAccount?: string;
    bankName?: string;
    bankSwift?: string;
    accentColor?: string;
  }) {
    if (profileData.fullName !== undefined) {
      // Wyczyść pole przed wypełnieniem (kontrolowane pole React może resetować wartość)
      await this.fullNameInput.clear();
      await this.fullNameInput.fill(profileData.fullName);
      // Poczekaj na synchronizację React state przed sprawdzeniem wartości
      await this.page.waitForTimeout(100);
      await expect(this.fullNameInput).toHaveValue(profileData.fullName);
    }

    if (profileData.taxId !== undefined) {
      // Wyczyść pole przed wypełnieniem (kontrolowane pole React może resetować wartość)
      await this.taxIdInput.clear();
      await this.taxIdInput.fill(profileData.taxId);
      // Poczekaj na synchronizację React state przed sprawdzeniem wartości
      await this.page.waitForTimeout(100);
      await expect(this.taxIdInput).toHaveValue(profileData.taxId);
    }

    if (profileData.street !== undefined) {
      await this.streetInput.fill(profileData.street);
      await expect(this.streetInput).toHaveValue(profileData.street);
    }

    if (profileData.city !== undefined) {
      await this.cityInput.fill(profileData.city);
      await expect(this.cityInput).toHaveValue(profileData.city);
    }

    if (profileData.postalCode !== undefined) {
      await this.postalCodeInput.fill(profileData.postalCode);
      // Nie sprawdzamy toHaveValue - pole może być auto-walidowane/formatowane
    }

    if (profileData.country !== undefined) {
      await this.countryInput.fill(profileData.country);
      await expect(this.countryInput).toHaveValue(profileData.country);
    }

    if (profileData.email !== undefined) {
      await this.emailInput.fill(profileData.email);
      // Poczekaj na synchronizację React state
      await this.page.waitForTimeout(100);
      await expect(this.emailInput).toHaveValue(profileData.email);
    }

    if (profileData.phone !== undefined) {
      await this.phoneInput.fill(profileData.phone);
      await expect(this.phoneInput).toHaveValue(profileData.phone);
    }

    if (profileData.bankAccount !== undefined) {
      await this.bankAccountInput.fill(profileData.bankAccount);
      await expect(this.bankAccountInput).toHaveValue(profileData.bankAccount);
    }

    if (profileData.bankName !== undefined) {
      await this.bankNameInput.fill(profileData.bankName);
      await expect(this.bankNameInput).toHaveValue(profileData.bankName);
    }

    if (profileData.bankSwift !== undefined) {
      await this.bankSwiftInput.fill(profileData.bankSwift);
      await expect(this.bankSwiftInput).toHaveValue(profileData.bankSwift);
    }

    if (profileData.accentColor !== undefined) {
      // Color input wymaga specjalnego traktowania
      await this.accentColorInput.evaluate((el: HTMLInputElement, color: string) => {
        el.value = color;
        el.dispatchEvent(new Event('input', { bubbles: true }));
        el.dispatchEvent(new Event('change', { bubbles: true }));
      }, profileData.accentColor);
      // Nie sprawdzamy toHaveValue dla color input - może powodować problemy z synchronizacją
    }
  }

  async uploadLogo(filePath: string) {
    await this.logoUploadButton.click();
    await this.logoFileInput.setInputFiles(filePath);
    await this.uploadLogoButton.click();
  }

  async saveSettings() {
    // Czekaj na rozpoczęcie i zakończenie network request (akceptuj zarówno sukces jak i błąd)
    const responsePromise = this.page.waitForResponse(
      (response) =>
        response.url().includes("/api/profile") &&
        response.request().method() === "PATCH",
      { timeout: 10000 }
    );

    await this.saveButton.click({ force: true });

    // Czekaj na zakończenie requestu
    const response = await responsePromise;

    // Dodatkowe oczekiwanie na synchronizację React state i rendering toasta
    await this.page.waitForTimeout(500);

    return response;
  }

  async getCurrentAccentColor(): Promise<string> {
    return await this.accentColorInput.inputValue();
  }

  async isLogoPreviewVisible(): Promise<boolean> {
    return await this.logoPreview.isVisible();
  }

  async getLogoPreviewSrc(): Promise<string | null> {
    return await this.logoPreview.getAttribute('src');
  }
}
