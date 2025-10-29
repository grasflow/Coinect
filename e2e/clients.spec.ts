import { test, expect } from "./fixtures/data.fixture";
import { ClientsPage } from "./pages/clients.page";
import { waitForToast } from "./utils/test-helpers";

test.describe("Zarządzanie klientami", () => {
  test("wyświetla stronę klientów", async ({ authenticatedPage }) => {
    const clientsPage = new ClientsPage(authenticatedPage);
    await clientsPage.goto();
    await clientsPage.waitForPageLoad();

    await expect(clientsPage.pageHeading).toBeVisible();
    await expect(clientsPage.pageDescription).toBeVisible();
    await expect(clientsPage.addClientButton).toBeVisible();
  });

  test("dodaje nowego klienta", async ({ authenticatedPage }) => {
    const clientsPage = new ClientsPage(authenticatedPage);
    await clientsPage.goto();
    await clientsPage.waitForPageLoad();

    const uniqueId = `${Date.now()}-${Math.random().toString(36).substring(7)}`;
    const clientData = {
      name: `Testowa Firma ${uniqueId}`,
      taxId: "1234567890",
      email: `kontakt-${uniqueId}@testowa.pl`,
      phone: "+48123456789",
      street: "Testowa 123",
      city: "Warszawa",
      postalCode: "00-001",
      country: "Polska",
      currency: "PLN",
      hourlyRate: 150,
    };

    await clientsPage.addClient(clientData);

    // Sprawdź czy klient został dodany
    await waitForToast(authenticatedPage, "Klient został dodany pomyślnie");

    // Weryfikacja przez API - bardziej niezawodne niż czekanie na UI
    const response = await authenticatedPage.request.get("/api/clients");
    expect(response.ok()).toBeTruthy();
    const clients = await response.json();

    // Znajdź nowo utworzonego klienta w odpowiedzi API
    const createdClient = clients.find((c: any) => c.name === clientData.name);
    expect(createdClient).toBeDefined();
    expect(createdClient.email).toBe(clientData.email);

    // Opcjonalnie: sprawdź też UI (może być pomocne do weryfikacji integracji)
    await clientsPage.searchClients(clientData.name);
    await expect(clientsPage.getClientLocator(clientData.name)).toBeVisible({ timeout: 5000 });
  });

  test("edytuje istniejącego klienta", async ({ authenticatedPage }) => {
    const clientsPage = new ClientsPage(authenticatedPage);
    await clientsPage.goto();
    await clientsPage.waitForPageLoad();

    // Stwórz klienta bezpośrednio w teście dla większej niezależności
    const uniqueId = `${Date.now()}-${Math.random().toString(36).substring(7)}`;
    const originalClientData = {
      name: `Klient Do Edycji ${uniqueId}`,
      email: `edycja-${uniqueId}@test.pl`,
      taxId: "1234567890",
      hourlyRate: 150,
      city: "Warszawa",
      postalCode: "00-001",
    };

    // Dodaj klienta
    await clientsPage.addClient(originalClientData);
    await waitForToast(authenticatedPage, "Klient został dodany pomyślnie");

    // Poczekaj na odświeżenie listy klientów (React Query refetch)
    await authenticatedPage.waitForLoadState("networkidle");

    // Wyszukaj nowo dodanego klienta aby był widoczny w tabeli
    await clientsPage.searchClients(originalClientData.name);

    // Poczekaj aż lista zostanie przefiltrowana i będzie zawierała co najmniej 1 klienta
    await expect(clientsPage.clientsCount).toContainText(/Lista klientów \([1-9]\d*\)/, { timeout: 10000 });

    // Zweryfikuj że klient istnieje
    await expect(clientsPage.getClientLocator(originalClientData.name)).toBeVisible();

    // Teraz edytuj klienta - NIE zmieniaj nazwy aby uniknąć problemów z szukaniem
    const updatedData = {
      email: `zaktualizowany-${uniqueId}@email.pl`,
      hourlyRate: 250,
    };

    await clientsPage.editClient(originalClientData.name, updatedData);

    // Sprawdź czy klient został zaktualizowany
    await waitForToast(authenticatedPage, "został zaktualizowany");

    // Reload strony aby upewnić się że dane są świeże
    await clientsPage.goto();
    await clientsPage.waitForPageLoad();
    await authenticatedPage.waitForLoadState("networkidle");

    // Wyszukaj klienta ponownie po przeładowaniu strony
    await clientsPage.searchClients(originalClientData.name);

    // Poczekaj aż lista zostanie przefiltrowana i będzie zawierała co najmniej 1 klienta
    await expect(clientsPage.clientsCount).toContainText(/Lista klientów \([1-9]\d*\)/, { timeout: 10000 });

    // Sprawdź czy klient nadal istnieje (ta sama nazwa)
    const clientLocator = clientsPage.getClientLocator(originalClientData.name);
    await expect(clientLocator).toBeVisible();

    // Sprawdź czy email został zaktualizowany (opcjonalne - można pominąć jeśli trudne)
    await expect(clientLocator).toContainText(updatedData.email);
  });

  test("usuwa klienta", async ({ authenticatedPage }) => {
    // Najpierw dodaj klienta do usunięcia
    const clientsPage = new ClientsPage(authenticatedPage);
    await clientsPage.goto();
    await clientsPage.waitForPageLoad();

    const uniqueId = `${Date.now()}-${Math.random().toString(36).substring(7)}`;
    const clientData = {
      name: `Klient Do Usunięcia ${uniqueId}`,
      taxId: "9876543210",
      email: `delete-${uniqueId}@test.pl`,
    };

    await clientsPage.addClient(clientData);
    await waitForToast(authenticatedPage, "Klient został dodany pomyślnie");

    // Poczekaj na odświeżenie listy klientów (React Query refetch)
    await authenticatedPage.waitForLoadState("networkidle");

    // Wyszukaj klienta aby był widoczny w tabeli
    await clientsPage.searchClients(clientData.name);

    // Poczekaj aż lista zostanie przefiltrowana i będzie zawierała co najmniej 1 klienta
    await expect(clientsPage.clientsCount).toContainText(/Lista klientów \([1-9]\d*\)/, { timeout: 10000 });

    // Teraz usuń klienta
    await clientsPage.deleteClient(clientData.name);

    // Sprawdź czy klient został usunięty
    await waitForToast(authenticatedPage, "Klient został usunięty");
    await expect(clientsPage.getClientLocator(clientData.name)).not.toBeVisible();
  });

  test("wyszukuje klientów", async ({ authenticatedPage }) => {
    const clientsPage = new ClientsPage(authenticatedPage);
    await clientsPage.goto();
    await clientsPage.waitForPageLoad();

    // Generate unique client names to avoid conflicts with existing data
    const uniqueId = `${Date.now()}-${Math.random().toString(36).substring(7)}`;

    // Dodaj kilku klientów do wyszukania
    const client1 = {
      name: `Firma Alfa ${uniqueId}`,
      email: `alfa-${uniqueId}@test.pl`,
    };

    const client2 = {
      name: `Firma Beta ${uniqueId}`,
      email: `beta-${uniqueId}@test.pl`,
    };

    await clientsPage.addClient(client1);
    await waitForToast(authenticatedPage, "Klient został dodany pomyślnie");

    await clientsPage.addClient(client2);
    await waitForToast(authenticatedPage, "Klient został dodany pomyślnie");

    // Wyszukaj klienta
    await clientsPage.searchClients("Alfa");

    // Sprawdź wyniki wyszukiwania
    await expect(clientsPage.getClientLocator(client1.name)).toBeVisible();
    await expect(clientsPage.getClientLocator(client2.name)).not.toBeVisible();
  });

  test("pobiera dane klienta z API GUS", async ({ authenticatedPage }) => {
    const clientsPage = new ClientsPage(authenticatedPage);
    await clientsPage.goto();
    await clientsPage.waitForPageLoad();

    await clientsPage.addClientButton.click();
    await clientsPage.clientFormDialog.waitFor({ state: "visible" });

    // Wprowadź NIP
    await clientsPage.clientTaxIdInput.fill("1234567890");

    // Kliknij przycisk GUS lookup
    await clientsPage.gusLookupButton.click();

    // Sprawdź czy dane zostały wypełnione (to będzie zależne od rzeczywistej odpowiedzi API)
    // W testach e2e prawdopodobnie będziemy mockować to API
    await waitForToast(authenticatedPage, "Dane pobrane z Białej Listy VAT pomyślnie");
  });

  test("waliduje formularz dodawania klienta", async ({ authenticatedPage }) => {
    const clientsPage = new ClientsPage(authenticatedPage);
    await clientsPage.goto();
    await clientsPage.waitForPageLoad();

    // Otwórz dialog
    await clientsPage.addClientButton.click();
    await clientsPage.clientFormDialog.waitFor({ state: "visible" });

    // Sprawdź czy przycisk submit jest wyłączony gdy pole name jest puste
    await expect(clientsPage.clientFormSubmitButton).toBeDisabled();

    // Wprowadź tylko spacje (powinno być traktowane jako puste)
    await clientsPage.clientNameInput.fill("   ");
    await expect(clientsPage.clientFormSubmitButton).toBeDisabled();

    // Wprowadź poprawną nazwę
    await clientsPage.clientNameInput.fill("Test Client");
    await expect(clientsPage.clientFormSubmitButton).toBeEnabled();

    // Wyczyść pole
    await clientsPage.clientNameInput.clear();
    await expect(clientsPage.clientFormSubmitButton).toBeDisabled();
  });

  test("anuluje dodawanie klienta", async ({ authenticatedPage }) => {
    const clientsPage = new ClientsPage(authenticatedPage);
    await clientsPage.goto();
    await clientsPage.waitForPageLoad();

    await clientsPage.addClientButton.click();
    await clientsPage.clientFormDialog.waitFor({ state: "visible" });

    // Wypełnij formularz
    await clientsPage.clientNameInput.fill("Testowa Firma");

    // Anuluj
    await clientsPage.clientFormCancelButton.click();

    // Sprawdź czy dialog został zamknięty
    await expect(clientsPage.clientFormDialog).not.toBeVisible();
  });
});
