import { useQuery } from "@tanstack/react-query";
import type { Currency } from "@/types";

interface ExchangeRateDTO {
  currency: Currency;
  date: string;
  rate: string;
  source: "cache" | "api";
}

async function fetchExchangeRate(currency: Currency, date: string): Promise<ExchangeRateDTO> {
  const response = await fetch(`/api/exchange-rates/${currency}/${date}`);

  if (!response.ok) {
    throw new Error("Nie udało się pobrać kursu waluty");
  }

  return response.json();
}

export function useExchangeRate(currency: Currency, date: Date | null, enabled = true) {
  const dateString = date?.toISOString().split("T")[0] || "";

  return useQuery({
    queryKey: ["exchange-rate", currency, dateString],
    queryFn: () => fetchExchangeRate(currency, dateString),
    enabled: enabled && !!date && (currency === "EUR" || currency === "USD"),
    staleTime: 1000 * 60 * 60 * 24, // 24h cache
  });
}
