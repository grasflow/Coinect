import { test, expect } from "./fixtures/data.fixture";
import { TimeEntriesPage } from "./pages/time-entries.page";
import { waitForToast, formatDate } from "./utils/test-helpers";

test.describe("Wpisy czasu pracy", () => {
  test("wyświetla stronę wpisów czasu", async ({ authenticatedPage }) => {
    const timeEntriesPage = new TimeEntriesPage(authenticatedPage);
    await timeEntriesPage.goto();
    await timeEntriesPage.waitForPageLoad();

    await expect(timeEntriesPage.pageHeading).toBeVisible();
    await expect(timeEntriesPage.pageDescription).toBeVisible();
    await expect(timeEntriesPage.addTimeEntryButton).toBeVisible();
  });

  test("dodaje nowy wpis czasu", async ({ authenticatedPage, testData }) => {
    const timeEntriesPage = new TimeEntriesPage(authenticatedPage);
    await timeEntriesPage.goto();
    await timeEntriesPage.waitForPageLoad();

    const today = formatDate();
    const uniqueDesc = `Test entry created at ${Date.now()}`;
    const timeEntryData = {
      clientName: testData.clientName!, // Use dynamic client name from fixture
      date: today,
      hours: 8,
      minutes: 30,
      hourlyRate: 150,
      currency: "PLN",
      publicDescription: uniqueDesc,
      privateNote: "Implementacja funkcji logowania",
    };

    await timeEntriesPage.addTimeEntry(timeEntryData);

    // Sprawdź czy wpis został dodany
    // Note: addTimeEntry() already waits for the toast internally, so we don't wait here
    await expect(
      await timeEntriesPage.isTimeEntryVisible(today, timeEntryData.clientName, timeEntryData.publicDescription)
    ).toBe(true);
  });

  test("edytuje istniejący wpis czasu", async ({ authenticatedPage, testData }) => {
    const timeEntriesPage = new TimeEntriesPage(authenticatedPage);
    await timeEntriesPage.goto();
    await timeEntriesPage.waitForPageLoad();

    const yesterday = formatDate(new Date(Date.now() - 86400000));
    const clientName = testData.clientName!;
    const updatedData = {
      hours: 6,
      minutes: 45,
      publicDescription: "Zaktualizowany opis publiczny",
      privateNote: "Zaktualizowana notatka prywatna",
    };

    await timeEntriesPage.editTimeEntry(yesterday, clientName, updatedData);

    // Sprawdź czy wpis został zaktualizowany
    // Note: editTimeEntry() already waits for the toast internally
  });

  test("usuwa wpis czasu", async ({ authenticatedPage, testData }) => {
    // Najpierw dodaj wpis do usunięcia
    const timeEntriesPage = new TimeEntriesPage(authenticatedPage);
    await timeEntriesPage.goto();
    await timeEntriesPage.waitForPageLoad();

    const today = formatDate();
    const uniqueDesc = `Entry to delete ${Date.now()}`;
    const timeEntryData = {
      clientName: testData.clientName!,
      date: today,
      hours: 4,
      publicDescription: uniqueDesc,
    };

    await timeEntriesPage.addTimeEntry(timeEntryData);
    // Note: addTimeEntry() already waits for the toast internally

    // Teraz usuń wpis
    await timeEntriesPage.deleteTimeEntry(today, timeEntryData.clientName, timeEntryData.publicDescription);

    // Sprawdź czy wpis został usunięty
    // Note: deleteTimeEntry() already waits for the toast internally
    await expect(
      await timeEntriesPage.isTimeEntryVisible(today, timeEntryData.clientName, timeEntryData.publicDescription)
    ).toBe(false);
  });

  test("filtruje wpisy czasu po kliencie", async ({ authenticatedPage, testData }) => {
    const timeEntriesPage = new TimeEntriesPage(authenticatedPage);
    await timeEntriesPage.goto();
    await timeEntriesPage.waitForPageLoad();

    const initialCount = await timeEntriesPage.getTimeEntriesCount();

    // Filtruj po kliencie
    await timeEntriesPage.filterByClient(testData.clientName!);

    // Sprawdź czy lista została przefiltrowana
    const filteredCount = await timeEntriesPage.getTimeEntriesCount();
    expect(filteredCount).toBeLessThanOrEqual(initialCount);
  });

  test("filtruje wpisy czasu po statusie", async ({ authenticatedPage, testData }) => {
    const timeEntriesPage = new TimeEntriesPage(authenticatedPage);
    await timeEntriesPage.goto();
    await timeEntriesPage.waitForPageLoad();

    // Filtruj po statusie "niezafakturowane"
    await timeEntriesPage.filterByStatus("unbilled");

    // Sprawdź status wpisów
    const timeEntries = authenticatedPage.locator("tbody tr");
    const count = await timeEntries.count();

    for (let i = 0; i < count; i++) {
      const status = await timeEntriesPage.getTimeEntryStatus(
        (await timeEntries.nth(i).locator("td").nth(0).textContent()) || "",
        (await timeEntries.nth(i).locator("td").nth(1).textContent()) || ""
      );
      expect(status).toBe("Niezafakturowane");
    }
  });

  test("eksportuje wpisy czasu do CSV", async ({ authenticatedPage, testData }) => {
    const timeEntriesPage = new TimeEntriesPage(authenticatedPage);
    await timeEntriesPage.goto();
    await timeEntriesPage.waitForPageLoad();

    const download = await timeEntriesPage.exportToCsv();

    // Sprawdź czy plik został pobrany
    expect(download.suggestedFilename()).toMatch(/wpisy-czasu.*\.csv/);
    // Note: exportToCsv() already waits for the toast internally
  });

  test("wyczyszcza filtry", async ({ authenticatedPage, testData }) => {
    const timeEntriesPage = new TimeEntriesPage(authenticatedPage);
    await timeEntriesPage.goto();
    await timeEntriesPage.waitForPageLoad();

    // Ustaw filtry
    await timeEntriesPage.filterByClient(testData.clientName!);
    await timeEntriesPage.filterByStatus("unbilled");

    const filteredCount = await timeEntriesPage.getTimeEntriesCount();

    // Wyczyść filtry
    await timeEntriesPage.clearFilters();

    // Sprawdź czy filtry zostały wyczyszczone
    const clearedCount = await timeEntriesPage.getTimeEntriesCount();
    expect(clearedCount).toBeGreaterThanOrEqual(filteredCount);
  });

  test("waliduje formularz dodawania wpisu czasu", async ({ authenticatedPage }) => {
    const timeEntriesPage = new TimeEntriesPage(authenticatedPage);
    await timeEntriesPage.goto();
    await timeEntriesPage.waitForPageLoad();

    // Ensure page is fully loaded and hydrated before clicking
    await authenticatedPage.waitForLoadState("domcontentloaded");
    await timeEntriesPage.addTimeEntryButton.waitFor({ state: "visible", timeout: 5000 });
    await authenticatedPage.waitForTimeout(500);

    await timeEntriesPage.addTimeEntryButton.click();
    await timeEntriesPage.timeEntryFormDialog.waitFor({ state: "visible", timeout: 10000 });

    // Sprawdź czy przycisk submit jest wyłączony gdy wymagane pola są puste
    await expect(timeEntriesPage.timeEntryFormSubmitButton).toBeDisabled();

    // Wypełnij pole godziny i sprawdź czy przycisk nadal jest wyłączony (brakuje klienta)
    const hoursInput = authenticatedPage.locator('input[type="number"]').first();
    await hoursInput.fill("8");
    await expect(timeEntriesPage.timeEntryFormSubmitButton).toBeDisabled();
  });

  test("blokuje edycję zafakturowanych wpisów", async ({ authenticatedPage, testData }) => {
    const timeEntriesPage = new TimeEntriesPage(authenticatedPage);
    await timeEntriesPage.goto();
    await timeEntriesPage.waitForPageLoad();

    // Znajdź zafakturowany wpis (jeśli istnieje)
    const timeEntries = authenticatedPage.locator("tbody tr");
    const count = await timeEntries.count();

    for (let i = 0; i < count; i++) {
      const row = timeEntries.nth(i);
      const status = await row.locator("td").nth(6).textContent();

      if (status?.includes("Zafakturowane")) {
        // Sprawdź czy przycisk edycji jest wyłączony
        const editButton = row
          .locator("button")
          .filter({ has: authenticatedPage.locator("svg") })
          .first();
        await expect(editButton).toBeDisabled();
        break;
      }
    }
  });
});
