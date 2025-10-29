import { test, expect } from "./fixtures/data.fixture";
import { InvoiceGeneratorPage } from "./pages/invoice-generator.page";
import { InvoicesPage } from "./pages/invoices.page";
import { formatDate } from "./utils/test-helpers";

test.describe("Generator faktur", () => {
  test("wyświetla kreator nowej faktury", async ({ authenticatedPage }) => {
    const invoiceGeneratorPage = new InvoiceGeneratorPage(authenticatedPage);
    await invoiceGeneratorPage.goto();
    await invoiceGeneratorPage.waitForPageLoad();

    await expect(invoiceGeneratorPage.pageTitle).toBeVisible();
    await expect(invoiceGeneratorPage.stepIndicator).toBeVisible();
  });

  test("generuje fakturę z wpisów czasu (Happy Path)", async ({ authenticatedPage, testData }) => {
    const invoiceGeneratorPage = new InvoiceGeneratorPage(authenticatedPage);
    const invoicesPage = new InvoicesPage(authenticatedPage);

    await invoiceGeneratorPage.goto();
        await invoiceGeneratorPage.waitForPageLoad();

    // Krok 1: Wybór klienta
    await invoiceGeneratorPage.selectClient("Test Client Sp. z o.o.");
    await invoiceGeneratorPage.selectInvoiceMode("time-entries");
    await invoiceGeneratorPage.goToNextStep();

    // Krok 2: Wybór wpisów czasu
    await invoiceGeneratorPage.waitForStep(2);
    await invoiceGeneratorPage.selectTimeEntries(["entry1", "entry2"]); // Uproszczony wybór
    await invoiceGeneratorPage.goToNextStep();

    // Krok 3: Ustawienia i podsumowanie
    await invoiceGeneratorPage.waitForStep(3);
    const today = formatDate();
    const nextMonth = formatDate(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000));

    await invoiceGeneratorPage.setInvoiceDates(today, nextMonth);
    await invoiceGeneratorPage.setVatRate(23);

    // Wygeneruj fakturę (czeka na nawigację do /invoices)
    await invoiceGeneratorPage.generateInvoice();

    // Sprawdź czy jesteśmy na stronie faktur
    await invoicesPage.waitForPageLoad();

    // Verify we're on the invoices page (navigation succeeded)
    await expect(authenticatedPage).toHaveURL(/\/invoices$/);
    await expect(invoicesPage.pageHeading).toBeVisible();
  });

  test("generuje fakturę manualną", async ({ authenticatedPage, testData }) => {
    const invoiceGeneratorPage = new InvoiceGeneratorPage(authenticatedPage);
    const invoicesPage = new InvoicesPage(authenticatedPage);

    await invoiceGeneratorPage.goto();
        await invoiceGeneratorPage.waitForPageLoad();

    // Krok 1: Wybór klienta
    await invoiceGeneratorPage.selectClient("Test Client Sp. z o.o.");
    await invoiceGeneratorPage.selectInvoiceMode("manual");
    await invoiceGeneratorPage.goToNextStep();

    // Krok 2: Dodanie pozycji manualnych
    await invoiceGeneratorPage.waitForStep(2);
    await invoiceGeneratorPage.addManualItem("Usługa programistyczna", 10, 150.0);
    await invoiceGeneratorPage.addManualItem("Konsultacje techniczne", 5, 200.0);
    await invoiceGeneratorPage.goToNextStep();

    // Krok 3: Ustawienia i podsumowanie
    await invoiceGeneratorPage.waitForStep(3);
    const today = formatDate();
    const nextMonth = formatDate(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000));

    await invoiceGeneratorPage.setInvoiceDates(today, nextMonth);
    await invoiceGeneratorPage.setVatRate(23);

    // Wygeneruj fakturę (czeka na nawigację do /invoices)
    await invoiceGeneratorPage.generateInvoice();

    // Sprawdź czy jesteśmy na stronie faktur
    await invoicesPage.waitForPageLoad();

    // Verify we're on the invoices page (navigation succeeded)
    await expect(authenticatedPage).toHaveURL(/\/invoices$/);
    await expect(invoicesPage.pageHeading).toBeVisible();
  });

  test("nawiguje między krokami kreatora", async ({ authenticatedPage }) => {
    const invoiceGeneratorPage = new InvoiceGeneratorPage(authenticatedPage);
    await invoiceGeneratorPage.goto();
        await invoiceGeneratorPage.waitForPageLoad();

    // Sprawdź krok 1
    let currentStep = await invoiceGeneratorPage.getCurrentStep();
    expect(currentStep).toBe(1);

    // Wybierz klienta i tryb manualny (nie zależy od istniejących danych)
    await invoiceGeneratorPage.selectClient();
    await invoiceGeneratorPage.selectInvoiceMode("manual");

    // Przejdź do kroku 2
    await invoiceGeneratorPage.goToNextStep();
    await invoiceGeneratorPage.waitForStep(2);
    currentStep = await invoiceGeneratorPage.getCurrentStep();
    expect(currentStep).toBe(2);

    // Dodaj pozycję manualną aby odblokować przycisk "Dalej"
    await invoiceGeneratorPage.addManualItem("Test", 1, 100);

    // Przejdź do kroku 3
    await invoiceGeneratorPage.goToNextStep();
    await invoiceGeneratorPage.waitForStep(3);
    currentStep = await invoiceGeneratorPage.getCurrentStep();
    expect(currentStep).toBe(3);

    // Wróć do kroku 2
    await invoiceGeneratorPage.goToPreviousStep();
    await invoiceGeneratorPage.waitForStep(2);
    currentStep = await invoiceGeneratorPage.getCurrentStep();
    expect(currentStep).toBe(2);
  });

  test("zachowuje dane przy nawigacji między krokami", async ({ authenticatedPage, testData }) => {
    const invoiceGeneratorPage = new InvoiceGeneratorPage(authenticatedPage);
    await invoiceGeneratorPage.goto();
        await invoiceGeneratorPage.waitForPageLoad();

    // Krok 1: Wybór klienta i trybu manualnego (nie zależy od istniejących danych)
    await invoiceGeneratorPage.selectClient();
    await invoiceGeneratorPage.selectInvoiceMode("manual");
    await invoiceGeneratorPage.goToNextStep();

    // Krok 2: Dodanie pozycji manualnej
    await invoiceGeneratorPage.waitForStep(2);
    await invoiceGeneratorPage.addManualItem("Usługa testowa", 5, 100.0);

    // Wróć do kroku 1
    await invoiceGeneratorPage.goToPreviousStep();

    // Sprawdź czy wybór klienta został zachowany
    const currentStep = await invoiceGeneratorPage.getCurrentStep();
    expect(currentStep).toBe(1);

    // Przejdź ponownie do kroku 2
    await invoiceGeneratorPage.goToNextStep();

    // Sprawdź czy dane pozycji zostały zachowane
    await invoiceGeneratorPage.waitForStep(2);
    const itemDescription = authenticatedPage.locator('input[placeholder="np. Konsultacje IT"]');
    await expect(itemDescription).toHaveValue("Usługa testowa");
  });
});
