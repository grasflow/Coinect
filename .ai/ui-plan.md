# Architektura UI dla Coinect

## 1. Przegląd struktury UI

Architektura interfejsu użytkownika aplikacji Coinect została zaprojektowana jako aplikacja jednostronicowa (SPA - Single Page Application) z renderowaniem po stronie klienta. Centralnym punktem dla zalogowanego użytkownika jest **Dashboard**, który stanowi centrum nawigacyjne do wszystkich kluczowych modułów. Struktura opiera się na zestawie dedykowanych widoków dla każdego głównego zasobu (Klienci, Wpisy czasu, Faktury), co zapewnia klarowny podział funkcjonalny.

Zarządzanie stanem serwera (komunikacja z API) będzie realizowane przez bibliotekę TanStack Query, co uprości logikę pobierania, cachowania i aktualizacji danych. Nawigacja jest stała i widoczna, co ułatwia poruszanie się po aplikacji. Architektura kładzie nacisk na responsywność, przekształcając złożone elementy, takie jak tabele, w widok kart na urządzeniach mobilnych, oraz na dostępność, m.in. poprzez dynamiczne dbanie o kontrast kolorów.

## 2. Lista widoków

### Widok 1: Logowanie

- **Nazwa widoku:** Strona Logowania
- **Ścieżka widoku:** `/login`
- **Główny cel:** Umożliwienie powrotu do aplikacji zarejestrowanym użytkownikom.
- **Kluczowe informacje:** Formularz z polami email i hasło.
- **Kluczowe komponenty:** `LoginForm`, `PublicLayout`.
- **UX, dostępność i względy bezpieczeństwa:** Komunikacja błędów walidacji inline. Po wygaśnięciu sesji, użytkownik jest tu przekierowywany, a aplikacja próbuje odtworzyć stan ostatnio edytowanych formularzy z `localStorage`.

### Widok 2: Rejestracja

- **Nazwa widoku:** Strona Rejestracji
- **Ścieżka widoku:** `/register`
- **Główny cel:** Umożliwienie nowym użytkownikom założenia konta.
- **Kluczowe informacje:** Formularz rejestracyjny (email, hasło, imię i nazwisko).
- **Kluczowe komponenty:** `RegisterForm`, `PublicLayout`.
- **UX, dostępność i względy bezpieczeństwa:** Walidacja siły hasła w czasie rzeczywistym. Jasne komunikaty o błędach (np. zajęty email).

### Widok 3: Dashboard

- **Nazwa widoku:** Dashboard
- **Ścieżka widoku:** `/` (dla zalogowanych)
- **Główny cel:** Zapewnienie szybkiego wglądu w kluczowe metryki i ułatwienie nawigacji do najczęstszych zadań.
- **Kluczowe informacje:**
  - Kluczowe metryki (liczba klientów, suma niezafakturowanych godzin, kwoty nieopłaconych faktur).
  - Lista ostatnich wpisów czasu i faktur.
- **Kluczowe komponenty:** `StatsGrid`, `RecentActivityFeed`, `AIInsightsWidget`, `OnboardingChecklist`, `QuickActions`.
- **UX, dostępność i względy bezpieczeństwa:** Interaktywne statystyki działające jak linki do przefiltrowanych list. Komponent onboardingu jest widoczny do momentu ukończenia lub zamknięcia przez użytkownika.

### Widok 4: Klienci

- **Nazwa widoku:** Lista Klientów
- **Ścieżka widoku:** `/clients`
- **Główny cel:** Zarządzanie bazą klientów.
- **Kluczowe informacje:** Lista wszystkich klientów z opcją wyszukiwania i sortowania.
- **Kluczowe komponenty:** `ClientsList` (tabela na desktop, karty na mobile), `SearchBar`, `SortControls`, `Pagination`.
- **UX, dostępność i względy bezpieczeństwa:** Wyszukiwanie i sortowanie realizowane po stronie serwera. Wyraźny stan ładowania i stan pusty (z wezwaniem do akcji).

### Widok 5: Formularz Klienta

- **Nazwa widoku:** Dodaj/Edytuj Klienta
- **Ścieżka widoku:** `/clients/new`, `/clients/:id/edit` (renderowany w modalu nad listą)
- **Główny cel:** Tworzenie nowego lub modyfikacja istniejącego klienta.
- **Kluczowe informacje:** Formularz z danymi klienta (nazwa, dane adresowe, NIP, domyślna waluta i stawka).
- **Kluczowe komponenty:** `ClientForm`.
- **UX, dostępność i względy bezpieczeństwa:** Błędy walidacji z API wyświetlane pod odpowiednimi polami. Stan ładowania podczas zapisu.

### Widok 6: Wpisy czasu

- **Nazwa widoku:** Lista Wpisów Czasu
- **Ścieżka widoku:** `/time-entries`
- **Główny cel:** Przeglądanie, filtrowanie i zarządzanie wpisami czasu.
- **Kluczowe informacje:** Lista wpisów z danymi: data, klient, godziny, kwota, status (zafakturowane/niezafakturowane).
- **Kluczowe komponenty:** `TimeEntriesList`, `Filters` (klient, zakres dat, status), `Pagination`, `ExportToCSVButton`.
- **UX, dostępność i względy bezpieczeństwa:** Możliwość masowego dodawania wpisów z tego widoku. Filtry aktualizują widok bez przeładowania strony.

### Widok 7: Generator Faktur

- **Nazwa widoku:** Generator Faktur
- **Ścieżka widoku:** `/invoices/new`
- **Główny cel:** Prowadzenie użytkownika przez proces tworzenia nowej faktury.
- **Kluczowe informacje:**
  - Wybór klienta.
  - Lista niezafakturowanych wpisów czasu dla tego klienta z możliwością selekcji.
  - Możliwość edycji i grupowania pozycji na fakturze.
  - Podsumowanie kwot i ustawienia (VAT, waluta).
- **Kluczowe komponenty:** `ClientSelector`, `UnbilledTimeEntriesSelector`, `InvoiceItemsEditor`, `InvoiceSummary`.
- **UX, dostępność i względy bezpieczeństwa:** Proces jest liniowy i zautomatyzowany. W przypadku walut obcych, system automatycznie pobiera kurs, ale pozwala na jego ręczną zmianę.

### Widok 8: Faktury

- **Nazwa widoku:** Archiwum Faktur
- **Ścieżka widoku:** `/invoices`
- **Główny cel:** Przechowywanie i zarządzanie wszystkimi wygenerowanymi fakturami.
- **Kluczowe informacje:** Lista faktur z danymi: numer, data, klient, kwota, status płatności.
- **Kluczowe komponenty:** `InvoicesList`, `Filters` (klient, zakres dat, status), `Pagination`, `ImportFromCSVButton`.
- **UX, dostępność i względy bezpieczeństwa:** Akcje dla każdej faktury (pobierz PDF, edytuj, oznacz jako opłaconą). Edytowane faktury są wyraźnie oznaczone.

### Widok 9: Edycja Faktury

- **Nazwa widoku:** Edycja Faktury
- **Ścieżka widoku:** `/invoices/:id/edit`
- **Główny cel:** Umożliwienie pełnej edycji wygenerowanej faktury.
- **Kluczowe informacje:** Formularz zawierający wszystkie pola faktury.
- **Kluczowe komponenty:** `InvoiceEditForm`, `InfoBanner` (ostrzeżenie o ryzyku księgowym), `InvoiceItemsEditor`.
- **UX, dostępność i względy bezpieczeństwa:** Pozycje, które różnią się od oryginalnych wpisów czasu, są wizualnie oznaczone. Zapisanie zmian powoduje ponowne wygenerowanie pliku PDF.

### Widok 10: Ustawienia

- **Nazwa widoku:** Ustawienia
- **Ścieżka widoku:** `/settings`
- **Główny cel:** Personalizacja konta i danych na fakturach.
- **Kluczowe informacje:** Formularz z danymi wystawcy, pole do wgrania logo, wybór koloru akcentu.
- **Kluczowe komponenty:** `ProfileForm`, `LogoUploader`, `AccentColorPicker`.
- **UX, dostępność i względy bezpieczeństwa:** System automatycznie dobiera kolor tekstu (biały/czarny), aby zapewnić kontrast z wybranym kolorem akcentu (WCAG). Zmiany zapisują się automatycznie.

## 3. Mapa podróży użytkownika

Główny przepływ pracy nowego użytkownika jest zoptymalizowany pod kątem szybkiego dotarcia do kluczowej wartości aplikacji - wygenerowania pierwszej faktury.

1.  **Rejestracja i Logowanie**: Użytkownik tworzy konto (`/register`) i jest automatycznie logowany, lądując na **Dashboardzie** (`/`).
2.  **Onboarding**: Na Dashboardzie wita go checklista z trzema krokami.
    a. **Krok 1**: Kliknięcie "Dodaj klienta" przenosi go do widoku **Listy Klientów** (`/clients`) z otwartym modalem do dodawania nowego klienta. Po zapisie wraca na Dashboard.
    b. **Krok 2**: Kliknięcie "Dodaj wpisy czasu" przenosi go do widoku **Wpisów Czasu** (`/time-entries`) z interfejsem do masowego dodawania.
    c. **Krok 3**: Kliknięcie "Wygeneruj fakturę" przenosi go do **Generatora Faktur** (`/invoices/new`).
3.  **Generowanie Faktury**: W generatorze wybiera klienta, zaznacza wpisy czasu, potwierdza dane i generuje fakturę.
4.  **Zarządzanie Fakturą**: Po wygenerowaniu jest przekierowywany do **Archiwum Faktur** (`/invoices`), gdzie może pobrać PDF, edytować fakturę lub oznaczyć ją jako opłaconą.

Pozostałe podróże, takie jak edycja klienta czy przeglądanie historii, są dostępne bezpośrednio z poziomu odpowiednich list i nawigacji.

## 4. Układ i struktura nawigacji

Aplikacja będzie korzystać z trwałego układu z nawigacją boczną na urządzeniach desktopowych i ukrytym menu typu "hamburger" na urządzeniach mobilnych.

- **Layout główny (AppLayout):**
  - **Sidebar (Nawigacja):** Zawiera linki do głównych sekcji:
    - Dashboard (`/`)
    - Klienci (`/clients`)
    - Wpisy czasu (`/time-entries`)
    - Faktury (`/invoices`)
    - Ustawienia (`/settings`)
    - Przycisk Wyloguj
  - **Obszar treści:** dynamicznie renderuje zawartość aktywnego widoku.
- **Layout publiczny (PublicLayout):**
  - Używany dla stron `/login` i `/register`. Zawiera uproszczony nagłówek i stopkę, bez głównej nawigacji aplikacji.

Aktywna sekcja w nawigacji jest zawsze wizualnie wyróżniona, aby użytkownik wiedział, gdzie się znajduje.

## 5. Kluczowe komponenty

Poniżej znajduje się lista kluczowych, reużywalnych komponentów, które będą stanowić budulec dla widoków.

- **`DataTable / CardList`**: Komponent do wyświetlania list danych, który dynamicznie przełącza się między widokiem tabeli (desktop) a widokiem kart (mobile).
- **`Filters`**: Zestaw kontrolek (listy rozwijane, pola daty) do filtrowania danych na listach. Jego stan jest zarządzany centralnie i przekazywany jako parametry do zapytań API.
- **`Pagination`**: Komponent do nawigacji po stronach wyników, zintegrowany z API.
- **`SearchBar`**: Pole do wyszukiwania tekstowego, które inicjuje zapytania do API po stronie serwera.
- **`FormWrapper`**: Komponent opakowujący formularze, zarządzający stanem ładowania, błędami i obsługą zapisu.
- **`ToastNotification`**: Globalny system powiadomień do wyświetlania komunikatów o sukcesie, błędach lub przypomnieniach.
- **`OnboardingChecklist`**: Komponent na dashboardzie, śledzący i wizualizujący postęp onboardingu użytkownika.
- **`Modal`**: Komponent do wyświetlania treści (np. formularzy) w oknie modalnym, bez opuszczania bieżącego widoku.
- **`AccentColorPicker`**: Komponent w ustawieniach, pozwalający na wybór koloru i dynamicznie aktualizujący zmienne CSS w aplikacji.
