# Plan implementacji widoków Faktur

## 1. Przegląd

Implementacja trzech powiązanych widoków do zarządzania fakturami w aplikacji Coinect:

1. **Generator Faktur** (`/invoices/new`) - Prowadzi użytkownika przez proces tworzenia nowej faktury z niezafakturowanych wpisów czasu
2. **Archiwum Faktur** (`/invoices`) - Wyświetla listę wszystkich wygenerowanych faktur z możliwością filtrowania, wyszukiwania i zarządzania
3. **Edycja Faktury** (`/invoices/:id/edit`) - Umożliwia pełną edycję wygenerowanej faktury z ostrzeżeniem o ryzykach księgowych

Widoki te realizują kluczową funkcjonalność aplikacji - automatyzację procesu fakturowania i zarządzania rozliczeniami freelancera.

## 2. Routing widoku

### 2.1. Struktura routingu
```
/invoices                    -> Lista faktur (Widok 8)
/invoices/new                -> Generator faktur (Widok 7)
/invoices/:id/edit           -> Edycja faktury (Widok 9)
/invoices/:id/pdf            -> Endpoint pobierania PDF (API)
```

### 2.2. Pliki Astro
- `src/pages/invoices/index.astro` - Strona listy faktur
- `src/pages/invoices/new.astro` - Strona generatora faktur
- `src/pages/invoices/[id]/edit.astro` - Strona edycji faktury

### 2.3. Endpointy API
- `src/pages/api/invoices/generate.ts` - POST - Generowanie faktury
- `src/pages/api/invoices/[id].ts` - PUT - Aktualizacja faktury
- `src/pages/api/invoices/[id]/pdf.ts` - GET - Pobieranie PDF
- `src/pages/api/invoices/import.ts` - POST - Import faktur z CSV
- `src/pages/api/exchange-rates/[currency]/[date].ts` - GET - Pobieranie kursu waluty

## 3. Struktura komponentów

### 3.1. Generator Faktur (`/invoices/new`)

```
InvoiceGeneratorView
├── InvoiceGeneratorHeader
├── InvoiceGeneratorStepper (wizualny wskaźnik kroków)
├── ClientSelector
│   └── Select (shadcn/ui)
├── UnbilledTimeEntriesSelector
│   ├── TimeEntryCheckboxGroup
│   │   └── TimeEntryCheckboxItem[]
│   └── TimeEntriesSummary
├── InvoiceItemsEditor
│   ├── ItemGroupEditor[]
│   │   ├── Input (opis)
│   │   ├── TimeEntriesList (readonly)
│   │   └── ItemSummary
│   └── AddItemButton
├── InvoiceSettingsPanel
│   ├── DatePicker (data wystawienia)
│   ├── DatePicker (data sprzedaży)
│   ├── VatRateSelector
│   ├── ExchangeRateInput (warunkowy - tylko dla EUR/USD)
│   └── ExchangeRateDisplay
└── InvoiceSummaryPanel
    ├── SummaryRow (netto)
    ├── SummaryRow (VAT)
    ├── SummaryRow (brutto)
    ├── SummaryRow (w PLN - jeśli waluta obca)
    └── GenerateInvoiceButton
```

### 3.2. Archiwum Faktur (`/invoices`)

```
InvoicesView
├── InvoicesHeader
│   ├── PageTitle
│   ├── CreateInvoiceButton
│   └── ImportFromCSVButton
├── InvoicesFilters
│   ├── ClientFilter (Select)
│   ├── DateRangeFilter (DateRangePicker)
│   ├── StatusFilter (Select)
│   ├── CurrencyFilter (Select)
│   └── ClearFiltersButton
├── InvoicesList
│   ├── InvoicesTable
│   │   ├── TableHeader
│   │   └── InvoiceRow[]
│   │       ├── InvoiceNumber
│   │       ├── InvoiceDate
│   │       ├── ClientName
│   │       ├── Amount
│   │       ├── Currency
│   │       ├── PaymentStatus
│   │       ├── EditedBadge (warunkowy)
│   │       └── InvoiceActions
│   │           ├── DownloadPDFButton
│   │           ├── EditInvoiceButton
│   │           ├── MarkAsPaidCheckbox
│   │           └── DeleteInvoiceButton
│   └── EmptyState
├── InvoicesSummary (suma kwot per waluta)
└── Pagination
```

### 3.3. Edycja Faktury (`/invoices/:id/edit`)

```
InvoiceEditView
├── InvoiceEditHeader
│   ├── BackButton
│   └── InvoiceNumber (readonly display)
├── EditWarningBanner (info o ryzykach księgowych)
├── InvoiceEditForm
│   ├── ClientInfoSection (readonly)
│   ├── InvoiceDatesSection
│   │   ├── DatePicker (data wystawienia)
│   │   └── DatePicker (data sprzedaży)
│   ├── InvoiceItemsEditor
│   │   └── EditableInvoiceItem[]
│   │       ├── Input (opis)
│   │       ├── Input (ilość/godziny)
│   │       ├── Input (stawka)
│   │       ├── CalculatedAmount (readonly)
│   │       └── ModifiedIndicator (jeśli zmieniono)
│   ├── VatRateInput
│   ├── ExchangeRateSection (warunkowy)
│   │   ├── ExchangeRateDisplay (oryginalny)
│   │   └── ExchangeRateInput (edytowalny)
│   └── InvoiceSummaryPanel (jak w generatorze)
└── InvoiceEditActions
    ├── CancelButton
    └── SaveChangesButton
```

## 4. Szczegóły komponentów

### 4.1. ClientSelector

**Opis:** Komponent wyboru klienta z listy rozwijanej. Wyświetla wszystkich aktywnych klientów użytkownika.

**Główne elementy:**
- `Select` z shadcn/ui
- `SelectTrigger` z placeholderem "Wybierz klienta"
- `SelectContent` z listą klientów
- `SelectItem` dla każdego klienta (wyświetla nazwę i opcjonalnie NIP)

**Obsługiwane zdarzenia:**
- `onValueChange(clientId: string)` - Wybór klienta, wywołuje ładowanie niezafakturowanych wpisów

**Warunki walidacji:**
- Klient musi być wybrany przed przejściem dalej
- Lista klientów nie może być pusta (sprawdzenie przy załadowaniu komponentu)

**Typy:**
- `ClientDTO` (z API)
- `ClientSelectorProps`

**Propsy:**
```typescript
interface ClientSelectorProps {
  value?: string;
  onChange: (clientId: string) => void;
  disabled?: boolean;
}
```

### 4.2. UnbilledTimeEntriesSelector

**Opis:** Komponent wyświetlający listę niezafakturowanych wpisów czasu dla wybranego klienta z checkboxami do selekcji.

**Główne elementy:**
- Nagłówek z liczbą dostępnych wpisów
- Checkbox "Zaznacz wszystkie"
- Lista `TimeEntryCheckboxItem` - każdy wiersz z:
  - Checkbox
  - Data
  - Liczba godzin
  - Stawka godzinowa
  - Opis publiczny
  - Kwota (obliczona: godziny × stawka)
- Podsumowanie na dole: suma godzin i suma kwot zaznaczonych wpisów

**Obsługiwane zdarzenia:**
- `onSelectionChange(selectedIds: string[])` - Zmiana zaznaczenia wpisów
- `onSelectAll()` - Zaznaczenie wszystkich wpisów
- `onDeselectAll()` - Odznaczenie wszystkich wpisów

**Warunki walidacji:**
- Co najmniej jeden wpis musi być zaznaczony
- Wszystkie zaznaczone wpisy muszą mieć tę samą walutę
- Wpisy nie mogą być już zafakturowane (sprawdzane przez API)

**Typy:**
- `TimeEntryWithRelationsDTO`
- `UnbilledTimeEntriesSelectorProps`

**Propsy:**
```typescript
interface UnbilledTimeEntriesSelectorProps {
  clientId: string;
  selectedIds: string[];
  onSelectionChange: (selectedIds: string[]) => void;
}
```

### 4.3. InvoiceItemsEditor

**Opis:** Komponent do grupowania i edycji pozycji faktury. Automatycznie grupuje wpisy według opisu publicznego, ale umożliwia ręczną edycję.

**Główne elementy:**
- Lista grup pozycji faktury
- Każda grupa zawiera:
  - Input z edytowalnym opisem pozycji (początkowo opis publiczny)
  - Lista powiązanych wpisów czasu (readonly: data, godziny)
  - Podsumowanie grupy: suma godzin, stawka, kwota netto
  - Przycisk usunięcia grupy
- Przycisk "Dodaj pozycję" (umożliwia stworzenie nowej grupy)
- Możliwość drag & drop do zmiany kolejności pozycji

**Obsługiwane zdarzenia:**
- `onItemsChange(items: InvoiceItemViewModel[])` - Zmiana pozycji
- `onDescriptionChange(itemIndex: number, description: string)` - Edycja opisu
- `onGroupMerge(itemIndex1: number, itemIndex2: number)` - Połączenie grup
- `onGroupSplit(itemIndex: number, timeEntryIds: string[])` - Rozdzielenie grupy

**Warunki walidacji:**
- Każda pozycja musi mieć niepusty opis
- Każda pozycja musi zawierać co najmniej jeden wpis czasu
- Wszystkie wpisy czasu muszą być przypisane do jakiejś pozycji

**Typy:**
- `InvoiceItemViewModel`
- `InvoiceItemsEditorProps`

**Propsy:**
```typescript
interface InvoiceItemsEditorProps {
  items: InvoiceItemViewModel[];
  onChange: (items: InvoiceItemViewModel[]) => void;
  editable?: boolean;
}

interface InvoiceItemViewModel {
  id?: string; // opcjonalne przy tworzeniu
  position: number;
  description: string;
  timeEntryIds: string[];
  timeEntries: TimeEntryWithRelationsDTO[];
  quantity: number; // suma godzin
  unitPrice: number; // stawka (z pierwszego wpisu lub średnia)
  netAmount: number; // quantity × unitPrice
}
```

### 4.4. InvoiceSettingsPanel

**Opis:** Panel z ustawieniami faktury: daty, stawka VAT, kurs waluty.

**Główne elementy:**
- `DatePicker` dla daty wystawienia (domyślnie: dziś)
- `DatePicker` dla daty sprzedaży (domyślnie: dziś)
- `VatRateSelector` - Select z opcjami: 23%, 8%, 0%, ZW (zwolniony)
- `ExchangeRateSection` (widoczny tylko dla EUR/USD):
  - Label "Kurs waluty"
  - Display aktualnego kursu z API NBP
  - Input do ręcznego nadpisania kursu
  - Ikona i tooltip informujący o źródle kursu (API vs ręczny)

**Obsługiwane zdarzenia:**
- `onIssueDateChange(date: Date)` - Zmiana daty wystawienia
- `onSaleDateChange(date: Date)` - Zmiana daty sprzedaży
- `onVatRateChange(rate: number)` - Zmiana stawki VAT
- `onExchangeRateChange(rate: number | null)` - Zmiana kursu waluty

**Warunki walidacji:**
- Data wystawienia jest wymagana
- Data sprzedaży jest wymagana
- Stawka VAT musi być wybrana
- Data sprzedaży nie może być późniejsza niż data wystawienia o więcej niż 30 dni (ostrzeżenie)
- Kurs waluty musi być liczbą > 0 (jeśli waluta obca)

**Typy:**
- `InvoiceSettingsViewModel`
- `InvoiceSettingsPanelProps`

**Propsy:**
```typescript
interface InvoiceSettingsPanelProps {
  settings: InvoiceSettingsViewModel;
  onChange: (settings: InvoiceSettingsViewModel) => void;
  currency: Currency;
}

interface InvoiceSettingsViewModel {
  issueDate: Date;
  saleDate: Date;
  vatRate: number;
  exchangeRate?: number | null;
  isCustomExchangeRate?: boolean;
}
```

### 4.5. InvoiceSummaryPanel

**Opis:** Panel podsumowania faktury z obliczonymi kwotami.

**Główne elementy:**
- Wiersz "Suma netto" z kwotą
- Wiersz "VAT (X%)" z kwotą VAT
- Wiersz "Suma brutto" z kwotą brutto (pogrubiony)
- Jeśli waluta obca:
  - Wiersz "Kurs waluty" z wartością
  - Wiersz "Suma brutto w PLN" z przeliczoną kwotą
- Przycisk "Generuj fakturę" (lub "Zapisz zmiany" w trybie edycji)

**Obsługiwane zdarzenia:**
- `onGenerate()` - Generowanie faktury (widok generatora)
- `onSave()` - Zapisanie zmian (widok edycji)

**Warunki walidacji:**
- Wszystkie kwoty muszą być >= 0
- Przycisk aktywny tylko gdy wszystkie warunki są spełnione

**Typy:**
- `InvoiceSummaryViewModel`
- `InvoiceSummaryPanelProps`

**Propsy:**
```typescript
interface InvoiceSummaryPanelProps {
  summary: InvoiceSummaryViewModel;
  onAction: () => void;
  actionLabel: string;
  actionDisabled: boolean;
  isLoading?: boolean;
}

interface InvoiceSummaryViewModel {
  netAmount: number;
  vatRate: number;
  vatAmount: number;
  grossAmount: number;
  currency: Currency;
  exchangeRate?: number | null;
  grossAmountPLN?: number | null;
}
```

### 4.6. InvoicesFilters

**Opis:** Panel filtrów do listy faktur.

**Główne elementy:**
- `ClientFilter` - Select z opcją "Wszyscy klienci"
- `DateRangeFilter` - DateRangePicker z presetami (ten miesiąc, ostatnie 3 miesiące, ten rok)
- `StatusFilter` - Select z opcjami: wszystkie, opłacone, nieopłacone
- `CurrencyFilter` - Select z opcjami: wszystkie, PLN, EUR, USD
- `ClearFiltersButton` - Przycisk do wyczyszczenia wszystkich filtrów

**Obsługiwane zdarzenia:**
- `onFiltersChange(filters: InvoicesFilterState)` - Zmiana filtrów

**Warunki walidacji:**
- Zakres dat: "od" nie może być późniejsze niż "do"

**Typy:**
- `InvoicesFilterState`
- `InvoicesFiltersProps`

**Propsy:**
```typescript
interface InvoicesFiltersProps {
  filters: InvoicesFilterState;
  onChange: (filters: InvoicesFilterState) => void;
  clients: ClientDTO[];
}

interface InvoicesFilterState {
  clientId?: string;
  dateRange?: { from: Date; to: Date };
  status: "all" | "paid" | "unpaid";
  currency?: Currency;
}
```

### 4.7. InvoiceRow

**Opis:** Komponent reprezentujący jeden wiersz w tabeli faktur.

**Główne elementy:**
- Numer faktury (link do edycji)
- Data wystawienia
- Nazwa klienta
- Kwota brutto + waluta
- Status płatności (checkbox)
- Badge "Edited" (jeśli `is_edited === true`) z tooltipem pokazującym datę ostatniej edycji
- Akcje:
  - Przycisk pobierania PDF
  - Przycisk edycji
  - Przycisk usunięcia (soft delete)

**Obsługiwane zdarzenia:**
- `onDownloadPDF(invoiceId: string)` - Pobieranie PDF
- `onEdit(invoiceId: string)` - Nawigacja do edycji
- `onTogglePaid(invoiceId: string, isPaid: boolean)` - Zmiana statusu płatności
- `onDelete(invoiceId: string)` - Usunięcie faktury

**Warunki walidacji:**
- Nie można usunąć opłaconej faktury bez potwierdzenia
- Badge "Edited" wyświetlany tylko gdy `is_edited === true`

**Typy:**
- `InvoiceListItemDTO`
- `InvoiceRowProps`

**Propsy:**
```typescript
interface InvoiceRowProps {
  invoice: InvoiceListItemDTO;
  onDownloadPDF: (invoiceId: string) => void;
  onEdit: (invoiceId: string) => void;
  onTogglePaid: (invoiceId: string, isPaid: boolean) => void;
  onDelete: (invoiceId: string) => void;
}
```

### 4.8. EditWarningBanner

**Opis:** Banner informacyjny o ryzykach edycji faktury.

**Główne elementy:**
- Ikona informacyjna
- Tekst ostrzeżenia: "Uwaga: Edycja faktury po wygenerowaniu może prowadzić do rozbieżności księgowych. Zalecamy tworzenie faktury korygującej dla istotnych zmian."
- Przycisk "Rozumiem" do zamknięcia bannera

**Obsługiwane zdarzenia:**
- `onDismiss()` - Zamknięcie bannera

**Warunki walidacji:**
- Banner wyświetlany tylko raz na sesję (localStorage)
- Wyświetlany tylko w widoku edycji

**Typy:**
- `EditWarningBannerProps`

**Propsy:**
```typescript
interface EditWarningBannerProps {
  onDismiss: () => void;
}
```

### 4.9. ImportFromCSVButton

**Opis:** Przycisk i dialog importu faktur z pliku CSV.

**Główne elementy:**
- Przycisk "Importuj z CSV"
- Dialog z:
  - Instrukcją formatu CSV
  - Linkiem do pobrania przykładowego pliku
  - Input do wyboru pliku
  - Przycisk "Importuj"
  - Pasek postępu (podczas importu)
  - Lista błędów (po imporcie)

**Obsługiwane zdarzenia:**
- `onFileSelect(file: File)` - Wybór pliku
- `onImport()` - Rozpoczęcie importu

**Warunki walidacji:**
- Plik musi mieć rozszerzenie .csv
- Plik nie może być większy niż 5MB
- Format CSV musi być zgodny z szablonem

**Typy:**
- `ImportFromCSVButtonProps`
- `ImportResult`

**Propsy:**
```typescript
interface ImportFromCSVButtonProps {
  onImportComplete: (result: ImportResult) => void;
}

interface ImportResult {
  success: boolean;
  importedCount: number;
  createdClients: number;
  errors: { row: number; error: string }[];
}
```

## 5. Typy

### 5.1. Typy bazowe (istniejące w types.ts)

```typescript
// DTO z API
export type InvoiceListItemDTO = Invoice & {
  client?: {
    name: string;
    tax_id: string | null;
  } | null;
};

export type InvoiceDetailDTO = Invoice & {
  client?: Client | null;
  items?: (InvoiceItem & {
    time_entries?: {
      time_entry: Pick<TimeEntry, "id" | "date" | "hours">;
    }[];
  })[];
};

export interface GenerateInvoiceCommand {
  client_id: string;
  issue_date: string;
  sale_date: string;
  vat_rate: number;
  time_entry_ids: string[];
  items: {
    description: string;
    time_entry_ids: string[];
  }[];
  custom_exchange_rate?: number | null;
}

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

export interface ExchangeRateDTO {
  currency: Currency;
  date: string;
  rate: string;
  source: "cache" | "api";
}
```

### 5.2. Nowe ViewModels do utworzenia

W pliku `src/components/features/invoices/types.ts`:

```typescript
import type { Currency, TimeEntryWithRelationsDTO } from "@/types";

// ===================================
// INVOICE GENERATOR VIEW MODELS
// ===================================

/**
 * Stan generatora faktur - używany przez cały proces generowania
 */
export interface InvoiceGeneratorState {
  step: 1 | 2 | 3; // 1: wybór klienta, 2: wybór wpisów, 3: ustawienia i podsumowanie
  clientId?: string;
  selectedTimeEntryIds: string[];
  items: InvoiceItemViewModel[];
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
  invoice: InvoiceDetailDTO; // Oryginalne dane faktury
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
  errors: Array<{
    row: number;
    error: string;
  }>;
  message: string;
}
```

## 6. Zarządzanie stanem

### 6.1. Custom Hooks

#### 6.1.1. useInvoiceGenerator

Hook zarządzający stanem całego procesu generowania faktury.

```typescript
// src/components/hooks/useInvoiceGenerator.ts
import { useState, useCallback, useEffect } from "react";
import type { InvoiceGeneratorState, InvoiceItemViewModel } from "@/components/features/invoices/types";

export function useInvoiceGenerator() {
  const [state, setState] = useState<InvoiceGeneratorState>({
    step: 1,
    selectedTimeEntryIds: [],
    items: [],
    settings: {
      issueDate: new Date(),
      saleDate: new Date(),
      vatRate: 23,
    },
    summary: {
      netAmount: 0,
      vatRate: 23,
      vatAmount: 0,
      grossAmount: 0,
      currency: "PLN",
    },
  });

  // Logika przejścia do kolejnego kroku
  const goToNextStep = useCallback(() => {
    setState(prev => ({ ...prev, step: (prev.step + 1) as 1 | 2 | 3 }));
  }, []);

  // Logika powrotu do poprzedniego kroku
  const goToPreviousStep = useCallback(() => {
    setState(prev => ({ ...prev, step: (prev.step - 1) as 1 | 2 | 3 }));
  }, []);

  // Wybór klienta
  const selectClient = useCallback((clientId: string) => {
    setState(prev => ({ ...prev, clientId }));
  }, []);

  // Wybór wpisów czasu
  const selectTimeEntries = useCallback((timeEntryIds: string[]) => {
    setState(prev => ({ ...prev, selectedTimeEntryIds: timeEntryIds }));
  }, []);

  // Grupowanie wpisów w pozycje faktury
  const setItems = useCallback((items: InvoiceItemViewModel[]) => {
    setState(prev => ({ ...prev, items }));
  }, []);

  // Aktualizacja ustawień
  const updateSettings = useCallback((settings: Partial<InvoiceSettingsViewModel>) => {
    setState(prev => ({ ...prev, settings: { ...prev.settings, ...settings } }));
  }, []);

  // Automatyczne przeliczanie podsumowania
  useEffect(() => {
    const netAmount = state.items.reduce((sum, item) => sum + item.netAmount, 0);
    const vatAmount = netAmount * (state.settings.vatRate / 100);
    const grossAmount = netAmount + vatAmount;

    setState(prev => ({
      ...prev,
      summary: {
        netAmount,
        vatRate: state.settings.vatRate,
        vatAmount,
        grossAmount,
        currency: prev.summary.currency,
        exchangeRate: state.settings.exchangeRate,
        grossAmountPLN: state.settings.exchangeRate
          ? grossAmount * state.settings.exchangeRate
          : null,
      },
    }));
  }, [state.items, state.settings.vatRate, state.settings.exchangeRate]);

  return {
    state,
    goToNextStep,
    goToPreviousStep,
    selectClient,
    selectTimeEntries,
    setItems,
    updateSettings,
  };
}
```

#### 6.1.2. useInvoices

Hook do zarządzania listą faktur z filtrowaniem i paginacją.

```typescript
// src/components/hooks/useInvoices.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { InvoiceListItemDTO, PaginatedResponse } from "@/types";
import type { InvoicesFilterState } from "@/components/features/invoices/types";

async function fetchInvoices(filters: InvoicesFilterState): Promise<PaginatedResponse<InvoiceListItemDTO>> {
  const params = new URLSearchParams();

  if (filters.clientId && filters.clientId !== "all") {
    params.append("client_id", filters.clientId);
  }

  if (filters.dateRange) {
    params.append("date_from", filters.dateRange.from.toISOString().split("T")[0]);
    params.append("date_to", filters.dateRange.to.toISOString().split("T")[0]);
  }

  if (filters.status !== "all") {
    params.append("status", filters.status);
  }

  if (filters.currency && filters.currency !== "all") {
    params.append("currency", filters.currency);
  }

  params.append("page", String(filters.page));
  params.append("page_size", String(filters.pageSize));

  const response = await fetch(`/api/invoices?${params.toString()}`);

  if (!response.ok) {
    throw new Error("Nie udało się pobrać faktur");
  }

  return response.json();
}

export function useInvoices(filters: InvoicesFilterState) {
  return useQuery({
    queryKey: ["invoices", filters],
    queryFn: () => fetchInvoices(filters),
  });
}

export function useToggleInvoicePaid() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ invoiceId, isPaid }: { invoiceId: string; isPaid: boolean }) => {
      const response = await fetch(`/api/invoices/${invoiceId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          is_paid: isPaid,
          status: isPaid ? "paid" : "unpaid",
        }),
      });

      if (!response.ok) throw new Error("Nie udało się zaktualizować statusu");

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
    },
  });
}

export function useDeleteInvoice() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (invoiceId: string) => {
      const response = await fetch(`/api/invoices/${invoiceId}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Nie udało się usunąć faktury");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
    },
  });
}
```

#### 6.1.3. useGenerateInvoice

Hook do generowania faktury z validacją i obsługą błędów.

```typescript
// src/components/hooks/useGenerateInvoice.ts
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { GenerateInvoiceCommand, GenerateInvoiceResponse } from "@/types";

async function generateInvoice(command: GenerateInvoiceCommand): Promise<GenerateInvoiceResponse> {
  const response = await fetch("/api/invoices/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(command),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || "Nie udało się wygenerować faktury");
  }

  return response.json();
}

export function useGenerateInvoice() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: generateInvoice,
    onSuccess: () => {
      // Unieważnienie zapytań po wygenerowaniu faktury
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      queryClient.invalidateQueries({ queryKey: ["time-entries"] });
    },
  });
}
```

#### 6.1.4. useExchangeRate

Hook do pobierania kursu waluty z cache lub API NBP.

```typescript
// src/components/hooks/useExchangeRate.ts
import { useQuery } from "@tanstack/react-query";
import type { Currency, ExchangeRateDTO } from "@/types";

async function fetchExchangeRate(currency: Currency, date: string): Promise<ExchangeRateDTO> {
  const response = await fetch(`/api/exchange-rates/${currency}/${date}`);

  if (!response.ok) {
    throw new Error("Nie udało się pobrać kursu waluty");
  }

  return response.json();
}

export function useExchangeRate(currency: Currency, date: Date | null, enabled: boolean = true) {
  const dateString = date?.toISOString().split("T")[0] || "";

  return useQuery({
    queryKey: ["exchange-rate", currency, dateString],
    queryFn: () => fetchExchangeRate(currency, dateString),
    enabled: enabled && !!date && (currency === "EUR" || currency === "USD"),
    staleTime: 1000 * 60 * 60 * 24, // 24h cache
  });
}
```

### 6.2. Context Providers

Nie jest wymagany żaden dodatkowy Context Provider. Wszystkie dane zarządzane są przez:
- React Query (queries i cache)
- Lokalne stany komponentów
- Custom hooks

## 7. Integracja API

### 7.1. Endpointy do wykorzystania

#### 7.1.1. GET /api/invoices

**Użycie:** Lista faktur w widoku archiwum

**Query Parameters:**
- `client_id` (optional)
- `date_from` (optional)
- `date_to` (optional)
- `status` (optional): "paid" | "unpaid"
- `currency` (optional): "PLN" | "EUR" | "USD"
- `page` (default: 1)
- `page_size` (default: 20)

**Response Type:** `PaginatedResponse<InvoiceListItemDTO>`

**Przykład:**
```typescript
const { data, isLoading } = useInvoices({
  clientId: "all",
  status: "unpaid",
  page: 1,
  pageSize: 20,
});
```

#### 7.1.2. GET /api/invoices/:id

**Użycie:** Szczegóły faktury w widoku edycji

**Response Type:** `InvoiceDetailDTO`

**Przykład:**
```typescript
const { data: invoice } = useQuery({
  queryKey: ["invoice", invoiceId],
  queryFn: async () => {
    const response = await fetch(`/api/invoices/${invoiceId}`);
    if (!response.ok) throw new Error("Nie udało się pobrać faktury");
    return response.json();
  },
});
```

#### 7.1.3. POST /api/invoices/generate

**Użycie:** Generowanie nowej faktury

**Request Type:** `GenerateInvoiceCommand`

```typescript
interface GenerateInvoiceCommand {
  client_id: string;
  issue_date: string; // YYYY-MM-DD
  sale_date: string; // YYYY-MM-DD
  vat_rate: number;
  time_entry_ids: string[];
  items: {
    description: string;
    time_entry_ids: string[];
  }[];
  custom_exchange_rate?: number | null;
}
```

**Response Type:** `GenerateInvoiceResponse`

```typescript
interface GenerateInvoiceResponse {
  id: string;
  invoice_number: string;
  gross_amount: string;
  currency: Currency;
  pdf_url: string;
  message: string;
}
```

**Przykład:**
```typescript
const { mutate: generateInvoice, isPending } = useGenerateInvoice();

generateInvoice({
  client_id: clientId,
  issue_date: "2025-01-15",
  sale_date: "2025-01-15",
  vat_rate: 23,
  time_entry_ids: selectedIds,
  items: items.map(item => ({
    description: item.description,
    time_entry_ids: item.timeEntryIds,
  })),
  custom_exchange_rate: customRate || null,
});
```

#### 7.1.4. PUT /api/invoices/:id

**Użycie:** Edycja faktury

**Request Type:** `UpdateInvoiceCommand`

```typescript
interface UpdateInvoiceCommand {
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
```

**Response Type:** `UpdateInvoiceResponse`

**Przykład:**
```typescript
const response = await fetch(`/api/invoices/${invoiceId}`, {
  method: "PUT",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    issue_date: "2025-01-16",
    vat_rate: 23,
    items: editedItems,
  }),
});
```

#### 7.1.5. GET /api/exchange-rates/:currency/:date

**Użycie:** Pobieranie kursu waluty dla faktury

**URL Parameters:**
- `currency`: "EUR" | "USD"
- `date`: YYYY-MM-DD

**Response Type:** `ExchangeRateDTO`

```typescript
interface ExchangeRateDTO {
  currency: Currency;
  date: string;
  rate: string;
  source: "cache" | "api";
}
```

**Przykład:**
```typescript
const { data: exchangeRate, isLoading } = useExchangeRate(
  "EUR",
  issueDate,
  currency === "EUR"
);
```

#### 7.1.6. GET /api/time-entries

**Użycie:** Pobieranie niezafakturowanych wpisów czasu

**Query Parameters:**
- `client_id`: string
- `status`: "unbilled"

**Response Type:** `PaginatedResponse<TimeEntryWithRelationsDTO>`

**Przykład:**
```typescript
const { data: unbilledEntries } = useQuery({
  queryKey: ["time-entries", { clientId, status: "unbilled" }],
  queryFn: async () => {
    const response = await fetch(
      `/api/time-entries?client_id=${clientId}&status=unbilled`
    );
    return response.json();
  },
  enabled: !!clientId,
});
```

## 8. Interakcje użytkownika

### 8.1. Generator Faktur

#### Krok 1: Wybór klienta
1. **Użytkownik otwiera generator** (`/invoices/new`)
   - Wyświetla się krok 1 z selektorem klientów
   - Ładowana jest lista aktywnych klientów

2. **Użytkownik wybiera klienta z listy**
   - Wywołanie `selectClient(clientId)`
   - Automatyczne przejście do kroku 2
   - Ładowanie niezafakturowanych wpisów czasu dla wybranego klienta

3. **Jeśli klient nie ma niezafakturowanych wpisów**
   - Wyświetlenie komunikatu: "Ten klient nie ma niezafakturowanych godzin"
   - Przycisk "Wróć" do wyboru innego klienta

#### Krok 2: Wybór wpisów czasu
1. **Wyświetlenie listy niezafakturowanych wpisów**
   - Każdy wpis z checkboxem
   - Checkbox "Zaznacz wszystkie" u góry
   - Podsumowanie na dole: suma godzin i kwot zaznaczonych wpisów

2. **Użytkownik zaznacza wpisy**
   - Kliknięcie checkboxa: `onSelectionChange(selectedIds)`
   - Automatyczne przeliczanie podsumowania
   - Przycisk "Dalej" aktywny tylko gdy zaznaczono >= 1 wpis

3. **Użytkownik klika "Dalej"**
   - Automatyczne grupowanie wpisów według `public_description`
   - Stworzenie obiektów `InvoiceItemViewModel`
   - Przejście do kroku 3

#### Krok 3: Ustawienia i podsumowanie
1. **Wyświetlenie edytora pozycji**
   - Lista grup z edytowalnymi opisami
   - Użytkownik może edytować opisy, łączyć lub rozdzielać grupy

2. **Ustawienia faktury**
   - Wybór daty wystawienia (domyślnie: dziś)
   - Wybór daty sprzedaży (domyślnie: dziś)
   - Wybór stawki VAT (domyślnie: 23%)
   - Jeśli waluta EUR/USD:
     - Automatyczne pobieranie kursu z API NBP
     - Możliwość ręcznego nadpisania kursu

3. **Podsumowanie**
   - Automatyczne przeliczanie kwot
   - Wyświetlenie sum: netto, VAT, brutto
   - Jeśli waluta obca: wyświetlenie kwot w PLN

4. **Użytkownik klika "Generuj fakturę"**
   - Walidacja wszystkich pól
   - Wywołanie `useGenerateInvoice().mutate(command)`
   - Wyświetlenie spinnera podczas generowania
   - Po sukcesie:
     - Toast: "Faktura została wygenerowana"
     - Automatyczne pobranie PDF
     - Redirect do `/invoices`

### 8.2. Archiwum Faktur

1. **Użytkownik otwiera listę faktur** (`/invoices`)
   - Ładowanie faktur z domyślnymi filtrami
   - Wyświetlenie tabeli z fakturami

2. **Filtrowanie**
   - Wybór klienta: automatyczne przeładowanie listy
   - Wybór zakresu dat: automatyczne przeładowanie
   - Wybór statusu/waluty: automatyczne przeładowanie
   - Przycisk "Wyczyść filtry": reset do domyślnych wartości

3. **Akcje na fakturze**
   - **Pobierz PDF**:
     - Kliknięcie → fetch `/api/invoices/{id}/pdf`
     - Automatyczne pobranie pliku
   - **Edytuj**:
     - Kliknięcie → redirect do `/invoices/{id}/edit`
   - **Oznacz jako opłacone**:
     - Kliknięcie checkboxa → `useToggleInvoicePaid().mutate()`
     - Zmiana wizualna (zielona ikona)
   - **Usuń**:
     - Kliknięcie → dialog potwierdzenia
     - Po potwierdzeniu → `useDeleteInvoice().mutate()`
     - Jeśli faktura opłacona: dodatkowe ostrzeżenie

4. **Import z CSV**
   - Kliknięcie "Importuj z CSV"
   - Otwarcie dialogu
   - Wybór pliku
   - Kliknięcie "Importuj"
   - Wyświetlenie postępu
   - Po zakończeniu: podsumowanie (sukces + błędy)

### 8.3. Edycja Faktury

1. **Użytkownik otwiera edycję** (`/invoices/:id/edit`)
   - Ładowanie szczegółów faktury
   - Wyświetlenie bannera ostrzegawczego (jednorazowo)

2. **Banner ostrzegawczy**
   - Tekst o ryzykach księgowych
   - Przycisk "Rozumiem"
   - Po zamknięciu: zapisanie w sessionStorage (nie pokazuj więcej w tej sesji)

3. **Edycja danych**
   - Zmiana dat: automatyczne przeliczanie
   - Edycja pozycji:
     - Zmiana opisu
     - Zmiana ilości/stawki
     - Wizualne oznaczenie zmienionych pól
   - Zmiana stawki VAT: automatyczne przeliczanie
   - Zmiana kursu waluty: automatyczne przeliczanie kwot PLN

4. **Zapisanie zmian**
   - Kliknięcie "Zapisz zmiany"
   - Walidacja wszystkich pól
   - Wywołanie `PUT /api/invoices/{id}`
   - Wyświetlenie spinnera
   - Po sukcesie:
     - Toast: "Faktura została zaktualizowana"
     - Regeneracja PDF
     - Redirect do `/invoices`

5. **Anulowanie**
   - Kliknięcie "Anuluj"
   - Jeśli były zmiany: dialog potwierdzenia
   - Redirect do `/invoices`

## 9. Warunki i walidacja

### 9.1. Walidacja w komponencie ClientSelector

**Warunki:**
- Lista klientów nie może być pusta
- Klient musi być wybrany przed przejściem dalej

**Implementacja:**
```typescript
// W komponencie InvoiceGeneratorView
const { data: clients, isLoading: isLoadingClients } = useClients();

if (isLoadingClients) {
  return <LoadingSpinner />;
}

if (!clients || clients.length === 0) {
  return (
    <EmptyState
      title="Brak klientów"
      description="Dodaj pierwszego klienta, aby móc generować faktury"
      action={<Button onClick={() => navigate("/clients")}>Dodaj klienta</Button>}
    />
  );
}

const isStepOneValid = !!state.clientId;
```

### 9.2. Walidacja w komponencie UnbilledTimeEntriesSelector

**Warunki:**
- Co najmniej jeden wpis musi być zaznaczony
- Wszystkie zaznaczone wpisy muszą mieć tę samą walutę
- Wpisy nie mogą być już zafakturowane (sprawdzane przez API)

**Implementacja:**
```typescript
const { data: unbilledEntries } = useQuery({
  queryKey: ["unbilled-entries", clientId],
  queryFn: () => fetchUnbilledEntries(clientId),
  enabled: !!clientId,
});

// Sprawdzenie czy wszystkie wpisy mają tę samą walutę
const currencies = new Set(
  unbilledEntries?.data
    .filter(entry => selectedIds.includes(entry.id))
    .map(entry => entry.currency)
);

const hasMultipleCurrencies = currencies.size > 1;

if (hasMultipleCurrencies) {
  // Wyświetlenie ostrzeżenia
  toast.error("Wszystkie wpisy na fakturze muszą być w tej samej walucie");
}

const isStepTwoValid = selectedIds.length > 0 && !hasMultipleCurrencies;
```

### 9.3. Walidacja w komponencie InvoiceItemsEditor

**Warunki:**
- Każda pozycja musi mieć niepusty opis
- Każda pozycja musi zawierać co najmniej jeden wpis czasu
- Wszystkie wpisy czasu muszą być przypisane do jakiejś pozycji

**Implementacja:**
```typescript
const validateItems = (items: InvoiceItemViewModel[]): string[] => {
  const errors: string[] = [];

  items.forEach((item, index) => {
    if (!item.description.trim()) {
      errors.push(`Pozycja ${index + 1}: Opis jest wymagany`);
    }

    if (item.timeEntryIds.length === 0) {
      errors.push(`Pozycja ${index + 1}: Brak przypisanych wpisów czasu`);
    }
  });

  // Sprawdzenie czy wszystkie wpisy są przypisane
  const allTimeEntryIds = selectedTimeEntryIds;
  const assignedTimeEntryIds = items.flatMap(item => item.timeEntryIds);

  const unassignedIds = allTimeEntryIds.filter(
    id => !assignedTimeEntryIds.includes(id)
  );

  if (unassignedIds.length > 0) {
    errors.push(`${unassignedIds.length} wpisów czasu nie jest przypisanych do żadnej pozycji`);
  }

  return errors;
};

const itemErrors = validateItems(state.items);
const areItemsValid = itemErrors.length === 0;
```

### 9.4. Walidacja w komponencie InvoiceSettingsPanel

**Warunki:**
- Data wystawienia jest wymagana
- Data sprzedaży jest wymagana
- Stawka VAT musi być wybrana
- Data sprzedaży nie może być późniejsza niż data wystawienia o więcej niż 30 dni (ostrzeżenie)
- Kurs waluty musi być liczbą > 0 (jeśli waluta obca)

**Implementacja:**
```typescript
const validateSettings = (settings: InvoiceSettingsViewModel): {
  errors: string[];
  warnings: string[];
} => {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!settings.issueDate) {
    errors.push("Data wystawienia jest wymagana");
  }

  if (!settings.saleDate) {
    errors.push("Data sprzedaży jest wymagana");
  }

  if (settings.issueDate && settings.saleDate) {
    const daysDiff = Math.floor(
      (settings.issueDate.getTime() - settings.saleDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (daysDiff > 30) {
      warnings.push(
        "Data wystawienia jest o ponad 30 dni późniejsza niż data sprzedaży"
      );
    }

    if (daysDiff < 0) {
      warnings.push(
        "Data wystawienia jest wcześniejsza niż data sprzedaży"
      );
    }
  }

  if (settings.vatRate === undefined || settings.vatRate === null) {
    errors.push("Stawka VAT jest wymagana");
  }

  if (currency !== "PLN") {
    if (!settings.exchangeRate || settings.exchangeRate <= 0) {
      errors.push("Kurs waluty musi być liczbą większą od 0");
    }
  }

  return { errors, warnings };
};

const { errors, warnings } = validateSettings(state.settings);

// Wyświetlenie ostrzeżeń (nie blokują)
warnings.forEach(warning => toast.warning(warning));

// Błędy blokują generowanie
const areSettingsValid = errors.length === 0;
```

### 9.5. Walidacja przed generowaniem faktury

**Kompletna walidacja:**
```typescript
const handleGenerateInvoice = () => {
  // 1. Walidacja klienta
  if (!state.clientId) {
    toast.error("Wybierz klienta");
    return;
  }

  // 2. Walidacja wpisów czasu
  if (state.selectedTimeEntryIds.length === 0) {
    toast.error("Wybierz co najmniej jeden wpis czasu");
    return;
  }

  // 3. Walidacja pozycji
  const itemErrors = validateItems(state.items);
  if (itemErrors.length > 0) {
    itemErrors.forEach(error => toast.error(error));
    return;
  }

  // 4. Walidacja ustawień
  const { errors } = validateSettings(state.settings);
  if (errors.length > 0) {
    errors.forEach(error => toast.error(error));
    return;
  }

  // 5. Generowanie faktury
  generateInvoice({
    client_id: state.clientId,
    issue_date: state.settings.issueDate.toISOString().split("T")[0],
    sale_date: state.settings.saleDate.toISOString().split("T")[0],
    vat_rate: state.settings.vatRate,
    time_entry_ids: state.selectedTimeEntryIds,
    items: state.items.map(item => ({
      description: item.description,
      time_entry_ids: item.timeEntryIds,
    })),
    custom_exchange_rate: state.settings.isCustomExchangeRate
      ? state.settings.exchangeRate
      : null,
  });
};
```

### 9.6. Walidacja w widoku edycji

**Dodatkowe warunki:**
- Nie można zmienić klienta (readonly)
- Nie można usunąć wszystkich pozycji
- Ostrzeżenie przy zmianie kluczowych danych (daty, kwoty)

**Implementacja:**
```typescript
const handleSaveChanges = () => {
  // 1. Sprawdzenie czy coś się zmieniło
  if (!editState.isModified) {
    toast.info("Nie wprowadzono żadnych zmian");
    return;
  }

  // 2. Walidacja pozycji
  if (editState.items.length === 0) {
    toast.error("Faktura musi zawierać co najmniej jedną pozycję");
    return;
  }

  const itemErrors = validateItems(editState.items);
  if (itemErrors.length > 0) {
    itemErrors.forEach(error => toast.error(error));
    return;
  }

  // 3. Walidacja ustawień
  const { errors } = validateSettings(editState.settings);
  if (errors.length > 0) {
    errors.forEach(error => toast.error(error));
    return;
  }

  // 4. Ostrzeżenie o istotnych zmianach
  const hasSignificantChanges =
    editState.settings.issueDate !== originalInvoice.issue_date ||
    editState.summary.grossAmount !== parseFloat(originalInvoice.gross_amount);

  if (hasSignificantChanges && !hasUserConfirmed) {
    setShowConfirmDialog(true);
    return;
  }

  // 5. Aktualizacja faktury
  updateInvoice({
    invoiceId: invoice.id,
    command: {
      issue_date: editState.settings.issueDate.toISOString().split("T")[0],
      sale_date: editState.settings.saleDate.toISOString().split("T")[0],
      vat_rate: editState.settings.vatRate,
      items: editState.items.map((item, index) => ({
        position: index + 1,
        description: item.description,
        quantity: item.quantity,
        unit_price: item.unitPrice,
      })),
      custom_exchange_rate: editState.settings.isCustomExchangeRate
        ? editState.settings.exchangeRate
        : null,
    },
  });
};
```

## 10. Obsługa błędów

### 10.1. Błędy ładowania danych

**Scenariusz:** Nie udało się załadować listy klientów, wpisów czasu lub faktur

**Obsługa:**
```typescript
const { data: clients, error, isError } = useClients();

if (isError) {
  return (
    <ErrorState
      title="Nie udało się załadować klientów"
      description={error?.message || "Spróbuj odświeżyć stronę"}
      action={
        <Button onClick={() => queryClient.invalidateQueries({ queryKey: ["clients"] })}>
          Odśwież
        </Button>
      }
    />
  );
}
```

### 10.2. Błędy walidacji z API

**Scenariusz:** API zwraca błąd walidacji (400 Bad Request)

**Obsługa:**
```typescript
const { mutate: generateInvoice } = useGenerateInvoice({
  onError: (error) => {
    if (error.message.includes("VALIDATION_ERROR")) {
      toast.error("Sprawdź poprawność wprowadzonych danych");
    } else if (error.message.includes("ALREADY_INVOICED")) {
      toast.error("Niektóre wpisy czasu zostały już zafakturowane");
      // Odświeżenie listy wpisów
      queryClient.invalidateQueries({ queryKey: ["unbilled-entries"] });
    } else {
      toast.error(error.message);
    }
  },
});
```

### 10.3. Błąd pobierania kursu waluty

**Scenariusz:** API NBP nie odpowiada lub nie ma kursu dla danej daty

**Obsługa:**
```typescript
const { data: exchangeRate, error, isError } = useExchangeRate(
  currency,
  settings.issueDate,
  currency !== "PLN"
);

useEffect(() => {
  if (isError && currency !== "PLN") {
    toast.error(
      "Nie udało się pobrać kursu waluty. Wprowadź kurs ręcznie.",
      { duration: 5000 }
    );
    // Włączenie ręcznego wprowadzania kursu
    setIsCustomExchangeRate(true);
  }
}, [isError, currency]);

// W komponencie ExchangeRateInput
{error && (
  <Alert variant="warning">
    <AlertTriangle className="h-4 w-4" />
    <AlertTitle>Kurs niedostępny</AlertTitle>
    <AlertDescription>
      Nie udało się pobrać kursu z API NBP. Wprowadź kurs ręcznie.
    </AlertDescription>
  </Alert>
)}
```

### 10.4. Błąd generowania PDF

**Scenariusz:** Faktura została utworzona, ale nie udało się wygenerować PDF

**Obsługa:**
```typescript
const { mutate: generateInvoice } = useGenerateInvoice({
  onSuccess: (response) => {
    if (!response.pdf_url) {
      toast.warning(
        "Faktura została utworzona, ale wystąpił problem z generowaniem PDF. " +
        "Możesz ją edytować i wygenerować PDF ponownie.",
        { duration: 8000 }
      );
    } else {
      toast.success("Faktura została wygenerowana");
      // Automatyczne pobranie PDF
      window.open(response.pdf_url, "_blank");
    }

    navigate("/invoices");
  },
  onError: (error) => {
    if (error.message.includes("PDF_GENERATION_FAILED")) {
      toast.error(
        "Wystąpił problem z generowaniem PDF. Skontaktuj się z administratorem.",
        { duration: 8000 }
      );
    } else {
      toast.error(error.message);
    }
  },
});
```

### 10.5. Błędy sieciowe

**Scenariusz:** Brak połączenia z internetem lub timeout

**Obsługa:**
```typescript
// Konfiguracja React Query z retry
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 3,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      staleTime: 5 * 60 * 1000, // 5 minut
      onError: (error) => {
        if (error.message.includes("fetch")) {
          toast.error("Sprawdź połączenie z internetem", { duration: 5000 });
        }
      },
    },
    mutations: {
      retry: 1,
      onError: (error) => {
        if (error.message.includes("fetch") || error.message.includes("network")) {
          toast.error(
            "Nie udało się połączyć z serwerem. Sprawdź połączenie z internetem.",
            { duration: 5000 }
          );
        }
      },
    },
  },
});
```

### 10.6. Błędy importu CSV

**Scenariusz:** Import zakończył się częściowym sukcesem lub całkowitym niepowodzeniem

**Obsługa:**
```typescript
const { mutate: importInvoices, isPending } = useImportInvoices({
  onSuccess: (result) => {
    if (result.success) {
      if (result.errors.length === 0) {
        toast.success(
          `Zaimportowano ${result.importedCount} faktur. ` +
          `Utworzono ${result.createdClients} nowych klientów.`
        );
      } else {
        // Częściowy sukces
        toast.warning(
          `Zaimportowano ${result.importedCount} faktur. ` +
          `Wystąpiło ${result.errors.length} błędów.`,
          { duration: 8000 }
        );

        // Wyświetlenie szczegółów błędów w dialogu
        setImportErrors(result.errors);
        setShowErrorsDialog(true);
      }
    } else {
      toast.error("Import nie powiódł się. Sprawdź format pliku CSV.");
    }

    // Odświeżenie listy faktur
    queryClient.invalidateQueries({ queryKey: ["invoices"] });
  },
  onError: (error) => {
    toast.error(`Błąd importu: ${error.message}`);
  },
});

// Dialog z błędami
{showErrorsDialog && (
  <Dialog open={showErrorsDialog} onOpenChange={setShowErrorsDialog}>
    <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle>Błędy importu</DialogTitle>
      </DialogHeader>
      <div className="space-y-2">
        {importErrors.map((error, index) => (
          <Alert key={index} variant="destructive">
            <AlertDescription>
              Wiersz {error.row}: {error.error}
            </AlertDescription>
          </Alert>
        ))}
      </div>
    </DialogContent>
  </Dialog>
)}
```

### 10.7. Obsługa konfliktów (409)

**Scenariusz:** Próba zafakturowania wpisów, które zostały już zafakturowane przez innego użytkownika/sesję

**Obsługa:**
```typescript
const { mutate: generateInvoice } = useGenerateInvoice({
  onError: (error) => {
    if (error.message.includes("CONFLICT") || error.message.includes("ALREADY_INVOICED")) {
      toast.error(
        "Niektóre wpisy czasu zostały już zafakturowane. " +
        "Lista została odświeżona.",
        { duration: 8000 }
      );

      // Odświeżenie listy niezafakturowanych wpisów
      queryClient.invalidateQueries({
        queryKey: ["unbilled-entries", state.clientId]
      });

      // Cofnięcie do kroku 2
      goToPreviousStep();
    }
  },
});
```

## 11. Kroki implementacji

### Krok 1: Przygotowanie struktury plików i typów
1. Utworzenie struktury folderów:
   ```
   src/components/features/invoices/
   ├── types.ts
   ├── InvoiceGeneratorView.tsx
   ├── InvoicesView.tsx
   ├── InvoiceEditView.tsx
   ├── ClientSelector.tsx
   ├── UnbilledTimeEntriesSelector.tsx
   ├── InvoiceItemsEditor.tsx
   ├── InvoiceSettingsPanel.tsx
   ├── InvoiceSummaryPanel.tsx
   ├── InvoicesFilters.tsx
   ├── InvoiceRow.tsx
   ├── EditWarningBanner.tsx
   └── ImportFromCSVButton.tsx
   ```

2. Definicja wszystkich typów w `types.ts` (ViewModels, FilterState, etc.)

3. Utworzenie custom hooks:
   ```
   src/components/hooks/
   ├── useInvoiceGenerator.ts
   ├── useInvoices.ts
   ├── useGenerateInvoice.ts
   ├── useUpdateInvoice.ts
   └── useExchangeRate.ts
   ```

### Krok 2: Implementacja endpointów API
1. Utworzenie pliku `src/pages/api/invoices/index.ts`:
   - Implementacja GET (lista faktur z filtrowaniem)
   - Wykorzystanie Supabase PostgREST

2. Utworzenie pliku `src/pages/api/invoices/generate.ts`:
   - Implementacja POST (generowanie faktury)
   - Logika grupowania wpisów czasu
   - Kalkulacja kwot
   - Pobieranie kursu waluty
   - Generowanie PDF
   - Zapisanie do Supabase Storage

3. Utworzenie pliku `src/pages/api/invoices/[id].ts`:
   - Implementacja GET (szczegóły faktury)
   - Implementacja PUT (edycja faktury)
   - Implementacja PATCH (zmiana statusu płatności)
   - Implementacja DELETE (soft delete)

4. Utworzenie pliku `src/pages/api/invoices/[id]/pdf.ts`:
   - Implementacja GET (pobieranie PDF z Supabase Storage)

5. Utworzenie pliku `src/pages/api/invoices/import.ts`:
   - Implementacja POST (import z CSV)
   - Parsowanie CSV
   - Walidacja danych
   - Tworzenie klientów i faktur

6. Utworzenie pliku `src/pages/api/exchange-rates/[currency]/[date].ts`:
   - Implementacja GET (pobieranie kursu z cache lub NBP API)
   - Logika fallback (poprzedni dzień roboczy)
   - Cachowanie wyników

### Krok 3: Implementacja komponentów bazowych
1. **ClientSelector**:
   - Wykorzystanie `useClients()` do pobrania listy
   - Komponent Select z shadcn/ui
   - Obsługa onChange

2. **InvoiceSettingsPanel**:
   - DatePicker dla dat (wykorzystanie komponentu z shadcn/ui)
   - Select dla stawki VAT
   - ExchangeRateInput (warunkowy)
   - Integracja z `useExchangeRate()`

3. **InvoiceSummaryPanel**:
   - Wyświetlenie obliczonych kwot
   - Przycisk akcji (generuj/zapisz)
   - Loader podczas wykonywania akcji

4. **EditWarningBanner**:
   - Komponent Alert z shadcn/ui
   - Logika sessionStorage (jednorazowe wyświetlenie)

### Krok 4: Implementacja UnbilledTimeEntriesSelector
1. Stworzenie layoutu z checkboxami
2. Implementacja "Zaznacz wszystkie"
3. Dynamiczne obliczanie podsumowania
4. Walidacja (jednakowa waluta)
5. Integracja z hokiem do pobierania wpisów:
   ```typescript
   const { data: unbilledEntries } = useQuery({
     queryKey: ["time-entries", { clientId, status: "unbilled" }],
     queryFn: () => fetchUnbilledEntries(clientId),
     enabled: !!clientId,
   });
   ```

### Krok 5: Implementacja InvoiceItemsEditor
1. Automatyczne grupowanie wpisów według `public_description`
2. Edycja opisów pozycji
3. Możliwość łączenia grup (merge)
4. Możliwość rozdzielania grup (split)
5. Drag & drop do zmiany kolejności (opcjonalnie)
6. Obliczanie sum dla każdej pozycji
7. Walidacja (niepuste opisy, przypisane wpisy)

### Krok 6: Implementacja InvoiceGeneratorView
1. Stworzenie layoutu głównego widoku
2. Implementacja `useInvoiceGenerator()` hook
3. Wizualny stepper (wskaźnik kroków 1/2/3)
4. Renderowanie warunkowe kroków:
   - Krok 1: ClientSelector
   - Krok 2: UnbilledTimeEntriesSelector
   - Krok 3: InvoiceItemsEditor + InvoiceSettingsPanel + InvoiceSummaryPanel
5. Logika przejść między krokami
6. Automatyczne przeliczanie podsumowania
7. Obsługa generowania faktury:
   ```typescript
   const { mutate: generateInvoice, isPending } = useGenerateInvoice();

   const handleGenerate = () => {
     // Walidacja
     // ...

     generateInvoice({
       client_id: state.clientId,
       issue_date: formatDate(state.settings.issueDate),
       sale_date: formatDate(state.settings.saleDate),
       vat_rate: state.settings.vatRate,
       time_entry_ids: state.selectedTimeEntryIds,
       items: state.items.map(item => ({
         description: item.description,
         time_entry_ids: item.timeEntryIds,
       })),
       custom_exchange_rate: state.settings.exchangeRate,
     }, {
       onSuccess: (response) => {
         toast.success("Faktura została wygenerowana");
         window.open(response.pdf_url, "_blank");
         navigate("/invoices");
       },
     });
   };
   ```

### Krok 7: Implementacja InvoicesView
1. Stworzenie layoutu głównego widoku (nagłówek + filtry + tabela)
2. Implementacja InvoicesFilters:
   - Select klienta
   - DateRangePicker
   - Select statusu
   - Select waluty
   - Przycisk czyszczenia filtrów
3. Implementacja tabeli z fakturami:
   - Kolumny: numer, data, klient, kwota, status, akcje
   - Wykorzystanie Table z shadcn/ui
4. Implementacja InvoiceRow:
   - Wyświetlenie danych faktury
   - Badge "Edited" (warunkowy)
   - Akcje: pobierz PDF, edytuj, oznacz jako opłacone, usuń
5. Integracja z `useInvoices(filters)`:
   ```typescript
   const [filters, setFilters] = useState<InvoicesFilterState>({
     status: "all",
     page: 1,
     pageSize: 20,
   });

   const { data, isLoading } = useInvoices(filters);
   ```
6. Implementacja paginacji
7. Wyświetlanie podsumowania kwot (per waluta)
8. Stan pusty (EmptyState) gdy brak faktur

### Krok 8: Implementacja ImportFromCSVButton
1. Stworzenie przycisku i dialogu
2. Input do wyboru pliku
3. Walidacja pliku (format, rozmiar)
4. Wyświetlenie instrukcji i linku do przykładowego pliku
5. Pasek postępu podczas importu
6. Obsługa wyniku importu:
   ```typescript
   const { mutate: importInvoices, isPending } = useMutation({
     mutationFn: async (file: File) => {
       const formData = new FormData();
       formData.append("file", file);

       const response = await fetch("/api/invoices/import", {
         method: "POST",
         body: formData,
       });

       if (!response.ok) throw new Error("Import failed");
       return response.json();
     },
     onSuccess: (result) => {
       if (result.errors.length > 0) {
         setImportErrors(result.errors);
         setShowErrorsDialog(true);
       }
       toast.success(`Zaimportowano ${result.importedCount} faktur`);
       queryClient.invalidateQueries({ queryKey: ["invoices"] });
     },
   });
   ```
7. Dialog z błędami (lista wierszy z błędami)

### Krok 9: Implementacja InvoiceEditView
1. Pobranie szczegółów faktury:
   ```typescript
   const { data: invoice, isLoading } = useQuery({
     queryKey: ["invoice", invoiceId],
     queryFn: () => fetchInvoiceDetail(invoiceId),
   });
   ```
2. Inicjalizacja stanu edycji:
   ```typescript
   const [editState, setEditState] = useState<InvoiceEditState>(() => ({
     invoice,
     items: mapInvoiceItemsToViewModel(invoice.items),
     settings: mapInvoiceToSettings(invoice),
     summary: calculateSummary(invoice.items, invoice.vat_rate),
     isModified: false,
     showWarning: !sessionStorage.getItem("invoice-edit-warning-dismissed"),
   }));
   ```
3. Wyświetlenie EditWarningBanner (jednorazowo)
4. Renderowanie formularza:
   - Sekcja klienta (readonly)
   - InvoiceItemsEditor (editable)
   - InvoiceSettingsPanel (editable)
   - InvoiceSummaryPanel
5. Śledzenie zmian:
   ```typescript
   useEffect(() => {
     const isModified = hasChanges(editState, invoice);
     setEditState(prev => ({ ...prev, isModified }));
   }, [editState.items, editState.settings]);
   ```
6. Obsługa zapisywania:
   ```typescript
   const { mutate: updateInvoice, isPending } = useUpdateInvoice();

   const handleSave = () => {
     // Walidacja
     // ...

     updateInvoice({
       invoiceId: invoice.id,
       command: {
         issue_date: formatDate(editState.settings.issueDate),
         sale_date: formatDate(editState.settings.saleDate),
         vat_rate: editState.settings.vatRate,
         items: editState.items.map((item, index) => ({
           position: index + 1,
           description: item.description,
           quantity: item.quantity,
           unit_price: item.unitPrice,
         })),
         custom_exchange_rate: editState.settings.exchangeRate,
       },
     }, {
       onSuccess: () => {
         toast.success("Faktura została zaktualizowana");
         navigate("/invoices");
       },
     });
   };
   ```
7. Dialog potwierdzenia przy istotnych zmianach
8. Obsługa anulowania (dialog jeśli były zmiany)

### Krok 10: Utworzenie stron Astro
1. **src/pages/invoices/index.astro**:
   ```astro
   ---
   import Layout from "@/layouts/Layout.astro";
   import { InvoicesView } from "@/components/features/invoices/InvoicesView";
   ---

   <Layout title="Faktury - Coinect">
     <InvoicesView client:load />
   </Layout>
   ```

2. **src/pages/invoices/new.astro**:
   ```astro
   ---
   import Layout from "@/layouts/Layout.astro";
   import { InvoiceGeneratorView } from "@/components/features/invoices/InvoiceGeneratorView";
   ---

   <Layout title="Generuj fakturę - Coinect">
     <InvoiceGeneratorView client:load />
   </Layout>
   ```

3. **src/pages/invoices/[id]/edit.astro**:
   ```astro
   ---
   import Layout from "@/layouts/Layout.astro";
   import { InvoiceEditView } from "@/components/features/invoices/InvoiceEditView";

   const { id } = Astro.params;
   ---

   <Layout title="Edytuj fakturę - Coinect">
     <InvoiceEditView invoiceId={id} client:load />
   </Layout>
   ```

### Krok 11: Integracja z nawigacją
1. Dodanie linków w głównej nawigacji (Layout.astro lub Navbar):
   - Link "Faktury" → `/invoices`
   - Przycisk "Generuj fakturę" → `/invoices/new`

2. Dodanie na Dashboard:
   - Widget "Ostatnie faktury" z linkiem do `/invoices`
   - Przycisk szybkiej akcji "Generuj fakturę"

### Krok 12: Testowanie i debug
1. Testy manualne generatora:
   - Generowanie faktury PLN
   - Generowanie faktury EUR z automatycznym kursem
   - Generowanie faktury USD z ręcznym kursem
   - Próba zafakturowania już zafakturowanych wpisów (konflikt)

2. Testy listy faktur:
   - Filtrowanie po kliencie
   - Filtrowanie po dacie
   - Filtrowanie po statusie
   - Paginacja
   - Pobieranie PDF
   - Oznaczanie jako opłacone
   - Usuwanie

3. Testy edycji:
   - Edycja opisów pozycji
   - Zmiana dat
   - Zmiana stawki VAT
   - Zmiana kursu waluty
   - Sprawdzenie oznaczenia "Edited"
   - Sprawdzenie regeneracji PDF

4. Testy importu:
   - Import poprawnego pliku CSV
   - Import pliku z błędami
   - Sprawdzenie czy utworzono nowych klientów
   - Sprawdzenie czy faktury są oznaczone jako "Imported"

5. Testy obsługi błędów:
   - Brak połączenia z internetem
   - Błąd API NBP (kurs niedostępny)
   - Błąd generowania PDF
   - Konflikty (już zafakturowane wpisy)

### Krok 13: Optymalizacja i polish
1. Dodanie skeletonów loading dla wszystkich widoków
2. Optymalizacja zapytań (React Query staleTime, cacheTime)
3. Dodanie animacji przejść między krokami generatora
4. Usprawnienie UX dla długich list (virtualizacja - opcjonalnie)
5. Dodanie tooltipów dla wszystkich ikon i akcji
6. Accessibility audit (ARIA labels, keyboard navigation)
7. Responsywność na urządzeniach mobilnych
8. Dodanie breadcrumbs (nawigacja okruszkowa)

### Krok 14: Dokumentacja
1. Dodanie komentarzy JSDoc do wszystkich komponentów
2. Utworzenie README w folderze `components/features/invoices/`
3. Dodanie przykładów użycia custom hooks
4. Dokumentacja formatów danych (CSV import template)
