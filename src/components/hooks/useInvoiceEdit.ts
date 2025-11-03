import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { differenceInDays, differenceInMonths } from "date-fns";
import type {
  InvoiceEditState,
  InvoiceItemViewModel,
  InvoiceSettingsViewModel,
} from "@/components/features/invoices/types";

async function fetchInvoiceDetail(invoiceId: string) {
  const response = await fetch(`/api/invoices/${invoiceId}`);

  if (!response.ok) {
    throw new Error("Nie udało się pobrać faktury");
  }

  return response.json();
}

async function updateInvoice(
  invoiceId: string,
  data: {
    issue_date?: string;
    sale_date?: string;
    vat_rate?: number;
    items?: {
      position: number;
      description: string;
      quantity: number;
      unit_price: number;
    }[];
    custom_exchange_rate?: number | null;
    notes?: string | null;
    due_date?: string | null;
    invoice_number?: string;
  }
) {
  const response = await fetch(`/api/invoices/${invoiceId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || "Nie udało się zaktualizować faktury");
  }

  return response.json();
}

export function useInvoiceDetail(invoiceId: string) {
  return useQuery({
    queryKey: ["invoice", invoiceId],
    queryFn: () => fetchInvoiceDetail(invoiceId),
  });
}

export function useUpdateInvoice(invoiceId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Parameters<typeof updateInvoice>[1]) => updateInvoice(invoiceId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invoice", invoiceId] });
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
    },
  });
}

/**
 * Oblicza paymentTermDays na podstawie różnicy między datą wystawienia a terminem płatności
 */
function calculatePaymentTermDays(
  issueDate: Date,
  dueDate: Date | undefined
): number | "immediate" | "custom" | "month" {
  if (!dueDate) {
    return 7; // Domyślnie 7 dni jeśli brak dueDate
  }

  const daysDiff = differenceInDays(dueDate, issueDate);

  // Natychmiastowa płatność
  if (daysDiff === 0) {
    return "immediate";
  }

  // Sprawdź czy to dokładnie 1 miesiąc
  const monthsDiff = differenceInMonths(dueDate, issueDate);
  if (monthsDiff === 1) {
    // Sprawdź czy dzień miesiąca się zgadza (różnica może być 28-31 dni)
    const expectedMonthDate = new Date(issueDate);
    expectedMonthDate.setMonth(expectedMonthDate.getMonth() + 1);

    if (expectedMonthDate.getDate() === dueDate.getDate() && expectedMonthDate.getMonth() === dueDate.getMonth()) {
      return "month";
    }
  }

  // Standardowe wartości dni
  const standardDays = [1, 3, 5, 7, 14, 21, 30, 45, 60, 75, 90];
  if (standardDays.includes(daysDiff)) {
    return daysDiff;
  }

  // Niestandardowa data
  return "custom";
}

/**
 * Hook do konwersji danych z API na EditState
 */
export function useInvoiceEditState(invoiceId: string): {
  state: InvoiceEditState | null;
  isLoading: boolean;
  error: Error | null;
} {
  const { data: invoice, isLoading, error } = useInvoiceDetail(invoiceId);

  if (isLoading || !invoice) {
    return { state: null, isLoading, error: error as Error | null };
  }

  // Konwersja pozycji faktury na InvoiceItemViewModel
  const items: InvoiceItemViewModel[] = (invoice.items || []).map((item) => ({
    id: item.id,
    position: item.position,
    description: item.description,
    timeEntryIds: item.time_entries?.map((te) => te.time_entry.id) || [],
    timeEntries: item.time_entries?.map((te) => te.time_entry) || [],
    quantity: parseFloat(item.quantity),
    unitPrice: parseFloat(item.unit_price),
    netAmount: parseFloat(item.net_amount),
    originalDescription: item.description,
    originalQuantity: parseFloat(item.quantity),
    originalUnitPrice: parseFloat(item.unit_price),
  }));

  // Konwersja ustawień
  const issueDate = new Date(invoice.issue_date);
  const dueDate = invoice.due_date ? new Date(invoice.due_date) : undefined;

  const settings: InvoiceSettingsViewModel = {
    issueDate,
    saleDate: new Date(invoice.sale_date),
    vatRate: parseFloat(invoice.vat_rate),
    exchangeRate: invoice.exchange_rate ? parseFloat(invoice.exchange_rate) : null,
    isCustomExchangeRate: invoice.is_custom_exchange_rate || false,
    notes: invoice.notes || undefined,
    dueDate,
    paymentTermDays: calculatePaymentTermDays(issueDate, dueDate),
    invoiceNumber: invoice.invoice_number,
  };

  // Obliczenie podsumowania
  const netAmount = items.reduce((sum, item) => sum + item.netAmount, 0);
  const vatAmount = netAmount * (settings.vatRate / 100);
  const grossAmount = netAmount + vatAmount;

  const state: InvoiceEditState = {
    invoice,
    items,
    settings,
    summary: {
      netAmount,
      vatRate: settings.vatRate,
      vatAmount,
      grossAmount,
      currency: invoice.currency,
      exchangeRate: settings.exchangeRate,
      grossAmountPLN: settings.exchangeRate && invoice.currency !== "PLN" ? grossAmount * settings.exchangeRate : null,
    },
    isModified: false,
    showWarning: true,
  };

  return { state, isLoading: false, error: null };
}
