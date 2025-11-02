import { useMutation, useQueryClient } from "@tanstack/react-query";

interface GenerateInvoiceCommand {
  client_id: string;
  issue_date: string;
  sale_date: string;
  vat_rate: number;
  time_entry_ids?: string[];
  items?: {
    description: string;
    time_entry_ids: string[];
  }[];
  manual_items?: {
    description: string;
    quantity: number;
    unit_price: number;
  }[];
  custom_exchange_rate?: number | null;
}

interface GenerateInvoiceResponse {
  id: string;
  invoice_number: string;
  gross_amount: string;
  currency: string;
  pdf_url: string;
  message: string;
}

async function generateInvoice(command: GenerateInvoiceCommand): Promise<GenerateInvoiceResponse> {
  const response = await fetch("/api/invoices/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(command),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || "Nie udało się wygenerować faktury");
  }

  return response.json();
}

export function useGenerateInvoice() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: generateInvoice,
    onSuccess: () => {
      // Unieważnienie zapytań po wygenerowaniu faktury
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      queryClient.invalidateQueries({ queryKey: ["time-entries"] });
    },
  });
}
