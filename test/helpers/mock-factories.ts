import type { Database } from "@/db/database.types";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];
type Client = Database["public"]["Tables"]["clients"]["Row"];
type TimeEntry = Database["public"]["Tables"]["time_entries"]["Row"];
type Invoice = Database["public"]["Tables"]["invoices"]["Row"];

export const mockProfile = (overrides?: Partial<Profile>): Profile => ({
  id: "mock-user-id",
  email: "test@example.com",
  full_name: "Test User",
  avatar_url: null,
  locale: "pl",
  currency: "PLN",
  hourly_rate: 100,
  company_name: "Test Company",
  company_nip: "1234567890",
  company_address: "ul. Testowa 1, 00-001 Warszawa",
  bank_account_number: "PL12345678901234567890123456",
  invoice_number_format: "FV/{YYYY}/{MM}/{NN}",
  invoice_number_counter: 1,
  logo_url: null,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  ...overrides,
});

export const mockClient = (overrides?: Partial<Client>): Client => ({
  id: "mock-client-id",
  user_id: "mock-user-id",
  name: "Test Client",
  email: "client@example.com",
  company_name: "Client Company",
  nip: "9876543210",
  address: "ul. Klienta 2, 00-002 Warszawa",
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  ...overrides,
});

export const mockTimeEntry = (overrides?: Partial<TimeEntry>): TimeEntry => ({
  id: "mock-time-entry-id",
  user_id: "mock-user-id",
  client_id: "mock-client-id",
  description: "Test task",
  start_time: new Date().toISOString(),
  end_time: null,
  duration_minutes: null,
  hourly_rate: 100,
  is_billable: true,
  is_invoiced: false,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  ...overrides,
});

export const mockInvoice = (overrides?: Partial<Invoice>): Invoice => ({
  id: "mock-invoice-id",
  user_id: "mock-user-id",
  client_id: "mock-client-id",
  invoice_number: "FV/2025/10/001",
  issue_date: new Date().toISOString().split("T")[0],
  due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
  status: "draft",
  currency: "PLN",
  subtotal: 1000,
  tax_rate: 23,
  tax_amount: 230,
  total: 1230,
  notes: null,
  payment_terms: "Zapłata w ciągu 30 dni",
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  ...overrides,
});
