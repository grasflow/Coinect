# Implementacja pobierania PDF faktur (On-the-Fly)

## Przegląd

Zaimplementowano funkcjonalność generowania faktur w formacie PDF **on-the-fly** (na żądanie) - PDF nie jest składowany w bazie danych, tylko generowany w momencie pobierania.

## Zalety podejścia on-the-fly

- ✅ **Brak kosztów storage** - PDF nie zajmuje miejsca w bazie danych
- ✅ **Zawsze aktualne** - PDF zawsze odzwierciedla najnowsze dane faktury
- ✅ **Automatyczne zmiany** - edycja faktury automatycznie wpływa na PDF
- ✅ **Prostsza architektura** - nie trzeba zarządzać synchronizacją plików
- ✅ **Bezpieczeństwo** - brak ryzyka przestarzałych lub niespójnych PDF

## Zaimplementowane komponenty

### 1. Serwis generowania PDF

**Plik:** `src/lib/services/pdf.service.ts`

Serwis używa bibliotek `jspdf` i `jspdf-autotable` do generowania profesjonalnych PDF:

**Funkcje:**

- `generateInvoicePDF()` - główna funkcja generująca PDF faktury
- Obsługa logo użytkownika
- Personalizowany kolor akcentu
- Pełne dane faktury: wystawca, nabywca, pozycje, sumy
- Wsparcie dla walut obcych z kursami NBP
- Kwota słownie w języku polskim
- Automatyczne formatowanie dat i liczb

### 2. Endpoint pobierania/generowania PDF

**Plik:** `src/pages/api/invoices/[id]/pdf.ts`

- **Metoda:** GET
- **URL:** `/api/invoices/{invoice_id}/pdf`
- **Autoryzacja:** Token użytkownika (wymaga zalogowania)
- **Zwraca:** Wygenerowany PDF z odpowiednimi nagłówkami do pobrania

**Logika:**

1. Weryfikacja uprawnień użytkownika
2. Pobranie pełnych danych faktury z bazy (z klientem, pozycjami, wpisami czasu)
3. Pobranie profilu użytkownika (logo, dane firmy, kolor akcentu)
4. **Generowanie PDF on-the-fly** używając `generateInvoicePDF()`
5. Zwrócenie wygenerowanego Blob jako Response z nagłówkami:
   - `Content-Type: application/pdf`
   - `Content-Disposition: attachment; filename="..."`
   - `Cache-Control: private, no-cache`

### 3. Endpoint generowania faktur

**Plik:** `src/pages/api/invoices/generate.ts`

Endpoint **NIE** generuje PDF podczas tworzenia faktury:

- ✅ Tworzy rekord faktury w bazie danych
- ✅ Tworzy pozycje faktury
- ✅ Aktualizuje wpisy czasu
- ❌ **NIE** generuje ani nie zapisuje PDF
- ℹ️ PDF generowany jest dopiero przy pierwszym pobraniu

### 4. Funkcjonalność pobierania w UI

#### Lista faktur

**Plik:** `src/components/features/invoices/InvoicesListView.tsx`

- Każdy wiersz faktury ma przycisk pobierania PDF (ikona Download)
- `handleDownloadPDF()` wywołuje endpoint `/api/invoices/[id]/pdf`
- Toast z informacją "Generowanie PDF..." podczas oczekiwania
- Automatyczne pobieranie pliku na komputer użytkownika
- Nazwa pliku pobierana z nagłówka `Content-Disposition`

**Plik:** `src/components/features/invoices/InvoiceRow.tsx`

- Przycisk pobierania **zawsze widoczny** (nie sprawdza `pdf_url`)
- PDF generowany on-demand dla każdej faktury

#### Edycja faktury

**Plik:** `src/components/features/invoices/InvoiceEditView.tsx`

- Przycisk "Pobierz PDF" w headerze (zawsze widoczny)
- Działa identycznie jak w liście faktur
- Toast notification z informacją o postępie

## Jak używać

### Użytkownik końcowy

1. **Lista faktur** (`/invoices`):
   - Kliknij ikonę pobierania (Download) przy fakturze
   - PDF zostanie automatycznie pobrany

2. **Edycja faktury** (`/invoices/{id}/edit`):
   - Kliknij przycisk "Pobierz PDF" w prawym górnym rogu
   - PDF zostanie automatycznie pobrany

### Developer

#### Testowanie lokalnie

```bash
# Upewnij się że Supabase jest uruchomiony
npm run dev

# Przejdź do listy faktur lub edycji faktury
# Kliknij "Pobierz PDF" - PDF zostanie wygenerowany on-the-fly
```

#### Struktura nazwy pliku

**Format:** `faktura_{numer_faktury}_{nazwa_klienta}.pdf`
**Przykład:** `faktura_INV-2025-001_Acme-Corp.pdf`

**Uwaga:** PDF NIE jest składowany - każde kliknięcie generuje świeży plik

## Typy błędów

| Kod błędu        | Opis                          |
| ---------------- | ----------------------------- |
| `UNAUTHORIZED`   | Brak lub nieprawidłowy token  |
| `NOT_FOUND`      | Faktura nie istnieje          |
| `INTERNAL_ERROR` | Błąd generowania PDF lub bazy |

## Uwagi techniczne

1. **Bezpieczeństwo:**
   - Endpoint weryfikuje uprawnienia przed generowaniem PDF
   - RLS policies w bazie danych zapewniają dostęp tylko do własnych faktur
   - Brak ryzyka niezgodności danych (PDF zawsze aktualny)

2. **Wydajność:**
   - PDF generowany w pamięci (bez zapisu na dysk)
   - Blob zwracany bezpośrednio do przeglądarki
   - `Cache-Control: private, no-cache` - przeglądarka nie cache'uje
   - Czas generowania: ~200-500ms dla typowej faktury

3. **Zalety on-the-fly:**
   - ✅ Automatyczna synchronizacja z edycjami faktury
   - ✅ Brak problemów z orphaned files
   - ✅ Zero kosztów storage
   - ✅ Zawsze najnowsza wersja danych

4. **Wady on-the-fly:**
   - ⚠️ Krótkie opóźnienie przy pobieraniu (generowanie)
   - ⚠️ Większe obciążenie CPU przy każdym pobraniu
   - ⚠️ Brak historii wersji PDF

5. **Format PDF:**
   - A4, portrait
   - Profesjonalny wygląd zgodny z polskimi standardami
   - Zawiera wszystkie wymagane elementy faktury
   - Personalizacja: logo, kolor akcentu

## Debugowanie

### Logi serwera

Po kliknięciu "Pobierz PDF", sprawdź terminal z `npm run dev`:

```
PDF endpoint wywołany dla faktury: 6888dfe4-3887-4bca-976f-0ea4b1d0dd72
Rozpoczęcie generowania PDF dla faktury: INV-2025-001
```

### Błędy w konsoli przeglądarki

Jeśli widzisz błąd 500, sprawdź:

1. Logi serwera w terminalu
2. Network tab w DevTools - kliknij request i sprawdź Response
3. Czy `jspdf` i `jspdf-autotable` są zainstalowane: `npm list jspdf jspdf-autotable`

### Typowe problemy

| Problem                                   | Rozwiązanie                                                                    |
| ----------------------------------------- | ------------------------------------------------------------------------------ |
| `autoTable is not a function`             | Upewnij się że import to `import "jspdf-autotable"` (side-effect)              |
| `Cannot read property 'logo_url' of null` | Profil użytkownika nie został pobrany - sprawdź RLS policies                   |
| `Failed to load image`                    | Logo URL jest nieprawidłowy lub niedostępny                                    |
| Błąd CORS przy logo                       | Logo musi być hostowane w tej samej domenie lub z prawidłowymi nagłówkami CORS |

## Możliwe usprawnienia

- [ ] Cache PDF w pamięci na kilka minut (Redis/Memcached)
- [ ] Podgląd PDF w przeglądarce (`inline` zamiast `attachment`)
- [ ] Wsparcie dla faktur korygujących
- [ ] Watermark dla niezapłaconych faktur
- [ ] Batch download wielu faktur jako ZIP
- [ ] Email wysyłka faktury do klienta
- [ ] Generowanie w tle (worker queue) dla bardzo dużych faktur
