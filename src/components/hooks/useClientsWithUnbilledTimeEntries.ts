import { useQuery } from "@tanstack/react-query";
import type { ClientDTO } from "@/types";

async function fetchClientsWithUnbilledTimeEntries(): Promise<ClientDTO[]> {
  const response = await fetch("/api/clients/with-unbilled-time-entries", {
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    throw new Error("Nie udało się pobrać klientów z niewyfakturowanymi wpisami czasu");
  }

  return response.json();
}

export function useClientsWithUnbilledTimeEntries() {
  return useQuery({
    queryKey: ["clients-with-unbilled-time-entries"],
    queryFn: fetchClientsWithUnbilledTimeEntries,
  });
}
