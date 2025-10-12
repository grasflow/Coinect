import type { Database, Tables } from './db/database.types';

// ===================================
// BASE ENTITY TYPES (from database)
// ===================================

export type Profile = Tables<'profiles'>;
export type Client = Tables<'clients'>;
export type Tag = Tables<'tags'>;
export type TimeEntry = Tables<'time_entries'>;
export type Invoice = Tables<'invoices'>;
export type InvoiceItem = Tables<'invoice_items'>;
export type InvoiceItemTimeEntry = Tables<'invoice_item_time_entries'>;
export type TimeEntryTag = Tables<'time_entry_tags'>;
export type AIInsightData = Tables<'ai_insights_data'>;
export type ExchangeRateCache = Tables<'exchange_rate_cache'>;

// Enums
export type Currency = Database['public']['Enums']['currency_enum'];
export type InvoiceStatus = Database['public']['Enums']['invoice_status_enum'];

// ===================================
// PROFILE DTOs
// ===================================

// GET /rest/v1/profiles?id=eq.{user_id}
export type ProfileDTO = Profile;

// PATCH /rest/v1/profiles?id=eq.{user_id}
export type UpdateProfileCommand = Partial<
  Omit<Profile, 'id' | 'created_at' | 'updated_at' | 'onboarding_completed' | 'onboarding_step'>
>;

// PATCH /rest/v1/profiles (onboarding)
export type UpdateOnboardingCommand = Pick<Profile, 'onboarding_step' | 'onboarding_completed'>;

// POST /api/profile/upload-logo
export type UploadLogoResponse = {
  logo_url: string;
  message: string;
};

// ===================================
// CLIENT DTOs
// ===================================

// GET /rest/v1/clients
export type ClientDTO = Client;

// POST /rest/v1/clients
export type CreateClientCommand = Omit<
  Client,
  'id' | 'user_id' | 'created_at' | 'updated_at' | 'deleted_at'
>;

// PATCH /rest/v1/clients?id=eq.{client_id}
export type UpdateClientCommand = Partial<
  Omit<Client, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'deleted_at'>
>;

// GET /api/clients/{client_id}/stats
export type ClientStatsDTO = {
  client_id: string;
  total_hours: string;
  total_invoices: number;
  total_revenue: string;
  currency: Currency;
  unbilled_hours: string;
  unbilled_amount: string;
  last_invoice_date: string | null;
  average_hourly_rate: string;
};

// ===================================
// TAG DTOs
// ===================================

// GET /rest/v1/tags
export type TagDTO = Tag;

// POST /rest/v1/tags
export type CreateTagCommand = Pick<Tag, 'name'>;

// ===================================
// TIME ENTRY DTOs
// ===================================

// GET /rest/v1/time_entries (with relations)
export type TimeEntryWithRelationsDTO = TimeEntry & {
  client?: {
    name: string;
  } | null;
  tags?: Array<{
    tag: {
      name: string;
    };
  }>;
};

// GET /rest/v1/time_entries?id=eq.{entry_id} (full relations)
export type TimeEntryDetailDTO = TimeEntry & {
  client?: Client | null;
  tags?: Array<{
    tag: Tag;
  }>;
};

// POST /api/time-entries
export type CreateTimeEntryCommand = {
  client_id: string;
  date: string;
  hours: number;
  hourly_rate?: number;
  currency?: Currency;
  public_description?: string;
  private_note?: string;
  tag_ids?: string[];
};

// POST /api/time-entries response
export type CreateTimeEntryResponse = TimeEntry & {
  tags?: Array<{
    id: string;
    name: string;
  }>;
};

// PUT /api/time-entries/{entry_id}
export type UpdateTimeEntryCommand = {
  date?: string;
  hours?: number;
  hourly_rate?: number;
  currency?: Currency;
  public_description?: string;
  private_note?: string;
  tag_ids?: string[];
};

// PUT /api/time-entries/{entry_id} response
export type UpdateTimeEntryResponse = TimeEntry & {
  tags?: Array<{
    id: string;
    name: string;
  }>;
};

// GET /api/time-entries/autocomplete
export type AutocompleteResponse = {
  suggestions: string[];
};

// ===================================
// INVOICE DTOs
// ===================================

// GET /rest/v1/invoices (with client info)
export type InvoiceListItemDTO = Invoice & {
  client?: {
    name: string;
    tax_id: string | null;
  } | null;
};

// GET /rest/v1/invoices?id=eq.{invoice_id} (full relations)
export type InvoiceDetailDTO = Invoice & {
  client?: Client | null;
  items?: Array<
    InvoiceItem & {
      time_entries?: Array<{
        time_entry: Pick<TimeEntry, 'id' | 'date' | 'hours'>;
      }>;
    }
  >;
};

// POST /api/invoices/generate
export type GenerateInvoiceCommand = {
  client_id: string;
  issue_date: string;
  sale_date: string;
  vat_rate: number;
  time_entry_ids: string[];
  items: Array<{
    description: string;
    time_entry_ids: string[];
  }>;
  custom_exchange_rate?: number | null;
};

// POST /api/invoices/generate response
export type GenerateInvoiceResponse = {
  id: string;
  invoice_number: string;
  gross_amount: string;
  currency: Currency;
  pdf_url: string;
  message: string;
};

// PUT /api/invoices/{invoice_id}
export type UpdateInvoiceCommand = {
  issue_date?: string;
  sale_date?: string;
  vat_rate?: number;
  items?: Array<{
    position: number;
    description: string;
    quantity: number;
    unit_price: number;
  }>;
  custom_exchange_rate?: number | null;
};

// PUT /api/invoices/{invoice_id} response
export type UpdateInvoiceResponse = {
  id: string;
  invoice_number: string;
  gross_amount: string;
  currency: Currency;
  pdf_url: string;
  is_edited: boolean;
  edited_at: string;
  message: string;
};

// PATCH /rest/v1/invoices (mark as paid)
export type MarkInvoiceAsPaidCommand = {
  is_paid: boolean;
  status: InvoiceStatus;
};

// POST /api/invoices/import
export type ImportInvoicesResponse = {
  success: boolean;
  imported_count: number;
  created_clients: number;
  errors: Array<{
    row: number;
    error: string;
  }>;
  message: string;
};

// ===================================
// EXCHANGE RATE DTOs
// ===================================

// GET /api/exchange-rates/{currency}/{date}
export type ExchangeRateDTO = {
  currency: Currency;
  date: string;
  rate: string;
  source: 'cache' | 'api';
};

// GET /api/exchange-rates/latest
export type LatestExchangeRatesDTO = {
  date: string;
  rates: {
    EUR: string;
    USD: string;
  };
};

// ===================================
// AI INSIGHTS DTOs
// ===================================

// GET /api/ai-insights/status
export type AIInsightsStatusDTO = {
  unlocked: boolean;
  entries_with_notes: number;
  threshold: number;
  progress_percentage: number;
  message: string;
};

// GET /rest/v1/ai_insights_data
export type AIInsightDataDTO = AIInsightData;

// ===================================
// DASHBOARD DTOs
// ===================================

// GET /api/dashboard/summary
export type DashboardSummaryDTO = {
  clients_count: number;
  unbilled_hours: string;
  unpaid_invoices: {
    PLN: string;
    EUR: string;
    USD: string;
  };
  recent_time_entries: Array<{
    id: string;
    date: string;
    client_name: string;
    hours: string;
    public_description: string | null;
  }>;
  recent_invoices: Array<{
    id: string;
    invoice_number: string;
    client_name: string;
    gross_amount: string;
    currency: Currency;
    is_paid: boolean;
  }>;
  ai_insights_progress: {
    unlocked: boolean;
    entries_with_notes: number;
    threshold: number;
  };
  onboarding: {
    completed: boolean;
    current_step: number;
  };
};

// GET /api/notifications/unbilled-reminder
export type UnbilledReminderDTO = {
  show_notification: boolean;
  unbilled_hours: string;
  message: string | null;
};

// ===================================
// ERROR RESPONSE DTO
// ===================================

export type ErrorResponse = {
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
};

// ===================================
// COMMON ERROR CODES
// ===================================

export const ErrorCodes = {
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  CONFLICT: 'CONFLICT',
  ALREADY_INVOICED: 'ALREADY_INVOICED',
  EXCHANGE_RATE_UNAVAILABLE: 'EXCHANGE_RATE_UNAVAILABLE',
  PDF_GENERATION_FAILED: 'PDF_GENERATION_FAILED',
  UPLOAD_FAILED: 'UPLOAD_FAILED',
} as const;

export type ErrorCode = (typeof ErrorCodes)[keyof typeof ErrorCodes];

// ===================================
// UTILITY TYPES
// ===================================

// Paginated response wrapper
export type PaginatedResponse<T> = {
  data: T[];
  total: number;
  limit: number;
  offset: number;
};

// API Success response wrapper
export type SuccessResponse<T> = {
  data: T;
  message?: string;
};

