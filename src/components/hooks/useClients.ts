import { useQuery } from "@tanstack/react-query";
import type { ClientDTO } from "@/types";

async function fetchClients(): Promise<ClientDTO[]> {
  const response = await fetch("/api/clients", {
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    throw new Error("Nie udało się pobrać klientów");
  }

  return response.json();
}

export function useClients() {
  return useQuery({
    queryKey: ["clients"],
    queryFn: fetchClients,
  });
}
