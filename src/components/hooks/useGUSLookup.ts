import { useState } from "react";
import { toast } from "sonner";
import { ClientClientService } from "@/lib/services/client.client.service";

/**
 * Custom hook dla pobierania danych firmy z GUS (Biała Lista VAT)
 */
export function useGUSLookup() {
  const [isLoading, setIsLoading] = useState(false);

  const lookupNIP = async (nip: string) => {
    // Walidacja NIP
    const cleanNip = nip.replace(/\D/g, "");

    if (!cleanNip || cleanNip.length !== 10) {
      toast.error("Wprowadź poprawny 10-cyfrowy NIP");
      return null;
    }

    setIsLoading(true);

    try {
      const data = await ClientClientService.lookupNIP(cleanNip);
      toast.success("Dane pobrane z Białej Listy VAT pomyślnie");
      return data;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Nie udało się pobrać danych z Białej Listy VAT";
      toast.error(errorMessage);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    lookupNIP,
    isLoading,
  };
}
