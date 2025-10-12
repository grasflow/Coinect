# Dokument wymagań produktu (PRD) - Coinect

## 1. Przegląd produktu

Coinect to aplikacja webowa skierowana do freelancerów pracujących dla wielu klientów, która automatyzuje proces fakturowania i analizuje wzorce pracy w celu optymalizacji stawek.

Wersja: MVP (Minimum Viable Product)
Platforma: Aplikacja webowa
Grupa docelowa: Freelancerzy pracujący dla wielu klientów jednocześnie, szczególnie ci, którzy używają różnych systemów time tracking

Kluczowe różnicowanie:
- Agregacja czasu z różnych źródeł w jednym miejscu poprzez bulk entry
- Automatyczne generowanie profesjonalnych faktur PDF
- Analiza prywatnych notatek przez AI w celu wykrywania niedowartościowanej pracy
- Wsparcie dla wielowalutowego fakturowania z automatycznym pobieraniem kursów NBP
- Pełna edytowalność wygenerowanych faktur z systemem audytu

## 2. Problem użytkownika

Problem główny:
Freelancerzy pracujący dla wielu klientów tracą 2-3 godziny miesięcznie na fakturowanie. Każdy klient wymaga innego time trackera (Jira, ClickUp, Excel), więc pod koniec miesiąca trzeba ręcznie zbierać dane z różnych systemów, przepisywać godziny i tworzyć faktury z szablonów Word/Excel.

Problem wtórny:
60-70% freelancerów pobiera stawki poniżej rynkowych, ponieważ nie dostrzega wzorców w swojej pracy: nadgodzin, rush work, ciągłych zmian scope. Brak narzędzi do analizy tych wzorców uniemożliwia świadome podejmowanie decyzji o renegocjacji stawek.

Skutki problemu:
- Strata czasu produktywnego na administrację
- Frustracja związana z powtarzalnymi, manualnymi czynnościami
- Niedowartościowana praca i zbyt niskie stawki
- Chaos w dokumentacji i archiwizacji faktur
- Trudności w zarządzaniu klientami międzynarodowymi (różne waluty)

## 3. Wymagania funkcjonalne

3.1. Uwierzytelnianie i autoryzacja
- Rejestracja nowych użytkowników
- Logowanie użytkowników
- Bezpieczne przechowywanie danych użytkownika
- Sesje użytkownika

3.2. Zarządzanie klientami
- Dodawanie nowych klientów z danymi: nazwa, NIP, adres, email, telefon
- Przypisanie domyślnej waluty do klienta (PLN, EUR, USD)
- Ustawienie domyślnej stawki godzinowej dla klienta
- Edycja danych klienta
- Lista wszystkich klientów na dashboardzie
- Wyświetlanie podstawowych statystyk dla klienta (suma godzin, liczba faktur)
- Automatyczne tworzenie profili klientów podczas importu faktur z CSV

3.3. Rejestracja czasu (bulk entry)
- Ręczne dodawanie wpisów czasu z polami: ilość godzin, data, klient
- Możliwość nadpisania stawki godzinowej dla konkretnego wpisu
- Dodawanie opisu publicznego z funkcją autocomplete z historii
- Dodawanie prywatnej notatki dla AI (niewidocznej na fakturze)
- System tagów dla prywatnych notatek (np. "rush", "scope-change", "weekend")
- Podział przechowywania: opis publiczny oddzielnie od notatki prywatnej
- Historia wszystkich wpisów czasu
- Filtrowanie wpisów po kliencie, dacie, statusie (zafakturowane/niezafakturowane)
- Eksport wpisów czasu do CSV

3.4. Generator faktur
- Wybór klienta z listy
- Automatyczne załadowanie niezafakturowanych wpisów czasu dla wybranego klienta
- Grupowanie wpisów według opisu publicznego
- Możliwość selekcji wpisów do włączenia na fakturę (checkboxy)
- Edycja finalnych tytułów usług na fakturze przed generowaniem
- Wybór stawki VAT (23%, 8%, 0%, ZW - zwolniony)
- Automatyczne przeliczenie kwot brutto/netto
- Generowanie profesjonalnego PDF wzorowanego na dostarczonym szablonie
- Kwota do zapłaty przedstawiona słownie (zgodnie z polskimi standardami)
- Możliwość dodania logo użytkownika
- Możliwość wyboru koloru akcentu na fakturze
- Automatyczne pobieranie kursu waluty z API NBP dla faktur w EUR/USD
- Możliwość ręcznego nadpisania kursu waluty
- Cachowanie kursów walut dla danego dnia
- Pełna edytowalność wygenerowanych faktur

3.5. Zarządzanie fakturami
- Archiwum wszystkich wygenerowanych faktur (PDF + dane strukturalne)
- Możliwość ponownego pobrania faktury PDF
- Oznaczanie faktur jako "Opłacone" (checkbox)
- Wizualne oznaczenie edytowanych faktur (badge "Edited" + timestamp ostatniej modyfikacji)
- Dyskretny info banner przy edycji faktury o potencjalnych ryzykach księgowych
- Wyświetlanie listy faktur z filtrowaniem (klient, data, status płatności)
- Import archiwalnych faktur z pliku CSV

3.6. AI Insights (podstawowe w MVP)
- Zbieranie danych z wpisów czasu, notatek prywatnych i tagów
- Przechowywanie danych w formacie przygotowanym do przyszłej analizy
- Placeholder w interfejsie dla przyszłych rekomendacji
- Wykrywanie progu aktywacji (≥20 wpisów z notatkami prywatnymi)
- Logika szczegółowych rekomendacji odłożona na post-MVP

3.7. Onboarding użytkownika
- 3-etapowy onboarding dla nowych użytkowników:
  - Krok 1: Dodaj pierwszego klienta
  - Krok 2: Wprowadź pierwsze wpisy czasu
  - Krok 3: Wygeneruj pierwszą fakturę
- Wizualne wskaźniki postępu (checklist)
- Możliwość pominięcia onboardingu
- Tooltips kontekstowe podczas pierwszych interakcji

3.8. Powiadomienia w aplikacji
- Toast notification w prawym dolnym rogu
- Powiadomienie w ostatnim dniu miesiąca o niezafakturowanych godzinach
- Niemodalne, zamykalne powiadomienia
- Możliwość szybkiej akcji (np. przejście do generatora faktur)

3.9. Integracje techniczne
- Integracja z API NBP: http://api.nbp.pl/api/exchangerates/rates/a/{currency}/{date}/
- Obsługa walut: EUR, USD (PLN jako domyślna)
- Format daty: YYYY-MM-DD
- Fallback w przypadku braku połączenia: ręczne wprowadzenie kursu
- Cache kursów z danego dnia lokalnie

## 4. Granice produktu

4.1. Co NIE wchodzi w zakres MVP:

Analityka i raporty:
- Zaawansowana analityka przychodów z wykresami
- Deep AI analysis (benchmarking ze stawkami rynkowymi)
- Seasonal patterns w AI
- Dashboard z metrykami biznesowymi

Zarządzanie projektami:
- Budżety projektów
- Śledzenie wydatków i kosztów
- Time tracking w czasie rzeczywistym (timer start/stop)
- Predefiniowane szablony pozycji faktur per klient

Funkcje zespołowe:
- Moduł multi-user
- Role i uprawnienia
- Współdzielenie klientów między użytkownikami
- Współpraca nad fakturami

Integracje zewnętrzne:
- Integracje z systemami trackingowymi (Jira, ClickUp)
- Integracja z KSeF
- Integracja z systemami płatności
- Synchronizacja z kalendarzami

Zaawansowane funkcje fakturowania:
- Automatyczne opisy faktur generowane przez AI
- Pełna customizacja brandingu faktur (w MVP tylko logo + kolor)
- Faktury cykliczne
- Historia zmian stawek z wykresami
- Przypomnienia o fakturach
- Statusy faktur poza "Opłacone" (wysłana, przeterminowana, anulowana)
- Faktury korygujące
- Faktury pro-forma

Lokalizacja i waluty:
- Wielojęzyczność (MVP tylko polski)
- Waluty poza PLN, EUR, USD
- Automatyczne przeliczanie między różnymi walutami na jednej fakturze

Portfolio inwestycyjne:
- Moduł portfolio inwestycyjnego
- Zarządzanie oszczędnościami
- Planowanie finansowe

4.2. Założenia techniczne:
- Aplikacja działa tylko online (brak trybu offline)
- Wspierane przeglądarki: Chrome, Firefox, Safari, Edge (najnowsze 2 wersje)
- Maksymalny rozmiar logo: 2MB
- Format logo: PNG, JPG
- Maksymalna liczba klientów w MVP: bez limitu
- Maksymalna liczba wpisów czasu: bez limitu
- Okres przechowywania danych: zgodnie z przepisami (minimum 5 lat dla faktur)

## 5. Historyjki użytkowników

5.1. Uwierzytelnianie i autoryzacja

US-001: Rejestracja nowego użytkownika
Jako nowy użytkownik
Chcę zarejestrować się w aplikacji
Aby móc korzystać z funkcji fakturowania

Kryteria akceptacji:
- Formularz rejestracji zawiera pola: email, hasło, potwierdzenie hasła, imię i nazwisko, NIP (opcjonalnie), adres (opcjonalnie)
- Walidacja formatu email (poprawny adres email)
- Walidacja siły hasła (minimum 8 znaków, litera, cyfra)
- Hasło i potwierdzenie muszą być identyczne
- Email musi być unikalny w systemie
- Po udanej rejestracji użytkownik jest automatycznie zalogowany
- Po rejestracji wyświetla się onboarding (3-etapowy)

US-002: Logowanie użytkownika
Jako zarejestrowany użytkownik
Chcę zalogować się do aplikacji
Aby uzyskać dostęp do moich danych

Kryteria akceptacji:
- Formularz logowania zawiera pola: email, hasło
- System weryfikuje poprawność danych logowania
- Po udanym logowaniu użytkownik jest przekierowywany na dashboard
- Wyświetlany jest komunikat błędu przy niepoprawnych danych
- Sesja użytkownika jest utrzymywana przez 30 dni (remember me) lub do wylogowania

US-003: Wylogowanie użytkownika
Jako zalogowany użytkownik
Chcę wylogować się z aplikacji
Aby zabezpieczyć moje dane

Kryteria akceptacji:
- Przycisk "Wyloguj" jest widoczny w nawigacji
- Po kliknięciu użytkownik jest wylogowywany i przekierowywany na stronę logowania
- Sesja użytkownika jest zakończona
- Próba dostępu do chronionych stron przekierowuje na logowanie

5.2. Zarządzanie klientami

US-004: Dodawanie nowego klienta
Jako freelancer
Chcę dodać nowego klienta do systemu
Aby móc później wystawiać mu faktury

Kryteria akceptacji:
- Formularz zawiera pola: nazwa klienta, NIP, adres, email, telefon, domyślna waluta (PLN/EUR/USD), domyślna stawka godzinowa
- Wszystkie pola są walidowane (NIP - 10 cyfr, email - poprawny format)
- Pole "nazwa klienta" jest wymagane
- Po zapisaniu klient pojawia się na liście klientów
- System wyświetla komunikat potwierdzający dodanie klienta
- Waluta domyślna jest ustawiona na PLN, jeśli nie wybrano innej

US-005: Edycja danych klienta
Jako freelancer
Chcę edytować dane istniejącego klienta
Aby zaktualizować jego informacje kontaktowe lub stawkę

Kryteria akceptacji:
- Przycisk "Edytuj" jest dostępny przy każdym kliencie na liście
- Formularz edycji jest wypełniony aktualnymi danymi
- Możliwa jest zmiana wszystkich pól
- Po zapisaniu zmiany są widoczne natychmiast
- Zmiana stawki nie wpływa na już wygenerowane faktury
- System wyświetla komunikat potwierdzający aktualizację

US-006: Przeglądanie listy klientów
Jako freelancer
Chcę zobaczyć listę wszystkich moich klientów
Aby mieć przegląd nad tym, dla kogo pracuję

Kryteria akceptacji:
- Lista wyświetla: nazwę klienta, NIP, walutę, stawkę, liczbę godzin (suma), liczbę faktur
- Lista jest posortowana alfabetycznie domyślnie
- Możliwość sortowania po nazwie, liczbie godzin, liczbie faktur
- Wyświetlane są podstawowe statystyki dla każdego klienta
- Przycisk "Dodaj klienta" jest widoczny na górze listy

US-007: Wyszukiwanie klienta
Jako freelancer mający wielu klientów
Chcę szybko wyszukać konkretnego klienta
Aby nie przewijać długiej listy

Kryteria akceptacji:
- Pole wyszukiwania jest widoczne nad listą klientów
- Wyszukiwanie działa w czasie rzeczywistym (live search)
- Wyszukiwanie obejmuje nazwę klienta i NIP
- Lista aktualizuje się automatycznie podczas wpisywania
- Możliwość wyczyszczenia pola wyszukiwania jednym kliknięciem

5.3. Rejestracja czasu

US-008: Dodawanie wpisu czasu
Jako freelancer
Chcę dodać wpis czasu dla wykonanej pracy
Aby później móc go zafakturować

Kryteria akceptacji:
- Formularz zawiera pola: klient (dropdown), data, liczba godzin, stawka (domyślnie z profilu klienta, edytowalna), opis publiczny, notatka prywatna, tagi
- Pole "klient" i "liczba godzin" są wymagane
- Data domyślnie ustawiona na dzisiejszą
- Stawka automatycznie pobierana z profilu klienta, ale możliwa do nadpisania
- Opis publiczny ma autocomplete z historycznych wpisów
- Notatka prywatna jest opcjonalna i oznaczona jako "Widoczna tylko dla Ciebie i AI"
- Tagi można wybrać z predefiniowanej listy lub dodać własne
- Po zapisaniu wpis pojawia się na liście ze statusem "Niezafakturowane"

US-009: Edycja wpisu czasu
Jako freelancer
Chcę edytować wcześniej dodany wpis czasu
Aby poprawić pomyłki lub uzupełnić informacje

Kryteria akceptacji:
- Możliwa jest edycja wszystkich pól wpisu
- Nie można edytować wpisów, które zostały już zafakturowane (tylko podgląd)
- Po zapisaniu zmiany są widoczne natychmiast
- System wyświetla komunikat potwierdzający aktualizację

US-010: Przeglądanie historii wpisów czasu
Jako freelancer
Chcę zobaczyć wszystkie moje wpisy czasu
Aby mieć przegląd wykonanej pracy

Kryteria akceptacji:
- Lista wyświetla: datę, klienta, liczba godzin, stawkę, opis publiczny, kwotę, status (zafakturowane/niezafakturowane)
- Lista jest posortowana chronologicznie (najnowsze na górze) domyślnie
- Notatki prywatne są ukryte w widoku listy (dostępne po rozwinięciu)
- Wyświetlana jest suma godzin i kwota dla widocznych wpisów
- Przycisk "Dodaj wpis" jest widoczny na górze listy

US-011: Filtrowanie wpisów czasu
Jako freelancer
Chcę filtrować wpisy czasu według różnych kryteriów
Aby łatwo znaleźć konkretne wpisy

Kryteria akceptacji:
- Dostępne filtry: klient, zakres dat (od-do), status (wszystkie/zafakturowane/niezafakturowane)
- Filtry można łączyć
- Lista aktualizuje się automatycznie po zmianie filtrów
- Możliwość wyczyszczenia wszystkich filtrów jednym kliknięciem
- Aktywne filtry są wizualnie oznaczone

US-012: Eksport wpisów czasu do CSV
Jako freelancer
Chcę wyeksportować moje wpisy czasu do pliku CSV
Aby móc je przeanalizować w Excelu lub zaimportować do innego systemu

Kryteria akceptacji:
- Przycisk "Eksportuj do CSV" jest widoczny nad listą wpisów
- Eksportowane są tylko wpisy zgodne z aktualnie ustawionymi filtrami
- Plik CSV zawiera wszystkie dane wpisu: data, klient, godziny, stawka, kwota, opis publiczny, status
- Notatki prywatne NIE są eksportowane (prywatność)
- Plik ma nazwę: "coinect_time_entries_YYYY-MM-DD.csv"
- Kodowanie pliku: UTF-8 z BOM (poprawne polskie znaki w Excelu)

US-013: Autocomplete opisów publicznych
Jako freelancer często wykonujący podobne zadania
Chcę, aby system podpowiadał mi opisy na podstawie historii
Aby przyspieszyć wprowadzanie wpisów

Kryteria akceptacji:
- Podczas wpisywania w polu "opis publiczny" wyświetlają się sugestie
- Sugestie są unikalne i posortowane alfabetycznie
- Maksymalnie 10 sugestii jednocześnie
- Możliwość wyboru sugestii kliknięciem lub strzałkami + Enter
- Możliwość wpisania własnego opisu mimo sugestii

5.4. Generator faktur i zarządzanie fakturami

US-014: Tworzenie nowej faktury
Jako freelancer
Chcę wygenerować fakturę dla klienta
Aby móc ją wysłać i otrzymać zapłatę

Kryteria akceptacji:
- Formularz generatora zawiera: wybór klienta, lista niezafakturowanych wpisów (checkboxy), wybór stawki VAT
- Po wyborze klienta automatycznie ładują się jego niezafakturowane wpisy
- Wpisy są grupowane według opisu publicznego
- Możliwość edycji finalnego tytułu usługi dla każdej grupy
- Automatyczne przeliczenie kwot: suma godzin × stawka dla każdej pozycji
- Wyświetlenie podsumowania: suma netto, VAT, brutto
- Dla walut EUR/USD automatyczne pobranie kursu z API NBP z możliwością ręcznego nadpisania
- Przycisk "Generuj fakturę" jest aktywny tylko gdy wybrano minimum 1 wpis

US-015: Generowanie PDF faktury
Jako freelancer
Chcę otrzymać profesjonalną fakturę w formacie PDF
Aby móc ją wysłać do klienta

Kryteria akceptacji:
- PDF jest generowany zgodnie z dostarczonym szablonem
- Faktura zawiera: numer (auto-increment), datę wystawienia, datę sprzedaży, dane wystawcy, dane nabywcy
- Pozycje faktury: lp, nazwa usługi, liczba godzin, stawka, wartość netto
- Podsumowanie: suma netto, kwota VAT, suma brutto
- Kwota brutto przedstawiona słownie (np. "jeden tysiąc dwieście pięćdziesiąt złotych 50/100")
- Logo użytkownika (jeśli dodane) w lewym górnym rogu
- Kolor akcentu (domyślnie niebieski) na nagłówkach i liniach
- Dla walut obcych: kurs waluty i kwoty w PLN
- PDF jest automatycznie zapisywany w systemie
- Użytkownik może pobrać PDF natychmiast po wygenerowaniu

US-016: Edycja wygenerowanej faktury
Jako freelancer
Chcę mieć możliwość edycji faktury po jej wygenerowaniu
Aby poprawić literówki lub dostosować treść przed wysłaniem

Kryteria akceptacji:
- Przycisk "Edytuj" jest dostępny przy każdej fakturze
- Możliwa jest edycja wszystkich pól: dane klienta, pozycje, kwoty, daty
- Przy pierwszej edycji w sesji wyświetla się info banner o ryzykach księgowych (zamykalny)
- Po zapisaniu edycji faktura otrzymuje badge "Edited" z timestampem
- Badge "Edited" ma tooltip pokazujący datę ostatniej modyfikacji
- PDF jest regenerowany z zaktualizowanymi danymi
- Oryginalna wersja NIE jest przechowywana (tylko aktualna)

US-017: Przeglądanie archiwum faktur
Jako freelancer
Chcę zobaczyć wszystkie wystawione faktury
Aby mieć przegląd moich rozliczeń

Kryteria akceptacji:
- Lista wyświetla: numer faktury, datę, klienta, kwotę brutto, walutę, status płatności, badge "Edited" (jeśli dotyczy)
- Lista jest posortowana chronologicznie (najnowsze na górze) domyślnie
- Możliwość sortowania po dacie, kwocie, kliencie
- Wyświetlana jest suma kwot dla widocznych faktur (z podziałem na waluty)
- Dla każdej faktury dostępne akcje: podgląd PDF, edycja, oznacz jako opłacone

US-018: Oznaczanie faktury jako opłaconej
Jako freelancer
Chcę oznaczyć fakturę jako opłaconą po otrzymaniu płatności
Aby utrzymać porządek w rozliczeniach

Kryteria akceptacji:
- Checkbox "Opłacone" jest dostępny przy każdej fakturze na liście
- Kliknięcie checkboxa zmienia status faktury natychmiast
- Opłacone faktury są wizualnie oznaczone (np. zielona ikonka)
- Możliwość filtrowania faktur po statusie płatności
- Status płatności jest widoczny na liście i w podglądzie faktury

US-019: Pobieranie faktury PDF
Jako freelancer
Chcę ponownie pobrać fakturę PDF
Aby wysłać ją do klienta lub zachować kopię

Kryteria akceptacji:
- Przycisk "Pobierz PDF" jest dostępny przy każdej fakturze
- Kliknięcie inicjuje pobieranie pliku
- Nazwa pliku: "faktura_[numer]_[nazwa_klienta].pdf"
- PDF zawiera aktualne dane faktury (po ewentualnych edycjach)

US-020: Filtrowanie faktur
Jako freelancer
Chcę filtrować faktury według różnych kryteriów
Aby łatwo znaleźć konkretne faktury

Kryteria akceptacji:
- Dostępne filtry: klient, zakres dat (od-do), status płatności (wszystkie/opłacone/nieopłacone), waluta
- Filtry można łączyć
- Lista aktualizuje się automatycznie po zmianie filtrów
- Możliwość wyczyszczenia wszystkich filtrów jednym kliknięciem
- Aktywne filtry są wizualnie oznaczone

US-021: Import historycznych faktur z CSV
Jako freelancer migrujący do Coinect
Chcę zaimportować moje stare faktury z pliku CSV
Aby mieć całą historię fakturowania w jednym miejscu

Kryteria akceptacji:
- Przycisk "Importuj z CSV" jest dostępny na stronie archiwum faktur
- System wyświetla instrukcje dotyczące formatu pliku CSV
- Format CSV: numer, data wystawienia, data sprzedaży, nazwa klienta, NIP klienta, adres klienta, pozycje (JSON lub osobne kolumny), netto, VAT, brutto, waluta
- System waliduje plik przed importem (poprawność formatu, obowiązkowe pola)
- Jeśli klient nie istnieje w systemie, jest automatycznie tworzony
- Po imporcie faktury pojawiają się w archiwum z oznaczeniem "Imported"
- System wyświetla raport: ile faktur zaimportowano, ile błędów, jakie błędy
- Import NIE tworzy wpisów czasu (tylko faktury archiwalne)

5.5. Kursy walut i wielowalutowość

US-022: Automatyczne pobieranie kursu waluty
Jako freelancer wystawiający faktury w EUR lub USD
Chcę, aby system automatycznie pobrał aktualny kurs waluty
Aby nie musiał go ręcznie wpisywać

Kryteria akceptacji:
- Podczas generowania faktury w EUR/USD system automatycznie odpytuje API NBP
- Używany jest kurs z dnia wystawienia faktury (lub najbliższy wcześniejszy dostępny)
- Kurs jest wyświetlany w formularzu generatora
- Jeśli API NBP nie odpowiada, system wyświetla błąd i prosi o ręczne wprowadzenie kursu
- Pobrany kurs jest cachowany lokalnie dla danego dnia

US-023: Ręczne nadpisanie kursu waluty
Jako freelancer
Chcę mieć możliwość ręcznego wprowadzenia kursu waluty
Aby móc użyć kursu uzgodnionego z klientem

Kryteria akceptacji:
- Pole z kursem waluty jest edytowalne w formularzu generatora
- Możliwość nadpisania automatycznie pobranego kursu
- Po edycji kursu kwoty w PLN są przeliczane na bieżąco
- System oznacza, że kurs został nadpisany ręcznie (ikona + tooltip)
- Ręczny kurs jest zapisywany z fakturą i używany przy jej edycji

US-024: Wyświetlanie kwot w wielowalutowej fakturze
Jako freelancer wystawiający faktury w obcych walutach
Chcę, aby na fakturze wyświetlane były zarówno kwoty w walucie obcej, jak i w PLN
Aby spełnić wymogi polskiego prawa

Kryteria akceptacji:
- Faktura w EUR/USD zawiera sekcję z kursem waluty i datą kursu
- Wszystkie kwoty (netto, VAT, brutto) są wyświetlone w walucie obcej
- Poniżej znajduje się przeliczenie na PLN (kurs × kwota w walucie)
- Kwota brutto w PLN jest przedstawiona słownie
- Format: "Do zapłaty: 1000 EUR (4500 PLN) - cztery tysiące pięćset złotych 00/100"

5.6. AI Insights

US-025: Wyświetlanie progu aktywacji AI
Jako freelancer
Chcę wiedzieć, ile wpisów muszę dodać, aby AI zaczął analizować moją pracę
Aby motywować się do dokładnego dokumentowania

Kryteria akceptacji:
- Widget AI Insights jest widoczny na dashboardzie
- Przed osiągnięciem progu (20 wpisów z notatkami) widget pokazuje pasek postępu
- Tekst: "AI Insights odblokuje się po dodaniu 20 wpisów z prywatnymi notatkami. Masz obecnie: X/20"
- Pasek postępu wizualizuje postęp
- Po osiągnięciu progu widget pokazuje komunikat: "AI Insights jest gotowy do analizy!"

US-026: Zbieranie danych dla AI
Jako system
Chcę zbierać i przechowywać dane z wpisów czasu
Aby przygotować je do przyszłej analizy AI

Kryteria akceptacji:
- Wszystkie wpisy czasu z notatkami prywatnymi są przechowywane w dedykowanej strukturze danych
- Tagi są przechowywane jako tablica powiązana z wpisem
- Struktura danych umożliwia przyszłe zapytania analityczne
- Dane są anonimizowane (bez danych klienta w strukturze AI)
- Timestamp każdego wpisu jest zapisywany

US-027: Placeholder dla przyszłych rekomendacji
Jako freelancer, który osiągnął próg AI
Chcę zobaczyć, gdzie w przyszłości pojawią się rekomendacje AI
Aby wiedzieć, czego się spodziewać

Kryteria akceptacji:
- Po osiągnięciu progu 20 wpisów widget AI Insights zmienia wygląd
- Wyświetlany jest placeholder: "Rekomendacje AI są w przygotowaniu. Wkrótce pojawią się tutaj analizy Twojej pracy."
- Ikona/ilustracja sugerująca analizę danych
- Tooltip z wyjaśnieniem: "AI analizuje Twoje prywatne notatki w poszukiwaniu wzorców niedowartościowanej pracy"

5.7. Onboarding

US-028: Wyświetlanie onboardingu dla nowego użytkownika
Jako nowy użytkownik
Chcę zobaczyć przewodnik po aplikacji po pierwszym zalogowaniu
Aby szybko zacząć z niej korzystać

Kryteria akceptacji:
- Po pierwszym zalogowaniu (zaraz po rejestracji) wyświetla się modal/panel onboardingu
- Onboarding składa się z 3 kroków w formie checklisty
- Każdy krok ma: numer, tytuł, krótki opis, przycisk akcji
- Krok 1: "Dodaj pierwszego klienta" → przycisk przekierowuje do formularza dodawania klienta
- Krok 2: "Wprowadź pierwsze wpisy czasu" → przycisk przekierowuje do formularza dodawania wpisu
- Krok 3: "Wygeneruj pierwszą fakturę" → przycisk przekierowuje do generatora faktur
- Możliwość zamknięcia onboardingu w dowolnym momencie
- Ukończone kroki są oznaczone checkmarkiem i nie są już klikalne

US-029: Kontynuacja onboardingu
Jako użytkownik, który zamknął onboarding
Chcę móc do niego wrócić i dokończyć
Aby nie stracić postępu

Kryteria akceptacji:
- Jeśli onboarding nie został ukończony, jest widoczny w formie kolapsowanego bannera na dashboardzie
- Banner pokazuje postęp: "Ukończono 1/3 kroków. Kontynuuj onboarding"
- Kliknięcie rozwija checklist z krokami
- Automatyczne oznaczanie kroków jako ukończone po wykonaniu akcji
- Po ukończeniu wszystkich 3 kroków banner znika automatycznie
- Możliwość trwałego zamknięcia onboardingu (przycisk "Nie pokazuj więcej")

US-030: Tooltips kontekstowe przy pierwszych interakcjach
Jako nowy użytkownik
Chcę zobaczyć podpowiedzi w kluczowych miejscach interfejsu
Aby lepiej zrozumieć funkcje aplikacji

Kryteria akceptacji:
- Tooltips pojawiają się automatycznie przy pierwszym najechaniu na kluczowe elementy
- Kluczowe elementy: przycisk "Dodaj klienta", pole "Notatka prywatna", przycisk "Generuj fakturę"
- Tooltips są wyświetlane tylko raz (zapisywane w storage)
- Możliwość wyłączenia tooltipów w ustawieniach
- Tooltips są niemodalne i zamykają się automatycznie po 5 sekundach lub po kliknięciu

5.8. Powiadomienia

US-031: Powiadomienie o niezafakturowanych godzinach
Jako freelancer
Chcę otrzymać przypomnienie o niezafakturowanych godzinach pod koniec miesiąca
Aby nie zapomnieć wystawić faktur

Kryteria akceptacji:
- W ostatnim dniu miesiąca (o 18:00) wyświetla się toast notification w prawym dolnym rogu
- Treść: "Masz [X] niezafakturowanych godzin w tym miesiącu. Czas wystawić faktury!"
- Przycisk "Generuj faktury" przekierowuje do generatora
- Przycisk "Zamknij" (X) zamyka notification
- Notification jest niemodalne (nie blokuje pracy w aplikacji)
- Notification jest wyświetlane tylko raz dziennie
- Jeśli użytkownik nie ma niezafakturowanych godzin, notification nie jest wyświetlane

US-032: Zamykanie powiadomień
Jako użytkownik
Chcę móc zamknąć wyświetlone powiadomienie
Aby nie przeszkadzało mi w pracy

Kryteria akceptacji:
- Każde powiadomienie ma przycisk zamknięcia (X) w prawym górnym rogu
- Kliknięcie zamyka powiadomienie z animacją
- Powiadomienie zamyka się automatycznie po 10 sekundach (jeśli nie zostało zamknięte ręcznie)
- Możliwość zamknięcia powiadomienia klawiszem Escape

5.9. Ustawienia użytkownika

US-033: Edycja danych wystawcy faktury
Jako freelancer
Chcę edytować swoje dane, które pojawiają się na fakturach
Aby faktury były poprawne i profesjonalne

Kryteria akceptacji:
- Sekcja "Ustawienia" zawiera formularz danych wystawcy
- Pola: imię i nazwisko / nazwa firmy, NIP, adres, email, telefon, numer rachunku bankowego
- Wszystkie zmiany są zapisywane natychmiast (auto-save lub przycisk "Zapisz")
- Dane są automatycznie używane przy generowaniu nowych faktur
- Zmiana danych NIE wpływa na już wygenerowane faktury

US-034: Dodawanie logo
Jako freelancer
Chcę dodać swoje logo do faktur
Aby wyglądały bardziej profesjonalnie

Kryteria akceptacji:
- W sekcji "Ustawienia" jest opcja "Logo na fakturze"
- Możliwość przesłania pliku (PNG, JPG, maksymalnie 2MB)
- Podgląd przesłanego logo
- Logo jest automatycznie skalowane do odpowiedniego rozmiaru
- Możliwość usunięcia logo
- Logo jest automatycznie dodawane do wszystkich nowych faktur

US-035: Wybór koloru akcentu
Jako freelancer
Chcę wybrać kolor akcentu na fakturach
Aby dostosować je do mojego brandingu

Kryteria akceptacji:
- W sekcji "Ustawienia" jest color picker do wyboru koloru
- Podgląd koloru w czasie rzeczywistym
- Domyślny kolor: niebieski (#2563EB)
- Kolor jest zapisywany automatycznie
- Kolor jest stosowany do: nagłówków, linii, przycisków na fakturze PDF
- Wybór koloru NIE wpływa na już wygenerowane faktury

5.10. Dashboard i nawigacja

US-036: Wyświetlanie dashboardu
Jako zalogowany użytkownik
Chcę zobaczyć podsumowanie mojej aktywności na stronie głównej
Aby szybko zorientować się w stanie rozliczeń

Kryteria akceptacji:
- Dashboard wyświetla: liczbę klientów, sumę niezafakturowanych godzin, sumę kwot na nieopłaconych fakturach (z podziałem na waluty)
- Sekcja "Ostatnie wpisy czasu" (5 najnowszych)
- Sekcja "Ostatnie faktury" (5 najnowszych)
- Widget AI Insights
- Pasek onboardingu (jeśli nie ukończony)
- Szybkie akcje: "Dodaj wpis czasu", "Generuj fakturę", "Dodaj klienta"

US-037: Nawigacja między sekcjami
Jako użytkownik
Chcę łatwo poruszać się po aplikacji
Aby szybko znaleźć potrzebną funkcję

Kryteria akceptacji:
- Nawigacja główna zawiera linki: Dashboard, Klienci, Wpisy czasu, Faktury, Ustawienia, Wyloguj
- Aktywna sekcja jest wizualnie oznaczona
- Nawigacja jest zawsze widoczna (sticky header lub sidebar)
- Na urządzeniach mobilnych nawigacja jest ukryta w menu hamburger

US-038: Responsywność aplikacji
Jako użytkownik korzystający z różnych urządzeń
Chcę, aby aplikacja działała poprawnie na telefonie i tablecie
Aby móc pracować w dowolnym miejscu

Kryteria akceptacji:
- Aplikacja jest w pełni responsywna (desktop, tablet, mobile)
- Na urządzeniach mobilnych formularze są dostosowane do ekranu
- Listy są scrollowalne i zoptymalizowane pod touch
- PDF faktur jest generowany zawsze w tym samym formacie (A4), niezależnie od urządzenia
- Wszystkie funkcje są dostępne na urządzeniach mobilnych

5.11. System audytu i bezpieczeństwo

US-039: Wizualne oznaczenie edytowanych faktur
Jako freelancer
Chcę widzieć, które faktury były edytowane po wygenerowaniu
Aby mieć świadomość zmian i uniknąć pomyłek

Kryteria akceptacji:
- Edytowane faktury mają badge "Edited" na liście faktur
- Badge ma kolor pomarańczowy i jest widoczny obok numeru faktury
- Tooltip na badge pokazuje: "Ostatnia edycja: [data i czas]"
- Badge NIE pojawia się na PDF faktury (tylko w interfejsie)
- Po pierwszej edycji badge jest ustawiany i pozostaje permanentnie

US-040: Info banner przy edycji faktury
Jako freelancer edytujący fakturę
Chcę otrzymać informację o potencjalnych ryzykach
Aby być świadomym konsekwencji edycji

Kryteria akceptacji:
- Przy otwarciu formularza edycji faktury wyświetla się dyskretny info banner
- Treść: "Uwaga: Edycja faktury po wygenerowaniu może prowadzić do rozbieżności księgowych. Zalecamy tworzenie faktury korygującej dla istotnych zmian."
- Banner ma kolor niebieski (informacyjny, nie alarmowy)
- Przycisk "Rozumiem" zamyka banner
- Banner jest pokazywany tylko raz na sesję (nie przy każdej edycji)

US-041: Bezpieczne przechowywanie danych
Jako użytkownik
Chcę mieć pewność, że moje dane są bezpiecznie przechowywane
Aby nie martwić się o wycieki lub utratę danych

Kryteria akceptacji:
- Hasła są hashowane (bcrypt lub Argon2)
- Połączenia są szyfrowane (HTTPS)
- Sesje mają mechanizm timeout (30 dni lub wylogowanie)
- Prywatne notatki są przechowywane oddzielnie od opisów publicznych
- Backup danych jest wykonywany codziennie (po stronie serwera)

## 6. Metryki sukcesu

6.1. Metryki aktywacji (7 dni od rejestracji)

Dodanie pierwszego klienta:
- Cel: 80% użytkowników
- Mierzenie: % użytkowników, którzy dodali minimum 1 klienta w ciągu 7 dni od rejestracji
- Metoda: Event tracking w aplikacji (event: "client_created")

Dodanie wpisów czasu:
- Cel: 60% użytkowników
- Mierzenie: % użytkowników, którzy dodali minimum 5 wpisów czasu w ciągu 7 dni od rejestracji
- Metoda: Event tracking w aplikacji (event: "time_entry_created", count ≥ 5)

6.2. Metryki retencji (30 dni)

Generowanie pierwszej faktury:
- Cel: 50% użytkowników
- Mierzenie: % użytkowników, którzy wygenerowali minimum 1 fakturę w ciągu 30 dni od rejestracji
- Metoda: Event tracking w aplikacji (event: "invoice_generated")

Powrót w kolejnym miesiącu:
- Cel: 40% użytkowników
- Mierzenie: % użytkowników, którzy zalogowali się w miesiącu M+1 po rejestracji w miesiącu M
- Metoda: Analiza kohort użytkowników (cohort analysis) na podstawie logów logowania

6.3. Metryki wartości dostarczonej

Czas do pierwszej faktury:
- Cel: średnia < 10 minut
- Mierzenie: czas od rejestracji do wygenerowania pierwszej faktury
- Metoda: Różnica timestampów (event: "user_registered" → "first_invoice_generated")

Deklarowana oszczędność czasu:
- Cel: > 30 minut/miesiąc vs poprzedni sposób
- Mierzenie: mikroankieta w aplikacji po wygenerowaniu 2. faktury w miesiącu
- Pytanie: "Ile czasu zaoszczędziłeś używając Coinect w porównaniu do poprzedniego sposobu fakturowania?"
- Metoda: Średnia z odpowiedzi użytkowników

6.4. Metryki walidacji AI

Użytkownicy z wystarczającymi danymi:
- Cel: 20% użytkowników ma ≥20 wpisów z prywatnymi notatkami
- Mierzenie: % aktywnych użytkowników z ≥20 wpisami z wypełnionymi notatkami prywatnymi
- Metoda: Query do bazy danych (count time entries WHERE private_note IS NOT NULL)

Wzrost użycia notatek po odblokowaniu AI:
- Cel: 30% użytkowników, którzy zobaczyli widget AI, dodaje więcej notatek
- Mierzenie: porównanie średniej liczby notatek/wpis przed i po osiągnięciu progu 20 wpisów
- Metoda: Analiza kohort użytkowników (przed/po odblokowania AI Insights)

6.5. Metryki biznesowe (post-launch)

Konwersja z free do paid:
- Cel: 15% w ciągu 90 dni
- Mierzenie: % użytkowników, którzy przeszli na plan płatny w ciągu 90 dni od rejestracji
- Uwaga: W MVP nie ma planów płatnych, metryka przygotowana na przyszłość
- Metoda: Event tracking (event: "subscription_started")

Churn rate:
- Cel: < 20% miesięcznie w pierwszych 3 miesiącach
- Mierzenie: % użytkowników, którzy przestali się logować w danym miesiącu
- Definicja churnu: brak logowania przez 30 dni
- Metoda: Analiza aktywności użytkowników w kohortach miesięcznych

6.6. Metryki adopcji funkcji (dodatkowe)

Użycie wielowalutowości:
- Mierzenie: % użytkowników korzystających z walut EUR lub USD
- Metoda: Query do bazy (count users with invoices WHERE currency != 'PLN')

Częstotliwość ręcznego nadpisywania kursów:
- Mierzenie: % faktur w obcych walutach z ręcznie nadpisanym kursem
- Metoda: Query do bazy (count invoices WHERE custom_exchange_rate = TRUE)

Adopcja importu CSV:
- Mierzenie: % użytkowników, którzy zaimportowali historyczne faktury
- Metoda: Event tracking (event: "csv_import_completed")

Użycie eksportu:
- Mierzenie: % użytkowników, którzy wyeksportowali wpisy czasu do CSV
- Metoda: Event tracking (event: "time_entries_exported")

Ukończenie onboardingu:
- Mierzenie: % użytkowników, którzy ukończyli wszystkie 3 kroki onboardingu
- Metoda: Event tracking (event: "onboarding_completed")

6.7. Metody zbierania danych

Event tracking:
- Implementacja: biblioteka analityczna (np. Mixpanel, Amplitude) lub własne rozwiązanie
- Kluczowe eventy: user_registered, client_created, time_entry_created, invoice_generated, invoice_edited, csv_import_completed, onboarding_step_completed

Mikroankiety:
- Wyświetlanie w aplikacji po określonych akcjach
- Narzędzie: modal z prostym formularzem (1-2 pytania)
- Częstotliwość: po wygenerowaniu 2. faktury w miesiącu (tylko raz)

Analiza kohort:
- Grupowanie użytkowników według daty rejestracji
- Śledzenie aktywności w kolejnych okresach (D7, D30, M1, M2, M3)
- Narzędzie: zapytania do bazy danych + dashboard analityczny

Logi systemowe:
- Logowanie kluczowych akcji użytkowników z timestampami
- Przechowywanie przez minimum 90 dni
- Wykorzystanie do analizy zachowań i debugowania

6.8. Harmonogram pomiarów

Tygodniowy:
- Metryki aktywacji (D7)
- Liczba nowych rejestracji
- Liczba wygenerowanych faktur

Miesięczny:
- Metryki retencji (D30)
- Churn rate
- Średni czas do pierwszej faktury
- Adopcja funkcji (wielowalutowość, import, export)

Kwartalny:
- Konwersja do paid (przygotowanie na przyszłość)
- Analiza kohort długoterminowa
- Walidacja AI (% użytkowników z ≥20 wpisami)
- Review mikroankiet (średnia oszczędność czasu)

6.9. Kryteria sukcesu MVP

MVP zostanie uznany za sukces, jeśli po 3 miesiącach od launch:
- Minimum 80% nowych użytkowników dodaje pierwszego klienta w ciągu 7 dni
- Minimum 50% użytkowników generuje minimum 1 fakturę w ciągu 30 dni
- Średni czas do pierwszej faktury < 10 minut
- Churn rate < 20% miesięcznie
- Minimum 20% aktywnych użytkowników ma ≥20 wpisów z notatkami prywatnymi

Dodatkowe wskaźniki sukcesu:
- Pozytywny feedback od użytkowników (NPS > 30)
- Brak krytycznych bugów blokujących pracę
- Średnia deklarowana oszczędność czasu > 30 min/miesiąc

Jeśli którakolwiek z kluczowych metryk nie zostanie osiągnięta, należy przeprowadzić analizę przyczyn i zaplanować iteracje produktu.
