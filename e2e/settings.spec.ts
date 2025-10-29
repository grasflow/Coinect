import { test, expect } from "./fixtures/data.fixture";
import { SettingsPage } from "./pages/settings.page";
import { waitForToast } from "./utils/test-helpers";

test.describe("Ustawienia profilu", () => {
  // Uruchom testy sekwencyjnie aby uniknąć race conditions przy zapisie danych profilu
  test.describe.configure({ mode: "serial" });
  test("wyświetla stronę ustawień", async ({ authenticatedPage }) => {
    const settingsPage = new SettingsPage(authenticatedPage);
    await settingsPage.goto();
    await settingsPage.waitForPageLoad();

    await expect(settingsPage.pageHeading).toBeVisible();
    await expect(settingsPage.pageDescription).toBeVisible();
    await expect(settingsPage.saveButton).toBeVisible();
  });

  test("aktualizuje dane profilu", async ({ authenticatedPage }) => {
    const settingsPage = new SettingsPage(authenticatedPage);
    await settingsPage.goto();
    await settingsPage.waitForPageLoad();
    // Upewnij się, że formularz został zainicjalizowany danymi profilu z API
    await expect(settingsPage.fullNameInput).not.toHaveValue("");

    const profileData = {
      fullName: "Jan Kowalski",
      taxId: "1234567890", // 10 cyfr (nie 11!)
      street: "Testowa 123",
      city: "Warszawa",
      postalCode: "00-001",
      country: "Polska",
      email: "jan.kowalski@example.com",
      phone: "+48123456789",
    };

    await settingsPage.updateProfileData(profileData);
    await settingsPage.saveSettings();

    // Sprawdź komunikat sukcesu - użyj pełnego tekstu
    await waitForToast(authenticatedPage, "Ustawienia zostały zapisane");
  });

  test("aktualizuje dane bankowe", async ({ authenticatedPage }) => {
    const settingsPage = new SettingsPage(authenticatedPage);
    await settingsPage.goto();
    await settingsPage.waitForPageLoad();

    const bankData = {
      bankAccount: "12 3456 7890 1234 5678 9012 3456",
      bankName: "Bank Testowy S.A.",
      bankSwift: "TESTPLPW",
    };

    await settingsPage.updateProfileData(bankData);
    await settingsPage.saveSettings();

    // Sprawdź komunikat sukcesu - zwiększony timeout
    await waitForToast(authenticatedPage, "Ustawienia zostały zapisane", 10000);
  });

  test("zmienia kolor akcentu", async ({ authenticatedPage }) => {
    const settingsPage = new SettingsPage(authenticatedPage);
    await settingsPage.goto();
    await settingsPage.waitForPageLoad();

    // Zapisz aktualny kolor
    const originalColor = await settingsPage.getCurrentAccentColor();

    // Zmień kolor na inny
    const newColor = "#FF6B6B"; // Czerwony
    await settingsPage.updateProfileData({ accentColor: newColor });
    await settingsPage.saveSettings();

    // Sprawdź komunikat sukcesu
    await waitForToast(authenticatedPage, "Ustawienia zostały zapisane");

    // Odśwież stronę i sprawdź czy kolor został zapisany
    await authenticatedPage.reload();
    await settingsPage.waitForPageLoad();

    const savedColor = await settingsPage.getCurrentAccentColor();
    expect(savedColor.toLowerCase()).toBe(newColor.toLowerCase());

    // Przywróć oryginalny kolor
    await settingsPage.updateProfileData({ accentColor: originalColor });
    await settingsPage.saveSettings();
    await waitForToast(authenticatedPage, "Ustawienia zostały zapisane");
  });

  test("uploaduje logo", async ({ authenticatedPage }) => {
    const settingsPage = new SettingsPage(authenticatedPage);
    await settingsPage.goto();
    await settingsPage.waitForPageLoad();

    await settingsPage.logoUploadButton.waitFor({ state: "visible" });

    // Kliknij przycisk upload - użyj force jeśli overlay blokuje
    await settingsPage.logoUploadButton.click({ force: true });

    // Załaduj plik testowy
    await settingsPage.logoFileInput.setInputFiles("e2e/fixtures/test-logo.png");

    // Czekaj na network request i kliknij przycisk "Prześlij logo"
    const responsePromise = authenticatedPage.waitForResponse(
      (response) => response.url().includes("/api/profile/upload-logo") && response.request().method() === "POST",
      { timeout: 10000 }
    );

    await settingsPage.uploadLogoButton.click({ force: true });

    // Poczekaj na zakończenie uploadu
    await responsePromise;

    // Sprawdź komunikat sukcesu
    await waitForToast(authenticatedPage, "Logo zostało przesłane");

    // Sprawdź czy podgląd logo jest widoczny
    await expect(settingsPage.logoPreview).toBeVisible();
  });

  test("waliduje NIP", async ({ authenticatedPage }) => {
    const settingsPage = new SettingsPage(authenticatedPage);
    await settingsPage.goto();
    await settingsPage.waitForPageLoad();

    // Wprowadź nieprawidłowy NIP (za krótki)
    await settingsPage.updateProfileData({ taxId: "12345" });
    await settingsPage.saveSettings();

    // Sprawdź błąd walidacji
    await waitForToast(authenticatedPage, "NIP musi składać się z 10 cyfr");

    // Czekaj na zniknięcie toast z błędem
    await expect(authenticatedPage.locator("[data-sonner-toast]")).toHaveCount(0, { timeout: 10000 });

    // Wprowadź prawidłowy NIP
    await settingsPage.updateProfileData({ taxId: "1234567890" });
    await settingsPage.saveSettings();

    // Sprawdź sukces
    await waitForToast(authenticatedPage, "Ustawienia zostały zapisane");
  });

  test("waliduje email", async ({ authenticatedPage }) => {
    const settingsPage = new SettingsPage(authenticatedPage);
    await settingsPage.goto();
    await settingsPage.waitForPageLoad();

    // Wprowadź nieprawidłowy email
    await settingsPage.updateProfileData({ email: "invalid-email" });
    await settingsPage.saveSettings();

    // Sprawdź błąd walidacji
    await waitForToast(authenticatedPage, "Nieprawidłowy format email");

    // Wprowadź prawidłowy email
    await settingsPage.updateProfileData({ email: "valid@example.com" });
    await settingsPage.saveSettings();

    // Sprawdź sukces
    await waitForToast(authenticatedPage, "Ustawienia zostały zapisane");
  });

  test("waliduje kod pocztowy", async ({ authenticatedPage }) => {
    const settingsPage = new SettingsPage(authenticatedPage);
    await settingsPage.goto();
    await settingsPage.waitForPageLoad();

    // Wprowadź nieprawidłowy kod pocztowy
    await settingsPage.postalCodeInput.clear();
    await settingsPage.postalCodeInput.fill("invalid");

    // Czekaj na zakończenie network request (który powinien zwrócić błąd)
    const errorResponsePromise = authenticatedPage.waitForResponse(
      (response) => response.url().includes("/api/profile") && response.status() === 400,
      { timeout: 10000 }
    );

    await settingsPage.saveButton.click({ force: true });
    await errorResponsePromise;

    // Sprawdź błąd walidacji - zwiększ timeout
    await waitForToast(authenticatedPage, "Kod pocztowy musi być w formacie XX-XXX", 10000);

    // Czekaj na zniknięcie toasta z błędem
    await expect(authenticatedPage.locator("[data-sonner-toast]")).toHaveCount(0, { timeout: 10000 });

    // Wprowadź prawidłowy kod pocztowy
    await settingsPage.postalCodeInput.clear();
    await settingsPage.postalCodeInput.fill("00-001");
    await settingsPage.saveSettings();

    // Sprawdź sukces
    await waitForToast(authenticatedPage, "Ustawienia zostały zapisane");
  });

  test("zachowuje dane przy odświeżeniu strony", async ({ authenticatedPage }) => {
    const settingsPage = new SettingsPage(authenticatedPage);
    await settingsPage.goto();
    await settingsPage.waitForPageLoad();

    // Ustaw znany stan początkowy (izolacja od innych testów)
    await settingsPage.updateProfileData({ fullName: "Initial State", city: "Initial City" });
    await expect(settingsPage.fullNameInput).toHaveValue("Initial State");
    await settingsPage.saveSettings();
    await waitForToast(authenticatedPage, "Ustawienia zostały zapisane");

    // Czekaj aż toast zniknie i formularz będzie stabilny
    await expect(authenticatedPage.locator("[data-sonner-toast]")).toHaveCount(0, { timeout: 10000 });
    await expect(settingsPage.fullNameInput).toHaveValue("Initial State");
    await expect(settingsPage.cityInput).toHaveValue("Initial City");

    // Teraz testuj właściwe zachowanie - zapisz nowe dane
    await settingsPage.updateProfileData({ fullName: "Test User", city: "Test City" });
    await expect(settingsPage.fullNameInput).toHaveValue("Test User");
    await expect(settingsPage.cityInput).toHaveValue("Test City");
    await settingsPage.saveSettings();
    await waitForToast(authenticatedPage, "Ustawienia zostały zapisane");

    // Czekaj aż toast zniknie przed reload
    await expect(authenticatedPage.locator("[data-sonner-toast]")).toHaveCount(0, { timeout: 10000 });

    // Dodatkowe oczekiwanie aby upewnić się, że dane są zapisane w bazie
    // Sprawdź, że dane są nadal widoczne (weryfikuje że zapis się zakończył)
    await expect(settingsPage.fullNameInput).toHaveValue("Test User", { timeout: 5000 });
    await expect(settingsPage.cityInput).toHaveValue("Test City", { timeout: 5000 });

    // Dodaj krótkie opóźnienie aby dać czas backendowi na zapis
    await authenticatedPage.waitForTimeout(500);

    // Odśwież stronę
    await authenticatedPage.reload();
    await settingsPage.waitForPageLoad();

    // Sprawdź czy dane zostały zachowane - toHaveValue ma wbudowany auto-retry
    await expect(settingsPage.fullNameInput).toHaveValue("Test User");
    await expect(settingsPage.cityInput).toHaveValue("Test City");
  });

  test("anuluje zmiany bez zapisywania", async ({ authenticatedPage }) => {
    const settingsPage = new SettingsPage(authenticatedPage);
    await settingsPage.goto();
    await settingsPage.waitForPageLoad();

    // Ustaw znaną wartość bazową dla tego testu (izolacja od innych testów)
    const baselineName = `Baseline Test ${Date.now()}`;
    await settingsPage.updateProfileData({ fullName: baselineName });
    await settingsPage.saveSettings();
    await waitForToast(authenticatedPage, "Ustawienia zostały zapisane");

    // Czekaj aż toast zniknie
    await expect(authenticatedPage.locator("[data-sonner-toast]")).toHaveCount(0, { timeout: 10000 });

    // Upewnij się że wartość została zapisana
    await expect(settingsPage.fullNameInput).toHaveValue(baselineName);

    // Wprowadź zmiany (nie zapisuj)
    const changedName = `Zmieniona Nazwa ${Date.now()}`;
    await settingsPage.updateProfileData({ fullName: changedName });

    // Upewnij się, że wartość została zmieniona w UI
    await expect(settingsPage.fullNameInput).toHaveValue(changedName);

    // Odśwież stronę bez zapisywania
    await authenticatedPage.reload();
    await settingsPage.waitForPageLoad();

    // Użyj toHaveValue z auto-retry - zmiany powinny zostać anulowane
    await expect(settingsPage.fullNameInput).toHaveValue(baselineName);
  });

  test("wyświetla komunikaty o błędach walidacji", async ({ authenticatedPage }) => {
    const settingsPage = new SettingsPage(authenticatedPage);
    await settingsPage.goto();
    await settingsPage.waitForPageLoad();

    // Wprowadź bardzo długi string aby wywołać błąd walidacji (max 255)
    const longString = "a".repeat(300);
    await settingsPage.updateProfileData({ fullName: longString });
    await settingsPage.saveSettings();

    // Sprawdź czy wyświetlany jest toast z błędem walidacji
    await waitForToast(authenticatedPage, "nie może przekraczać", 5000);
  });
});
