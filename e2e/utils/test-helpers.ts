import type { Page, Locator } from "@playwright/test";
import { expect } from "@playwright/test";

/**
 * Czeka na toast message i sprawdza jego zawartość (case-insensitive)
 * Używa .first() aby obsłużyć sytuację gdy wiele toastów jest widocznych jednocześnie
 */
export async function waitForToast(page: Page, expectedText?: string, timeout = 5000) {
  if (expectedText) {
    // Sonner używa data-sonner-toast jako głównego selektora
    // Używamy .first() aby obsłużyć wiele widocznych toastów z tym samym tekstem
    const toast = page.locator('[data-sonner-toast]').filter({ hasText: expectedText }).first();

    try {
      await toast.waitFor({ timeout });
      return toast;
    } catch (error) {
      console.error(`Toast with text "${expectedText}" not found after ${timeout}ms`);
      // Take screenshot for debugging
      await page.screenshot({ path: `test-results/toast-not-found-${Date.now()}.png` });
      throw error;
    }
  } else {
    // Fallback do poprzedniego zachowania - ostatni toast
    const toast = page.locator('[data-sonner-toast]').or(page.locator('[role="alert"]')).or(page.locator('.toast')).last();

    try {
      await toast.waitFor({ timeout });
    } catch (error) {
      console.error(`Toast not found after ${timeout}ms`);
      // Take screenshot for debugging
      await page.screenshot({ path: `test-results/toast-not-found-${Date.now()}.png` });
      throw error;
    }

    return toast;
  }
}

/**
 * Czeka na zniknięcie loading spinnera
 */
export async function waitForLoadingToComplete(page: Page, timeout = 10000) {
  const spinner = page.locator('[data-loading="true"], .spinner, .loading');
  await spinner.waitFor({ state: 'hidden', timeout });
}

/**
 * Sprawdza czy element jest widoczny w viewport
 */
export async function isVisibleInViewport(locator: Locator) {
  return locator.evaluate((element) => {
    const rect = element.getBoundingClientRect();
    return (
      rect.top >= 0 &&
      rect.left >= 0 &&
      rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
      rect.right <= (window.innerWidth || document.documentElement.clientWidth)
    );
  });
}

/**
 * Scrolluje do elementu jeśli nie jest widoczny
 */
export async function scrollToElementIfNeeded(locator: Locator) {
  const isVisible = await isVisibleInViewport(locator);
  if (!isVisible) {
    await locator.scrollIntoViewIfNeeded();
    // Poczekaj na zakończenie animacji scrollowania
    await locator.page().waitForTimeout(500);
  }
}

/**
 * Wypełnia formularz z danymi
 */
export async function fillFormFields(page: Page, fields: Record<string, string>) {
  for (const [selector, value] of Object.entries(fields)) {
    const field = page.locator(selector);
    await field.waitFor({ state: 'visible' });
    await field.fill(value);
  }
}

/**
 * Symuluje upload pliku przez input
 */
export async function uploadFile(page: Page, inputSelector: string, filePath: string) {
  const input = page.locator(inputSelector);
  await input.setInputFiles(filePath);
}

/**
 * Czeka na zmianę URL
 */
export async function waitForURLChange(page: Page, expectedURL: string | RegExp, timeout = 5000) {
  await page.waitForURL(expectedURL, { timeout });
}

/**
 * Sprawdza dostępność elementu (a11y)
 */
export async function checkAccessibility(locator: Locator) {
  const isFocusable = await locator.isVisible();
  const hasAriaLabel = await locator.getAttribute('aria-label').then(attr => !!attr);
  const hasLabel = await locator.getAttribute('aria-labelledby').then(attr => !!attr);

  return {
    isFocusable,
    hasAriaLabel,
    hasLabel,
    isAccessible: isFocusable && (hasAriaLabel || hasLabel)
  };
}

/**
 * Generuje unikalną wartość dla testów (timestamp-based)
 */
export function generateUniqueValue(prefix = 'test') {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Formatuje datę do formatu YYYY-MM-DD
 */
export function formatDate(date: Date = new Date()) {
  return date.toISOString().split('T')[0];
}

/**
 * Formatuje datę do polskiego formatu
 */
export function formatDatePL(date: Date = new Date()) {
  return date.toLocaleDateString('pl-PL');
}

/**
 * Tworzy datę przesuniętą o podaną liczbę dni
 */
export function addDays(date: Date, days: number) {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

/**
 * Sprawdza czy tabela zawiera oczekiwane dane
 */
export async function verifyTableContainsData(tableLocator: Locator, expectedData: string[]) {
  for (const data of expectedData) {
    await expect(tableLocator).toContainText(data);
  }
}

/**
 * Liczy elementy w tabeli/paginated liście
 */
export async function countTableRows(tableLocator: Locator) {
  return tableLocator.locator('tbody tr, [role="row"]').count();
}

/**
 * Sprawdza czy przycisk jest aktywny/wyłączony
 */
export async function isButtonEnabled(buttonLocator: Locator) {
  const isDisabled = await buttonLocator.getAttribute('disabled');
  return !isDisabled;
}

/**
 * Czeka na aktualizację wartości w elemencie
 */
export async function waitForValueUpdate(locator: Locator, expectedValue: string, timeout = 5000) {
  await expect(locator).toHaveValue(expectedValue, { timeout });
}

/**
 * Symuluje przeciąganie i upuszczanie (drag & drop)
 */
export async function dragAndDrop(page: Page, sourceSelector: string, targetSelector: string) {
  const source = page.locator(sourceSelector);
  const target = page.locator(targetSelector);

  await source.dragTo(target);
}

/**
 * Sprawdza czy modal/dialog jest otwarty
 */
export async function isModalOpen(page: Page, modalSelector = '[role="dialog"]') {
  const modal = page.locator(modalSelector);
  return modal.isVisible();
}

/**
 * Zamyka modal przez kliknięcie overlay lub przycisku close
 */
export async function closeModal(page: Page, modalSelector = '[role="dialog"]') {
  const modal = page.locator(modalSelector);
  const closeButton = modal.locator('[aria-label*="close"], .close, .modal-close').first();

  if (await closeButton.isVisible()) {
    await closeButton.click();
  } else {
    // Kliknij poza modalem (overlay)
    await page.mouse.click(10, 10);
  }

  await modal.waitFor({ state: 'hidden' });
}

