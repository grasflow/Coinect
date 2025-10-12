# Plan implementacji widoku Wpisy Czasu

## 1. Przegląd

Widok "Wpisy Czasu" jest centralnym miejscem do zarządzania czasem pracy w aplikacji. Umożliwia użytkownikom dodawanie nowych wpisów, przeglądanie historii, filtrowanie, edycję oraz usuwanie zarejestrowanego czasu pracy. Widok ten ma kluczowe znaczenie dla głównej funkcjonalności aplikacji, ponieważ dane z niego są podstawą do generowania faktur.

## 2. Routing widoku

Widok będzie dostępny pod następującą ścieżką dla zalogowanych użytkowników:

- `/time-entries`

## 3. Struktura komponentów

Komponenty zostaną zaimplementowane w React i osadzone na stronie Astro. Główna logika będzie zarządzana przez komponent kontenerowy `TimeEntriesView`.

```
/src/pages/time-entries.astro
└── /src/components/features/time-entries/TimeEntriesView.tsx (client:load)
    ├── /src/components/features/time-entries/TimeEntryFilters.tsx
    │   ├── ClientSelect (komponent reużywalny)
    │   ├── DateRangePicker (z shadcn/ui)
    │   └── StatusSelect (z shadcn/ui)
    ├── /src/components/features/time-entries/TimeEntriesList.tsx
    │   ├── DataTable (z shadcn/ui)
    │   └── Pagination (komponent reużywalny)
    └── /src/components/features/time-entries/TimeEntryForm.tsx
        ├── AutocompleteInput.tsx
        └── TagSelect.tsx
```

## 4. Szczegóły komponentów

### `TimeEntriesView.tsx`

- **Opis komponentu:** Główny komponent-kontener zarządzający stanem całego widoku. Odpowiada za pobieranie danych, obsługę filtrów oraz koordynację akcji między komponentami podrzędnymi (listą, filtrami, formularzem).
- **Główne elementy:** Renderuje komponenty `TimeEntryFilters`, `TimeEntriesList` oraz przycisk otwierający modal z `TimeEntryForm`.
- **Obsługiwane interakcje:**
  - Otwarcie modala dodawania/edycji wpisu.
  - Przekazanie zmian filtrów do hooka pobierającego dane.
- **Typy:** `TimeEntriesFilterState`.
- **Propsy:** Brak.

### `TimeEntryFilters.tsx`

- **Opis komponentu:** Pasek narzędzi zawierający filtry dla listy wpisów czasu.
- **Główne elementy:** `Select` do wyboru klienta, `DateRangePicker` do wyboru zakresu dat, `Select` do wyboru statusu (wszystkie, zafakturowane, niezafakturowane).
- **Obsługiwane interakcje:**
  - `onFilterChange(newFilters)`: Emituje zdarzenie przy każdej zmianie wartości filtra.
- **Obsługiwana walidacja:** Brak.
- **Typy:** `ClientDTO`.
- **Propsy:**
  - `filters: TimeEntriesFilterState`
  - `onFilterChange: (filters: Partial<TimeEntriesFilterState>) => void`
  - `clients: ClientDTO[]`
  - `isLoadingClients: boolean`

### `TimeEntriesList.tsx`

- **Opis komponentu:** Wyświetla listę wpisów czasu w formie tabeli (`DataTable` z shadcn/ui). Zawiera również paginację oraz akcje dla każdego wiersza.
- **Główne elementy:** `DataTable` z kolumnami: Data, Klient, Godziny, Stawka, Kwota, Opis, Status, Akcje (Edytuj, Usuń).
- **Obsługiwane interakcje:**
  - `onEdit(entry)`: Emituje zdarzenie po kliknięciu przycisku "Edytuj".
  - `onDelete(entryId)`: Emituje zdarzenie po kliknięciu przycisku "Usuń".
  - `onPageChange(page)`: Emituje zdarzenie zmiany strony.
- **Obsługiwana walidacja:** Przyciski "Edytuj" i "Usuń" są nieaktywne dla wpisów, które mają `invoice_id`.
- **Typy:** `TimeEntryWithRelationsDTO`, `PaginatedResponse`.
- **Propsy:**
  - `data: PaginatedResponse<TimeEntryWithRelationsDTO>`
  - `isLoading: boolean`
  - `onEdit: (entry: TimeEntryWithRelationsDTO) => void`
  - `onDelete: (entryId: string) => void`
  - `onPageChange: (page: number) => void`

### `TimeEntryForm.tsx`

- **Opis komponentu:** Formularz do dodawania i edycji wpisów czasu, renderowany w modalu.
- **Główne elementy:** Pola formularza (`Select` dla klienta, `DatePicker` dla daty, `Input` dla godzin i stawki, `AutocompleteInput` dla opisu, `Textarea` dla notatki, `TagSelect` dla tagów).
- **Obsługiwane interakcje:**
  - `onSubmit(data)`: Emituje zdarzenie po pomyślnej walidacji i zatwierdzeniu formularza.
- **Obsługiwana walidacja:**
  - `client_id`: Wymagane.
  - `date`: Wymagana.
  - `hours`: Wymagane, musi być liczbą dodatnią.
  - `hourly_rate`: Opcjonalne, musi być liczbą nieujemną.
- **Typy:** `TimeEntryFormViewModel`, `CreateTimeEntryCommand`, `UpdateTimeEntryCommand`, `ClientDTO`, `TagDTO`.
- **Propsy:**
  - `isOpen: boolean`
  - `onClose: () => void`
  - `onSubmit: (data: TimeEntryFormViewModel) => void`
  - `initialData?: TimeEntryWithRelationsDTO` (do edycji)
  - `clients: ClientDTO[]`
  - `tags: TagDTO[]`

## 5. Typy

Oprócz typów DTO z `src/types.ts`, widok będzie korzystał z dedykowanych typów ViewModel do zarządzania stanem.

```typescript
// Stan filtrów na liście wpisów
export type TimeEntriesFilterState = {
  clientId?: string;
  dateRange?: { from: Date; to: Date };
  status?: "billed" | "unbilled" | "all";
  page: number;
  pageSize: number;
};

// Model danych dla formularza wpisu czasu
export type TimeEntryFormViewModel = {
  id?: string; // Obecny podczas edycji
  client_id: string;
  date: Date; // Użycie obiektu Date dla komponentu DatePicker
  hours: string; // Użycie string dla powiązania z polem input
  hourly_rate?: string;
  public_description?: string;
  private_note?: string;
  tag_ids?: string[];
};
```

## 6. Zarządzanie stanem

Zarządzanie stanem serwera (pobieranie, cachowanie, mutacje danych) zostanie zrealizowane przy użyciu biblioteki **TanStack Query**.

Zostanie stworzony customowy hook `useTimeEntries`, który będzie zarządzał:

- Pobieraniem listy wpisów (`useQuery`) na podstawie `TimeEntriesFilterState`.
- Mutacjami do tworzenia (`useMutation`), aktualizacji i usuwania wpisów.
- Automatycznym unieważnianiem (inwalidacją) zapytania o listę wpisów po pomyślnej mutacji, co spowoduje odświeżenie danych.

Stan filtrów (`TimeEntriesFilterState`) będzie zarządzany w głównym komponencie `TimeEntriesView` za pomocą `useState` i przekazywany w dół do komponentów podrzędnych.

## 7. Integracja API

- **Pobieranie listy wpisów:**
  - **Endpoint:** `GET /rest/v1/time_entries`
  - **Logika:** Wywołanie będzie realizowane przez `useQuery` z dynamicznie budowanymi parametrami na podstawie stanu `TimeEntriesFilterState`. Użyty zostanie parametr `select`, aby zagnieździć dane klienta i tagów.
  - **Typ odpowiedzi:** `PaginatedResponse<TimeEntryWithRelationsDTO>`

- **Tworzenie wpisu:**
  - **Endpoint:** `POST /api/time-entries`
  - **Logika:** `useMutation` wywoła ten endpoint. Dane z `TimeEntryFormViewModel` zostaną przekształcone na `CreateTimeEntryCommand`.
  - **Typ żądania:** `CreateTimeEntryCommand`
  - **Typ odpowiedzi:** `CreateTimeEntryResponse`

- **Aktualizacja wpisu:**
  - **Endpoint:** `PUT /api/time-entries/{entry_id}` (**UWAGA: Ten endpoint musi zostać zaimplementowany w backendzie zgodnie z `api-plan.md`**)
  - **Logika:** `useMutation` wywoła ten endpoint. Dane z `TimeEntryFormViewModel` zostaną przekształcone na `UpdateTimeEntryCommand`.
  - **Typ żądania:** `UpdateTimeEntryCommand`
  - **Typ odpowiedzi:** `UpdateTimeEntryResponse`

- **Usuwanie wpisu (Soft Delete):**
  - **Endpoint:** `PATCH /rest/v1/time_entries?id=eq.{entry_id}`
  - **Logika:** `useMutation` wywoła ten endpoint z ciałem `{ "deleted_at": new Date().toISOString() }`.
  - **Typ żądania:** `{ deleted_at: string }`

- **Pobieranie sugestii autouzupełniania:**
  - **Endpoint:** `GET /api/time-entries/autocomplete?q={query}` (**UWAGA: Ten endpoint musi zostać zaimplementowany w backendzie zgodnie z `api-plan.md`**)
  - **Logika:** Wywołanie będzie realizowane z debouncingiem w komponencie `AutocompleteInput`.
  - **Typ odpowiedzi:** `AutocompleteResponse`

## 8. Interakcje użytkownika

- **Filtrowanie:** Zmiana wartości w dowolnym filtrze (`TimeEntryFilters`) powoduje natychmiastowe odświeżenie listy wpisów z uwzględnieniem nowych kryteriów.
- **Dodawanie wpisu:** Kliknięcie przycisku "Dodaj wpis" otwiera modal z formularzem. Po jego poprawnym wypełnieniu i wysłaniu modal jest zamykany, lista się odświeża, a użytkownik widzi powiadomienie o sukcesie.
- **Edycja wpisu:** Kliknięcie ikony "Edytuj" w wierszu tabeli otwiera ten sam modal, ale wypełniony danymi edytowanego wpisu.
- **Usuwanie wpisu:** Kliknięcie ikony "Usuń" wyświetla modal z prośbą o potwierdzenie. Po potwierdzeniu wpis jest usuwany, a lista się odświeża.
- **Paginacja:** Kliknięcie na numery stron lub strzałki w komponencie paginacji powoduje pobranie i wyświetlenie odpowiedniej partii danych.

## 9. Warunki i walidacja

- **Formularz `TimeEntryForm`:**
  - Przycisk "Zapisz" jest nieaktywny, dopóki wszystkie wymagane pola (`Klient`, `Data`, `Godziny`) nie zostaną poprawnie wypełnione.
  - Walidacja `Godzin` odbywa się w czasie rzeczywistym, uniemożliwiając wpisanie tekstu lub wartości ujemnych.
- **Lista `TimeEntriesList`:**
  - Przyciski "Edytuj" i "Usuń" są nieaktywne (`disabled`) dla wpisów, które zostały już zafakturowane (posiadają `invoice_id`).

## 10. Obsługa błędów

- **Błąd pobierania danych:** W miejscu listy `TimeEntriesList` wyświetlany jest komunikat o błędzie wraz z przyciskiem "Spróbuj ponownie".
- **Błąd zapisu formularza:** W przypadku błędu serwera (np. 500) pod formularzem wyświetlany jest ogólny komunikat błędu. W przypadku błędu walidacji (400) komunikaty są wyświetlane przy odpowiednich polach.
- **Brak wyników:** Gdy filtry nie zwracają żadnych wyników, tabela wyświetla komunikat "Nie znaleziono wpisów" i zachętę do zmiany filtrów lub dodania nowego wpisu.
- **Powiadomienia Toast:** Sukcesy (dodanie/edycja/usunięcie) i błędy operacji są komunikowane za pomocą globalnych powiadomień toast (np. w prawym dolnym rogu ekranu).

## 11. Kroki implementacji

1.  **Struktura plików:** Utworzenie folderu `/src/components/features/time-entries` oraz plików dla komponentów: `TimeEntriesView.tsx`, `TimeEntryFilters.tsx`, `TimeEntriesList.tsx`, `TimeEntryForm.tsx`.
2.  **Strona Astro:** Stworzenie pliku `/src/pages/time-entries.astro`, który zaimportuje i wyrenderuje główny komponent `TimeEntriesView.tsx` ze znacznikiem `client:load`.
3.  **Zarządzanie stanem:** Implementacja customowego hooka `useTimeEntries` z wykorzystaniem TanStack Query do hermetyzacji logiki API. Na początek implementacja pobierania danych i mutacji do tworzenia wpisów.
4.  **Komponenty:**
    - Implementacja `TimeEntryFilters`, pobierającego listę klientów i zarządzającego stanem formularza filtrów.
    - Implementacja `TimeEntriesList`, wykorzystującego `DataTable` z shadcn/ui do wyświetlenia danych. Dodanie logiki do warunkowego wyłączania przycisków akcji.
    - Implementacja `TimeEntryForm` w modalu, wraz z walidacją po stronie klienta (np. z użyciem `zod`).
5.  **Połączenie komponentów:** Złożenie widoku w `TimeEntriesView`, zarządzanie stanem filtrów i przekazywanie danych oraz callbacków do komponentów podrzędnych.
6.  **Obsługa edycji i usuwania:** Dodanie do `useTimeEntries` mutacji do edycji i usuwania. Podłączenie logiki do przycisków w `TimeEntriesList`.
7.  **Funkcje dodatkowe:** Implementacja komponentów `AutocompleteInput` i `TagSelect` (zakładając, że odpowiednie endpointy API zostaną utworzone).
8.  **Stylowanie i RWD:** Dopracowanie wyglądu, dodanie stanów ładowania (np. skeleton loader) i zapewnienie responsywności, zwłaszcza dla tabeli na urządzeniach mobilnych.
