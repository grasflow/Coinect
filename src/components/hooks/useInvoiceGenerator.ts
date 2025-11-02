import { useState, useCallback, useEffect } from "react";
import { addDays } from "date-fns";
import type {
  InvoiceGeneratorState,
  InvoiceItemViewModel,
  InvoiceSettingsViewModel,
  ManualItem,
} from "@/components/features/invoices/types";

export function useInvoiceGenerator() {
  const initialIssueDate = new Date();
  const [state, setState] = useState<InvoiceGeneratorState>({
    step: 1,
    invoiceMode: "time_entries",
    selectedTimeEntryIds: [],
    items: [],
    manualItems: [],
    settings: {
      issueDate: initialIssueDate,
      saleDate: initialIssueDate,
      vatRate: 23,
      exchangeRate: null,
      isCustomExchangeRate: false,
      notes: undefined,
      dueDate: addDays(initialIssueDate, 7), // Domyślnie 7 dni
      paymentTermDays: 7, // Domyślnie 7 dni
    },
    summary: {
      netAmount: 0,
      vatRate: 23,
      vatAmount: 0,
      grossAmount: 0,
      currency: "PLN",
    },
  });

  // Logika przejścia do kolejnego kroku
  const goToNextStep = useCallback(() => {
    setState((prev) => ({ ...prev, step: (prev.step + 1) as 1 | 2 | 3 }));
  }, []);

  // Logika powrotu do poprzedniego kroku
  const goToPreviousStep = useCallback(() => {
    setState((prev) => {
      const newStep = (prev.step - 1) as 1 | 2 | 3;
      // Jeśli wracamy z kroku 3 do 2 w trybie manual, wyczyść items
      if (prev.step === 3 && newStep === 2 && prev.invoiceMode === "manual") {
        return { ...prev, step: newStep, items: [] };
      }
      return { ...prev, step: newStep };
    });
  }, []);

  // Wybór klienta
  const selectClient = useCallback((clientId: string) => {
    setState((prev) => ({ ...prev, clientId }));
  }, []);

  // Wybór wpisów czasu
  const selectTimeEntries = useCallback((timeEntryIds: string[]) => {
    setState((prev) => ({ ...prev, selectedTimeEntryIds: timeEntryIds }));
  }, []);

  // Grupowanie wpisów w pozycje faktury
  const setItems = useCallback((items: InvoiceItemViewModel[]) => {
    setState((prev) => ({ ...prev, items }));
  }, []);

  // Ustawienie trybu generowania faktury
  const setInvoiceMode = useCallback((mode: "time_entries" | "manual") => {
    setState((prev) => ({ ...prev, invoiceMode: mode }));
  }, []);

  // Ustawienie manualnych pozycji
  const setManualItems = useCallback((manualItems: ManualItem[]) => {
    setState((prev) => ({ ...prev, manualItems }));
  }, []);

  // Aktualizacja ustawień
  const updateSettings = useCallback((settings: Partial<InvoiceSettingsViewModel>) => {
    setState((prev) => ({
      ...prev,
      settings: { ...prev.settings, ...settings },
    }));
  }, []);

  // Konwersja manualItems na items przy przejściu do kroku 3
  useEffect(() => {
    if (state.step === 3 && state.invoiceMode === "manual" && state.manualItems.length > 0) {
      const convertedItems: InvoiceItemViewModel[] = state.manualItems.map((item, index) => ({
        id: item.id,
        position: index + 1,
        description: item.description,
        timeEntryIds: [],
        timeEntries: [],
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        netAmount: item.netAmount,
      }));

      // Tylko ustaw items jeśli są różne (uniknij pętli)
      if (JSON.stringify(state.items) !== JSON.stringify(convertedItems)) {
        setState((prev) => ({ ...prev, items: convertedItems }));
      }
    }
  }, [state.step, state.invoiceMode, state.manualItems, state.items]);

  // Automatyczne przeliczanie daty płatności przy zmianie daty wystawienia
  useEffect(() => {
    setState((prev) => {
      const { issueDate, paymentTermDays } = prev.settings;

      // Jeśli paymentTermDays nie jest 'custom', przelicz dueDate automatycznie
      if (paymentTermDays !== "custom" && paymentTermDays !== undefined) {
        const newDueDate = paymentTermDays === "immediate" ? issueDate : addDays(issueDate, paymentTermDays);

        // Tylko aktualizuj jeśli data się zmieniła
        if (prev.settings.dueDate?.getTime() !== newDueDate.getTime()) {
          return {
            ...prev,
            settings: {
              ...prev.settings,
              dueDate: newDueDate,
            },
          };
        }
      }

      return prev;
    });
  }, [state.settings.issueDate, state.settings.paymentTermDays]);

  // Automatyczne przeliczanie podsumowania
  useEffect(() => {
    setState((prev) => {
      // Oblicz kwotę netto z obu typów pozycji
      const itemsNetAmount = prev.items.reduce((sum, item) => sum + item.netAmount, 0);
      const manualItemsNetAmount = prev.manualItems.reduce((sum, item) => sum + item.netAmount, 0);
      const netAmount = itemsNetAmount + manualItemsNetAmount;

      const vatAmount = netAmount * (prev.settings.vatRate / 100);
      const grossAmount = netAmount + vatAmount;

      return {
        ...prev,
        summary: {
          netAmount,
          vatRate: prev.settings.vatRate,
          vatAmount,
          grossAmount,
          currency: prev.summary.currency,
          exchangeRate: prev.settings.exchangeRate,
          grossAmountPLN: prev.settings.exchangeRate ? grossAmount * prev.settings.exchangeRate : null,
        },
      };
    });
  }, [state.items, state.manualItems, state.settings.vatRate, state.settings.exchangeRate]);

  return {
    state,
    goToNextStep,
    goToPreviousStep,
    selectClient,
    selectTimeEntries,
    setItems,
    setInvoiceMode,
    setManualItems,
    updateSettings,
  };
}
