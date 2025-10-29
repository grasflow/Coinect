import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { InvoicesFilterState } from "@/components/features/invoices/types";
import type { InvoiceListItemDTO } from "@/types";

interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
}

async function fetchInvoices(filters: InvoicesFilterState): Promise<PaginatedResponse<InvoiceListItemDTO>> {
  const params = new URLSearchParams();

  if (filters.clientId && filters.clientId !== "all") {
    params.append("client_id", filters.clientId);
  }

  if (filters.dateRange) {
    params.append("date_from", filters.dateRange.from.toISOString().split("T")[0]);
    params.append("date_to", filters.dateRange.to.toISOString().split("T")[0]);
  }

  if (filters.status !== "all") {
    params.append("status", filters.status);
  }

  if (filters.currency && filters.currency !== "all") {
    params.append("currency", filters.currency);
  }

  params.append("page", String(filters.page));
  params.append("page_size", String(filters.pageSize));

  const response = await fetch(`/api/invoices?${params.toString()}`);

  if (!response.ok) {
    throw new Error("Nie udało się pobrać faktur");
  }

  return response.json();
}

export function useInvoices(filters: InvoicesFilterState) {
  return useQuery({
    queryKey: ["invoices", filters],
    queryFn: () => fetchInvoices(filters),
  });
}

export function useToggleInvoicePaid() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ invoiceId, isPaid }: { invoiceId: string; isPaid: boolean }) => {
      const response = await fetch(`/api/invoices/${invoiceId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          is_paid: isPaid,
          status: isPaid ? "paid" : "unpaid",
        }),
      });

      if (!response.ok) throw new Error("Nie udało się zaktualizować statusu");

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
    },
  });
}

export function useDeleteInvoice() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (invoiceId: string) => {
      const response = await fetch(`/api/invoices/${invoiceId}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Nie udało się usunąć faktury");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      queryClient.invalidateQueries({ queryKey: ["time-entries"] });
      queryClient.invalidateQueries({ queryKey: ["ai-insights"] });
    },
  });
}

interface InvoiceTotals {
  netAmount: number;
  grossAmount: number;
  count: number;
}

async function fetchInvoiceTotals(filters: InvoicesFilterState): Promise<InvoiceTotals> {
  const params = new URLSearchParams();

  if (filters.clientId && filters.clientId !== "all") {
    params.append("client_id", filters.clientId);
  }

  if (filters.dateRange) {
    params.append("date_from", filters.dateRange.from.toISOString().split("T")[0]);
    params.append("date_to", filters.dateRange.to.toISOString().split("T")[0]);
  }

  if (filters.status !== "all") {
    params.append("status", filters.status);
  }

  if (filters.currency && filters.currency !== "all") {
    params.append("currency", filters.currency);
  }

  const response = await fetch(`/api/invoices/totals?${params.toString()}`);

  if (!response.ok) {
    throw new Error("Nie udało się pobrać podsumowań faktur");
  }

  return response.json();
}

export function useInvoiceTotals(filters: InvoicesFilterState) {
  return useQuery({
    queryKey: ["invoice-totals", filters],
    queryFn: () => fetchInvoiceTotals(filters),
  });
}
