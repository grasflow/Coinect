import type { Currency, TimeEntryWithRelationsDTO, InvoiceDetailDTO, InvoiceListItemDTO, ClientDTO } from "@/types";

// ===================================
// INVOICE GENERATOR VIEW MODELS
// ===================================

/**
 * Manualna pozycja faktury
 */
export interface ManualItem {
  id: string; // UUID dla identyfikacji w UI
  description: string;
  quantity: number;
  unitPrice: number;
  netAmount: number; // quantity × unitPrice
}

/**
 * Stan generatora faktur - używany przez cały proces generowania
 */
export interface InvoiceGeneratorState {
  step: 1 | 2 | 3; // 1: wybór klienta, 2: wybór wpisów, 3: ustawienia i podsumowanie
  clientId?: string;
  invoiceMode: "time_entries" | "manual"; // Tryb generowania faktury
  selectedTimeEntryIds: string[];
  items: InvoiceItemViewModel[];
  manualItems: ManualItem[]; // Manualne pozycje faktury
  settings: InvoiceSettingsViewModel;
  summary: InvoiceSummaryViewModel;
}

/**
 * Model pozycji faktury w edytorze
 * Używany zarówno w generatorze jak i edycji
 */
export interface InvoiceItemViewModel {
  id?: string; // UUID pozycji (opcjonalne przy tworzeniu)
  position: number; // Kolejność na fakturze
  description: string; // Edytowalny opis usługi
  timeEntryIds: string[]; // Przypisane wpisy czasu
  timeEntries: TimeEntryWithRelationsDTO[]; // Pełne dane wpisów (do wyświetlenia)
  quantity: number; // Suma godzin
  unitPrice: number; // Stawka (z pierwszego wpisu lub średnia)
  netAmount: number; // quantity × unitPrice
  isModified?: boolean; // Czy pozycja była edytowana (dla widoku edycji)
}

/**
 * Ustawienia faktury (daty, VAT, kurs)
 */
export interface InvoiceSettingsViewModel {
  issueDate: Date; // Data wystawienia
  saleDate: Date; // Data sprzedaży
  vatRate: number; // Stawka VAT (23, 8, 0)
  exchangeRate?: number | null; // Kurs waluty (jeśli EUR/USD)
  isCustomExchangeRate?: boolean; // Czy kurs został ręcznie nadpisany
}

/**
 * Podsumowanie kwot faktury
 */
export interface InvoiceSummaryViewModel {
  netAmount: number; // Suma netto
  vatRate: number; // Stawka VAT
  vatAmount: number; // Kwota VAT
  grossAmount: number; // Suma brutto
  currency: Currency; // Waluta faktury
  exchangeRate?: number | null; // Kurs waluty (jeśli obca)
  grossAmountPLN?: number | null; // Suma brutto w PLN (jeśli obca waluta)
}

// ===================================
// INVOICE LIST VIEW MODELS
// ===================================

/**
 * Stan filtrów listy faktur
 */
export interface InvoicesFilterState {
  clientId?: string; // "all" lub UUID klienta
  dateRange?: { from: Date; to: Date }; // Zakres dat
  status: "all" | "paid" | "unpaid"; // Status płatności
  currency?: Currency | "all"; // Filtr waluty
  page: number; // Strona (dla paginacji)
  pageSize: number; // Liczba elementów na stronę
}

/**
 * Model do wyświetlania w tabeli faktur
 * Rozszerza DTO o dodatkowe pola obliczane
 */
export interface InvoiceListViewModel {
  id: string;
  invoiceNumber: string;
  issueDate: string;
  clientName: string;
  clientTaxId?: string;
  grossAmount: number;
  currency: Currency;
  isPaid: boolean;
  status: "paid" | "unpaid";
  isEdited: boolean;
  editedAt?: string;
  pdfUrl?: string;
}

// ===================================
// INVOICE EDIT VIEW MODELS
// ===================================

/**
 * Stan widoku edycji faktury
 */
export interface InvoiceEditState {
  invoice: InvoiceDetailDTO; // InvoiceDetailDTO - oryginalne dane faktury
  items: InvoiceItemViewModel[]; // Edytowalne pozycje
  settings: InvoiceSettingsViewModel; // Edytowalne ustawienia
  summary: InvoiceSummaryViewModel; // Przeliczone podsumowanie
  isModified: boolean; // Czy cokolwiek zostało zmienione
  showWarning: boolean; // Czy pokazać banner ostrzegawczy
}

/**
 * Edytowalna pozycja faktury (dla widoku edycji)
 * Rozszerza podstawowy model o dodatkowe pola
 */
export interface EditableInvoiceItemViewModel extends InvoiceItemViewModel {
  originalDescription?: string; // Oryginalny opis (do porównania)
  originalQuantity?: number; // Oryginalna ilość
  originalUnitPrice?: number; // Oryginalna stawka
  isNew?: boolean; // Czy pozycja została dodana podczas edycji
}

// ===================================
// EXCHANGE RATE
// ===================================

/**
 * Stan pobierania kursu waluty
 */
export interface ExchangeRateState {
  rate: number | null;
  isLoading: boolean;
  error: string | null;
  source: "cache" | "api" | "custom";
  date: string;
}

// ===================================
// IMPORT CSV
// ===================================

/**
 * Wynik importu faktur z CSV
 */
export interface ImportInvoicesResult {
  success: boolean;
  importedCount: number;
  createdClients: number;
  errors: {
    row: number;
    error: string;
  }[];
  message: string;
}

// ===================================
// COMPONENT PROPS
// ===================================

export interface ClientSelectorProps {
  value?: string;
  onChange: (clientId: string) => void;
  disabled?: boolean;
  mode?: "all" | "with_unbilled_time_entries"; // Tryb filtrowania klientów
}

export interface UnbilledTimeEntriesSelectorProps {
  clientId: string;
  selectedIds: string[];
  onSelectionChange: (selectedIds: string[]) => void;
}

export interface InvoiceItemsEditorProps {
  items: InvoiceItemViewModel[];
  onChange: (items: InvoiceItemViewModel[]) => void;
  editable?: boolean;
}

export interface ManualItemsEditorProps {
  items: ManualItem[];
  onChange: (items: ManualItem[]) => void;
}

export interface InvoiceSettingsPanelProps {
  settings: InvoiceSettingsViewModel;
  onChange: (updates: Partial<InvoiceSettingsViewModel>) => void;
  currency: Currency;
}

export interface InvoiceSummaryPanelProps {
  summary: InvoiceSummaryViewModel;
  onAction: () => void;
  actionLabel: string;
  actionDisabled: boolean;
  isLoading?: boolean;
}

export interface InvoicesFiltersProps {
  filters: InvoicesFilterState;
  onChange: (filters: InvoicesFilterState) => void;
  clients: ClientDTO[];
}

export interface InvoiceRowProps {
  invoice: InvoiceListItemDTO;
  onDownloadPDF: (invoiceId: string) => void;
  onEdit: (invoiceId: string) => void;
  onTogglePaid: (invoiceId: string, isPaid: boolean) => void;
  onDelete: (invoiceId: string) => void;
}

export interface EditWarningBannerProps {
  onDismiss: () => void;
}

export interface ImportFromCSVButtonProps {
  onImportComplete: (result: ImportInvoicesResult) => void;
}
