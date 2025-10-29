import type { Page } from "@playwright/test";
import type { CreateClientCommand, CreateTimeEntryCommand, GenerateInvoiceCommand } from "../../src/types";

export class APIHelpers {
  private page: Page;

  constructor(page?: Page) {
    if (page) {
      this.page = page;
    }
  }

  setPage(page: Page) {
    this.page = page;
  }

  private async makeAuthenticatedRequest(endpoint: string, options: RequestInit = {}, retries = 3) {
    if (!this.page) {
      throw new Error("Page not set. Call setPage() first.");
    }

    const baseURL = process.env.PLAYWRIGHT_BASE_URL || "http://localhost:3000";
    const url = `${baseURL}${endpoint}`;

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        // Use context.request instead of page.request
        // context.request shares cookies with the browser context
        // Playwright API uses 'data' instead of 'body' for request payload
        const playwrightOptions: any = {
          method: options.method || "GET",
          headers: {
            "Content-Type": "application/json",
            ...options.headers,
          },
        };

        // Convert body to data for Playwright
        if (options.body) {
          playwrightOptions.data = options.body;
        }

        const response = await this.page.context().request.fetch(url, playwrightOptions);

        if (!response.ok()) {
          const errorBody = await response.text();
          throw new Error(`API request failed: ${response.status()} ${response.statusText()} - ${errorBody}`);
        }

        // Check if response has content before parsing JSON
        const contentType = response.headers()["content-type"];
        if (contentType && contentType.includes("application/json")) {
          const text = await response.text();
          return text ? JSON.parse(text) : {};
        }
        return {};
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);

        // Log detailed error information
        console.error(`Attempt ${attempt + 1}/${retries + 1} failed for ${endpoint}:`, errorMessage);

        // If this is the last retry or a non-retryable error, throw
        if (attempt === retries || !errorMessage.includes("409")) {
          throw new Error(`${endpoint} failed after ${attempt + 1} attempts: ${errorMessage}`);
        }

        // Wait before retrying (exponential backoff)
        await this.page.waitForTimeout(Math.pow(2, attempt) * 1000);
      }
    }

    throw new Error(`${endpoint} failed after all retries`);
  }

  async createTestClient(clientData: CreateClientCommand) {
    return this.makeAuthenticatedRequest("/api/clients", {
      method: "POST",
      body: JSON.stringify(clientData),
    });
  }

  async updateClient(clientId: string, clientData: Partial<CreateClientCommand>) {
    return this.makeAuthenticatedRequest(`/api/clients/${clientId}`, {
      method: "PUT",
      body: JSON.stringify(clientData),
    });
  }

  async deleteClient(clientId: string) {
    return this.makeAuthenticatedRequest(`/api/clients/${clientId}`, {
      method: "DELETE",
    });
  }

  async createTestTimeEntry(timeEntryData: CreateTimeEntryCommand) {
    return this.makeAuthenticatedRequest("/api/time-entries", {
      method: "POST",
      body: JSON.stringify(timeEntryData),
    });
  }

  async updateTimeEntry(entryId: string, data: Partial<CreateTimeEntryCommand>) {
    return this.makeAuthenticatedRequest(`/api/time-entries/${entryId}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  async deleteTimeEntry(entryId: string) {
    return this.makeAuthenticatedRequest(`/api/time-entries/${entryId}`, {
      method: "DELETE",
    });
  }

  async generateInvoice(invoiceData: GenerateInvoiceCommand) {
    return this.makeAuthenticatedRequest("/api/invoices/generate", {
      method: "POST",
      body: JSON.stringify(invoiceData),
    });
  }

  async updateInvoice(invoiceId: string, data: any) {
    return this.makeAuthenticatedRequest(`/api/invoices/${invoiceId}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  async deleteInvoice(invoiceId: string) {
    return this.makeAuthenticatedRequest(`/api/invoices/${invoiceId}`, {
      method: "DELETE",
    });
  }

  async markInvoiceAsPaid(invoiceId: string, isPaid: boolean) {
    return this.makeAuthenticatedRequest(`/api/invoices/${invoiceId}`, {
      method: "PATCH",
      body: JSON.stringify({ is_paid: isPaid }),
    });
  }

  async exportTimeEntries(filters?: any) {
    const queryParams = filters ? new URLSearchParams(filters).toString() : "";
    const endpoint = `/api/time-entries/export${queryParams ? `?${queryParams}` : ""}`;
    return this.makeAuthenticatedRequest(endpoint, {
      method: "GET",
    });
  }

  async downloadInvoicePDF(invoiceId: string) {
    const baseURL = process.env.PLAYWRIGHT_BASE_URL || "http://localhost:3000";
    const url = `${baseURL}/api/invoices/${invoiceId}/pdf`;

    // Use context.request which shares cookies with the browser context
    const response = await this.page.context().request.fetch(url, {
      method: "GET",
    });

    if (!response.ok()) {
      throw new Error(`PDF download failed: ${response.status()} ${response.statusText()}`);
    }

    return response.body();
  }

  async lookupNIP(nip: string) {
    return this.makeAuthenticatedRequest(`/api/clients/lookup-nip?nip=${nip}`, {
      method: "GET",
    });
  }

  async updateProfile(profileData: any) {
    return this.makeAuthenticatedRequest("/api/profile", {
      method: "PUT",
      body: JSON.stringify(profileData),
    });
  }

  /**
   * Creates multiple test invoices for pagination testing
   * @param count Number of invoices to create (default: 25 for pagination)
   * @param clientId Client ID to associate invoices with
   * @returns Array of created invoice IDs
   */
  async createMultipleTestInvoices(count = 25, clientId?: string): Promise<string[]> {
    const invoiceIds: string[] = [];

    // If no client provided, create one
    let testClientId = clientId;
    if (!testClientId) {
      const uniqueId = `${Date.now()}-${Math.random().toString(36).substring(7)}`;
      const client = await this.createTestClient({
        name: `Pagination Test Client ${uniqueId}`,
        tax_id: `${String(Date.now()).slice(-10)}`,
        email: `pagination-test-${uniqueId}@client.com`,
        phone: "",
        default_hourly_rate: 150,
        default_currency: "PLN",
        street: "Test Street 123",
        city: "Warsaw",
        postal_code: "00-001",
        country: "Poland",
      });
      testClientId = client.id;
    }

    // Create invoices in batches to avoid overwhelming the API
    const batchSize = 5;
    for (let i = 0; i < count; i += batchSize) {
      const batchPromises = [];
      const remaining = Math.min(batchSize, count - i);

      if (!testClientId) {
        throw new Error("Client ID is required but not provided");
      }

      for (let j = 0; j < remaining; j++) {
        const invoiceNumber = i + j + 1;
        const invoiceData = {
          client_id: testClientId,
          invoice_number: `TEST/${new Date().getFullYear()}/${String(invoiceNumber).padStart(4, "0")}`,
          issue_date: new Date().toISOString().split("T")[0],
          due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
          currency: "PLN",
          is_manual: true,
          items: [
            {
              description: `Test Service ${invoiceNumber}`,
              quantity: 1,
              unit_price: 100 + invoiceNumber,
              vat_rate: 23,
            },
          ],
          notes: `Test invoice ${invoiceNumber} for pagination testing`,
        };

        batchPromises.push(
          this.generateInvoice(invoiceData)
            .then((invoice) => {
              invoiceIds.push(invoice.id);
              return invoice.id;
            })
            .catch((error) => {
              console.warn(`Failed to create invoice ${invoiceNumber}:`, error);
              return null;
            })
        );
      }

      await Promise.all(batchPromises);

      // Small delay between batches to avoid rate limiting
      if (i + batchSize < count) {
        await this.page.waitForTimeout(500);
      }
    }

    return invoiceIds.filter((id) => id !== null);
  }

  async uploadLogo(formData: FormData) {
    if (!this.page) {
      throw new Error("Page not set. Call setPage() first.");
    }

    const baseURL = process.env.PLAYWRIGHT_BASE_URL || "http://localhost:3000";
    const url = `${baseURL}/api/profile/upload-logo`;

    // Use context.request which shares cookies with the browser context
    const response = await this.page.context().request.fetch(url, {
      method: "POST",
      multipart: formData as any, // Playwright expects multipart option for FormData
    });

    if (!response.ok()) {
      throw new Error(`Upload failed: ${response.status()} ${response.statusText()}`);
    }

    return response.json();
  }
}
