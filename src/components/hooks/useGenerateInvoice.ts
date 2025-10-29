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
  // eslint-disable-next-line no-console
  console.log("Wysyłanie danych do API:", JSON.stringify(command, null, 2));

  const response = await fetch("/api/invoices/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(command),
  });

  if (!response.ok) {
    const error = await response.json();
    // eslint-disable-next-line no-console
    console.error("Błąd API:", JSON.stringify(error, null, 2));

    // Jeśli są szczegóły walidacji, pokaż je
    if (error.error?.details) {
      // eslint-disable-next-line no-console
      console.error("Szczegóły walidacji:", JSON.stringify(error.error.details, null, 2));
    }

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
