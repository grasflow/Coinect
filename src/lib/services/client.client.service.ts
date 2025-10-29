import type { ClientDTO, CreateClientCommand, UpdateClientCommand } from "@/types";

/**
 * Serwis API klientów po stronie klienta
 * Odpowiada za komunikację z API endpoints
 */

interface ErrorResponse {
  error: {
    code?: string;
    message: string;
  };
}

interface GUSCompanyData {
  name?: string;
  street?: string;
  city?: string;
  postalCode?: string;
  country?: string;
}

interface GUSLookupResponse {
  success: boolean;
  data: GUSCompanyData;
}

export class ClientClientService {
  /**
   * Pobiera wszystkich klientów użytkownika
   */
  static async getAll(): Promise<ClientDTO[]> {
    const response = await fetch("/api/clients");

    if (!response.ok) {
      const errorData: ErrorResponse = await response.json();
      throw new Error(errorData.error.message || "Nie udało się pobrać klientów");
    }

    const data = await response.json();
    return data.clients;
  }

  /**
   * Tworzy nowego klienta
   */
  static async create(data: CreateClientCommand): Promise<ClientDTO> {
    const response = await fetch("/api/clients", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData: ErrorResponse = await response.json();
      throw new Error(errorData.error.message || "Nie udało się dodać klienta");
    }

    const result = await response.json();
    return result.client;
  }

  /**
   * Aktualizuje klienta
   */
  static async update(id: string, data: UpdateClientCommand): Promise<ClientDTO> {
    const response = await fetch(`/api/clients/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData: ErrorResponse = await response.json();
      throw new Error(errorData.error.message || "Nie udało się zaktualizować klienta");
    }

    const result = await response.json();
    return result.client;
  }

  /**
   * Usuwa klienta (soft delete)
   */
  static async delete(id: string): Promise<void> {
    const response = await fetch(`/api/clients/${id}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      const errorData: ErrorResponse = await response.json();
      throw new Error(errorData.error.message || "Nie udało się usunąć klienta");
    }
  }

  /**
   * Pobiera dane firmy z Białej Listy VAT (GUS)
   */
  static async lookupNIP(nip: string): Promise<GUSCompanyData> {
    const response = await fetch(`/api/clients/lookup-nip?nip=${nip}`);

    if (!response.ok) {
      const errorData: ErrorResponse = await response.json();
      throw new Error(errorData.error.message || "Nie udało się pobrać danych");
    }

    const result: GUSLookupResponse = await response.json();
    return result.data;
  }
}
