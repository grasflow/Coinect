import type { Database, Tables } from "./db/database.types";

// ===================================
// BASE ENTITY TYPES (from database)
// ===================================

export type Profile = Tables<"profiles">;
export type Client = Tables<"clients">;
export type Tag = Tables<"tags">;
export type TimeEntry = Tables<"time_entries">;
export type Invoice = Tables<"invoices">;
export type InvoiceItem = Tables<"invoice_items">;
export type InvoiceItemTimeEntry = Tables<"invoice_item_time_entries">;
export type TimeEntryTag = Tables<"time_entry_tags">;
export type AIInsightData = Tables<"ai_insights_data">;
export type ExchangeRateCache = Tables<"exchange_rate_cache">;

// Enums
export type Currency = Database["public"]["Enums"]["currency_enum"];
export type InvoiceStatus = Database["public"]["Enums"]["invoice_status_enum"];

// ===================================
// PROFILE DTOs
// ===================================

// GET /rest/v1/profiles?id=eq.{user_id}
export type ProfileDTO = Profile;

// PATCH /rest/v1/profiles?id=eq.{user_id}
export type UpdateProfileCommand = Partial<
  Omit<Profile, "id" | "created_at" | "updated_at" | "onboarding_completed" | "onboarding_step">
>;

// POST /api/profile/upload-logo
export interface UploadLogoResponse {
  logo_url: string;
  message: string;
}

// ===================================
// CLIENT DTOs
// ===================================

// GET /rest/v1/clients
export type ClientDTO = Client;

// POST /rest/v1/clients
export type CreateClientCommand = Omit<Client, "id" | "user_id" | "created_at" | "updated_at" | "deleted_at">;

// PATCH /rest/v1/clients?id=eq.{client_id}
export type UpdateClientCommand = Partial<Omit<Client, "id" | "user_id" | "created_at" | "updated_at" | "deleted_at">>;

// GET /api/clients/{client_id}/stats
export interface ClientStatsDTO {
  client_id: string;
  total_hours: string;
  total_invoices: number;
  total_revenue: string;
  currency: Currency;
  unbilled_hours: string;
  unbilled_amount: string;
  last_invoice_date: string | null;
  average_hourly_rate: string;
}

// ===================================
// TAG DTOs
// ===================================

// GET /rest/v1/tags
export type TagDTO = Tag;

// POST /rest/v1/tags
export type CreateTagCommand = Pick<Tag, "name">;

// ===================================
// TIME ENTRY DTOs
// ===================================

// GET /rest/v1/time_entries (with relations)
export type TimeEntryWithRelationsDTO = TimeEntry & {
  client?: {
    name: string;
  } | null;
  invoice?: {
    id: string;
    deleted_at: string | null;
  } | null;
  tags?: {
    tag: {
      name: string;
    };
  }[];
};

// GET /rest/v1/time_entries?id=eq.{entry_id} (full relations)
export type TimeEntryDetailDTO = TimeEntry & {
  client?: Client | null;
  tags?: {
    tag: Tag;
  }[];
};

// POST /api/time-entries
export interface CreateTimeEntryCommand {
  client_id: string;
  date: string;
  hours: number;
  hourly_rate?: number;
  currency?: Currency;
  public_description?: string;
  private_note?: string;
  tag_ids?: string[];
}

// POST /api/time-entries response
export type CreateTimeEntryResponse = TimeEntry & {
  tags?: {
    id: string;
    name: string;
  }[];
};

// PUT /api/time-entries/{entry_id}
export interface UpdateTimeEntryCommand {
  date?: string;
  hours?: number;
  hourly_rate?: number;
  currency?: Currency;
  public_description?: string;
  private_note?: string;
  tag_ids?: string[];
}

// PUT /api/time-entries/{entry_id} response
export type UpdateTimeEntryResponse = TimeEntry & {
  tags?: {
    id: string;
    name: string;
  }[];
};

// GET /api/time-entries/autocomplete
export interface AutocompleteResponse {
  suggestions: string[];
}

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
  items?: (InvoiceItem & {
    time_entries?: {
      time_entry: Pick<TimeEntry, "id" | "date" | "hours">;
    }[];
  })[];
};

// POST /api/invoices/generate
export interface GenerateInvoiceCommand {
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

// POST /api/invoices/generate response
export interface GenerateInvoiceResponse {
  id: string;
  invoice_number: string;
  gross_amount: string;
  currency: Currency;
  pdf_url: string;
  message: string;
}

// PUT /api/invoices/{invoice_id}
export interface UpdateInvoiceCommand {
  issue_date?: string;
  sale_date?: string;
  vat_rate?: number;
  items?: {
    position: number;
    description: string;
    quantity: number;
    unit_price: number;
  }[];
  custom_exchange_rate?: number | null;
}

// PUT /api/invoices/{invoice_id} response
export interface UpdateInvoiceResponse {
  id: string;
  invoice_number: string;
  gross_amount: string;
  currency: Currency;
  pdf_url: string;
  is_edited: boolean;
  edited_at: string;
  message: string;
}

// PATCH /rest/v1/invoices (mark as paid)
export interface MarkInvoiceAsPaidCommand {
  is_paid: boolean;
  status: InvoiceStatus;
}

// POST /api/invoices/import
export interface ImportInvoicesResponse {
  success: boolean;
  imported_count: number;
  created_clients: number;
  errors: {
    row: number;
    error: string;
  }[];
  message: string;
}

// ===================================
// EXCHANGE RATE DTOs
// ===================================

// GET /api/exchange-rates/{currency}/{date}
export interface ExchangeRateDTO {
  currency: Currency;
  date: string;
  rate: string;
  source: "cache" | "api";
}

// GET /api/exchange-rates/latest
export interface LatestExchangeRatesDTO {
  date: string;
  rates: {
    EUR: string;
    USD: string;
  };
}

// ===================================
// AI INSIGHTS DTOs
// ===================================

// GET /api/ai-insights/status
export interface AIInsightsStatusDTO {
  unlocked: boolean;
  entries_with_notes: number;
  threshold: number;
  progress_percentage: number;
  message: string;
}

// GET /rest/v1/ai_insights_data
export type AIInsightDataDTO = AIInsightData;

// POST /api/ai-insights/analyze
export interface AIInsightsAnalysisDTO {
  summary: string;
  work_patterns: {
    peak_days: string[];
    average_hours_per_week: number;
    consistency_score: number;
    insights: string[];
  };
  rate_analysis: {
    current_average_rate: number;
    rate_range: {
      min: number;
      max: number;
    };
    optimization_potential: string;
    recommendations: string[];
  };
  productivity_insights: {
    most_productive_periods: string[];
    suggestions: string[];
  };
  action_items: string[];
  generated_at: string;
}

// ===================================
// DASHBOARD DTOs
// ===================================

// GET /api/dashboard/summary
export interface DashboardSummaryDTO {
  clients_count: number;
  unbilled_hours: string;
  recent_time_entries: {
    id: string;
    date: string;
    client_name: string;
    hours: string;
    public_description: string | null;
  }[];
  ai_insights_progress: {
    unlocked: boolean;
    entries_with_notes: number;
    threshold: number;
  };
  current_month_invoices: {
    total_gross_amount_pln: number;
    count: number;
    manual_count: number;
    time_entries_count: number;
  };
  recent_invoices: {
    id: string;
    invoice_number: string;
    client_name: string;
    gross_amount: number;
    currency: string;
    issue_date: string;
    is_manual: boolean;
  }[];
}

// GET /api/notifications/unbilled-reminder
export interface UnbilledReminderDTO {
  show_notification: boolean;
  unbilled_hours: string;
  message: string | null;
}

// ===================================
// ERROR RESPONSE DTO
// ===================================

export interface ErrorResponse {
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
}

// ===================================
// COMMON ERROR CODES
// ===================================

export const ErrorCodes = {
  UNAUTHORIZED: "UNAUTHORIZED",
  FORBIDDEN: "FORBIDDEN",
  NOT_FOUND: "NOT_FOUND",
  VALIDATION_ERROR: "VALIDATION_ERROR",
  CONFLICT: "CONFLICT",
  ALREADY_INVOICED: "ALREADY_INVOICED",
  EXCHANGE_RATE_UNAVAILABLE: "EXCHANGE_RATE_UNAVAILABLE",
  PDF_GENERATION_FAILED: "PDF_GENERATION_FAILED",
  UPLOAD_FAILED: "UPLOAD_FAILED",
} as const;

export type ErrorCode = (typeof ErrorCodes)[keyof typeof ErrorCodes];

// ===================================
// UTILITY TYPES
// ===================================

// Paginated response wrapper
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  limit: number;
  offset: number;
}

// API Success response wrapper
export interface SuccessResponse<T> {
  data: T;
  message?: string;
}
