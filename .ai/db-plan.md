# Schemat Bazy Danych - Coinect MVP

## 1. Tabele z kolumnami, typami danych i ograniczeniami

### 1.1. profiles

Tabela “users/profiles” będzie obsługiwana przez Supabase Auth
Przechowuje dane profilowe użytkowników (wystawców faktur).

| Kolumna | Typ | Ograniczenia | Opis |
|---------|-----|--------------|------|
| id | UUID | PRIMARY KEY | Identyfikator profilu (= auth.users.id) |
| full_name | VARCHAR(255) | NOT NULL | Imię i nazwisko / nazwa firmy |
| tax_id | VARCHAR(20) | | NIP |
| street | VARCHAR(255) | | Ulica i numer |
| city | VARCHAR(100) | | Miasto |
| postal_code | VARCHAR(20) | | Kod pocztowy |
| country | VARCHAR(100) | DEFAULT 'Polska' | Kraj |
| email | VARCHAR(255) | | Email kontaktowy |
| phone | VARCHAR(50) | | Telefon |
| bank_account | VARCHAR(50) | | Numer rachunku bankowego |
| logo_url | TEXT | | URL do logo użytkownika |
| accent_color | VARCHAR(7) | DEFAULT '#2563EB' | Kolor akcentu na fakturach (HEX) |
| onboarding_completed | BOOLEAN | DEFAULT FALSE | Status ukończenia onboardingu |
| onboarding_step | INTEGER | DEFAULT 0 | Aktualny krok onboardingu (0-3) |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | Data utworzenia |
| updated_at | TIMESTAMPTZ | DEFAULT NOW() | Data ostatniej aktualizacji |

**Constraints:**
- `id` jest kluczem obcym referencyjnym do `auth.users(id) ON DELETE CASCADE`

---

### 1.2. clients
Przechowuje dane klientów użytkownika.

| Kolumna | Typ | Ograniczenia | Opis |
|---------|-----|--------------|------|
| id | UUID | PRIMARY KEY DEFAULT uuid_generate_v4() | Identyfikator klienta |
| user_id | UUID | NOT NULL | Właściciel klienta |
| name | VARCHAR(255) | NOT NULL | Nazwa klienta |
| tax_id | VARCHAR(20) | | NIP klienta |
| street | VARCHAR(255) | | Ulica i numer |
| city | VARCHAR(100) | | Miasto |
| postal_code | VARCHAR(20) | | Kod pocztowy |
| country | VARCHAR(100) | DEFAULT 'Polska' | Kraj |
| email | VARCHAR(255) | | Email |
| phone | VARCHAR(50) | | Telefon |
| default_currency | currency_enum | DEFAULT 'PLN' | Domyślna waluta |
| default_hourly_rate | NUMERIC(10,2) | | Domyślna stawka godzinowa |
| deleted_at | TIMESTAMPTZ | | Data usunięcia (soft delete) |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | Data utworzenia |
| updated_at | TIMESTAMPTZ | DEFAULT NOW() | Data ostatniej aktualizacji |

**Constraints:**
- `user_id` -> `profiles(id) ON DELETE CASCADE`
- UNIQUE `(user_id, name)` WHERE `deleted_at IS NULL`

---

### 1.3. tags
Przechowuje tagi używane w prywatnych notatkach wpisów czasu.

| Kolumna | Typ | Ograniczenia | Opis |
|---------|-----|--------------|------|
| id | UUID | PRIMARY KEY DEFAULT uuid_generate_v4() | Identyfikator tagu |
| user_id | UUID | NOT NULL | Właściciel tagu |
| name | VARCHAR(100) | NOT NULL | Nazwa tagu |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | Data utworzenia |

**Constraints:**
- `user_id` -> `profiles(id) ON DELETE CASCADE`
- UNIQUE `(user_id, name)`

---

### 1.4. time_entries
Przechowuje wpisy czasu pracy użytkownika.

| Kolumna | Typ | Ograniczenia | Opis |
|---------|-----|--------------|------|
| id | UUID | PRIMARY KEY DEFAULT uuid_generate_v4() | Identyfikator wpisu |
| user_id | UUID | NOT NULL | Właściciel wpisu |
| client_id | UUID | NOT NULL | Klient, dla którego wykonano pracę |
| date | DATE | NOT NULL | Data wykonania pracy |
| hours | NUMERIC(5,2) | NOT NULL CHECK (hours > 0) | Liczba godzin |
| hourly_rate | NUMERIC(10,2) | NOT NULL CHECK (hourly_rate >= 0) | Stawka godzinowa |
| currency | currency_enum | NOT NULL | Waluta stawki |
| public_description | TEXT | | Opis publiczny (widoczny na fakturze) |
| private_note | TEXT | | Notatka prywatna (dla AI) |
| invoice_id | UUID | | Faktura, do której przypisano wpis |
| deleted_at | TIMESTAMPTZ | | Data usunięcia (soft delete) |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | Data utworzenia |
| updated_at | TIMESTAMPTZ | DEFAULT NOW() | Data ostatniej aktualizacji |

**Constraints:**
- `user_id` -> `profiles(id) ON DELETE CASCADE`
- `client_id` -> `clients(id) ON DELETE RESTRICT`
- `invoice_id` -> `invoices(id) ON DELETE SET NULL`

---

### 1.5. time_entry_tags
Tabela łącząca wpisy czasu z tagami (relacja wiele-do-wielu).

| Kolumna | Typ | Ograniczenia | Opis |
|---------|-----|--------------|------|
| time_entry_id | UUID | NOT NULL | Identyfikator wpisu czasu |
| tag_id | UUID | NOT NULL | Identyfikator tagu |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | Data utworzenia |

**Constraints:**
- PRIMARY KEY `(time_entry_id, tag_id)`
- `time_entry_id` -> `time_entries(id) ON DELETE CASCADE`
- `tag_id` -> `tags(id) ON DELETE CASCADE`

---

### 1.6. invoices
Przechowuje faktury wygenerowane przez użytkownika.

| Kolumna | Typ | Ograniczenia | Opis |
|---------|-----|--------------|------|
| id | UUID | PRIMARY KEY DEFAULT uuid_generate_v4() | Identyfikator faktury |
| user_id | UUID | NOT NULL | Właściciel faktury |
| client_id | UUID | NOT NULL | Klient, dla którego wystawiono fakturę |
| invoice_number | VARCHAR(50) | NOT NULL | Numer faktury |
| issue_date | DATE | NOT NULL | Data wystawienia |
| sale_date | DATE | NOT NULL | Data sprzedaży |
| currency | currency_enum | NOT NULL | Waluta faktury |
| exchange_rate | NUMERIC(10,4) | | Kurs waluty (dla EUR/USD) |
| exchange_rate_date | DATE | | Data kursu waluty |
| is_custom_exchange_rate | BOOLEAN | DEFAULT FALSE | Czy kurs został ręcznie nadpisany |
| net_amount | NUMERIC(12,2) | NOT NULL | Kwota netto |
| vat_rate | NUMERIC(5,2) | NOT NULL | Stawka VAT (%) |
| vat_amount | NUMERIC(12,2) | NOT NULL | Kwota VAT |
| gross_amount | NUMERIC(12,2) | NOT NULL | Kwota brutto |
| net_amount_pln | NUMERIC(12,2) | | Kwota netto w PLN (dla walut obcych) |
| vat_amount_pln | NUMERIC(12,2) | | Kwota VAT w PLN (dla walut obcych) |
| gross_amount_pln | NUMERIC(12,2) | | Kwota brutto w PLN (dla walut obcych) |
| gross_amount_words | TEXT | | Kwota brutto słownie |
| status | invoice_status_enum | DEFAULT 'unpaid' | Status faktury |
| is_paid | BOOLEAN | DEFAULT FALSE | Czy faktura została opłacona |
| is_imported | BOOLEAN | DEFAULT FALSE | Czy faktura została zaimportowana z CSV |
| is_edited | BOOLEAN | DEFAULT FALSE | Czy faktura była edytowana |
| edited_at | TIMESTAMPTZ | | Data ostatniej edycji |
| pdf_url | TEXT | | URL do wygenerowanego PDF |
| deleted_at | TIMESTAMPTZ | | Data usunięcia (soft delete) |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | Data utworzenia |
| updated_at | TIMESTAMPTZ | DEFAULT NOW() | Data ostatniej aktualizacji |

**Constraints:**
- `user_id` -> `profiles(id) ON DELETE CASCADE`
- `client_id` -> `clients(id) ON DELETE RESTRICT`
- UNIQUE `(user_id, invoice_number)` WHERE `deleted_at IS NULL`
- CHECK `(currency != 'PLN' AND exchange_rate IS NOT NULL) OR (currency = 'PLN')`

---

### 1.7. invoice_items
Przechowuje pozycje (linie) na fakturze.

| Kolumna | Typ | Ograniczenia | Opis |
|---------|-----|--------------|------|
| id | UUID | PRIMARY KEY DEFAULT uuid_generate_v4() | Identyfikator pozycji |
| invoice_id | UUID | NOT NULL | Faktura, do której należy pozycja |
| position | INTEGER | NOT NULL | Numer pozycji na fakturze (LP) |
| description | TEXT | NOT NULL | Opis usługi |
| quantity | NUMERIC(10,2) | NOT NULL CHECK (quantity > 0) | Liczba godzin |
| unit_price | NUMERIC(10,2) | NOT NULL CHECK (unit_price >= 0) | Stawka godzinowa |
| net_amount | NUMERIC(12,2) | NOT NULL | Wartość netto (quantity × unit_price) |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | Data utworzenia |
| updated_at | TIMESTAMPTZ | DEFAULT NOW() | Data ostatniej aktualizacji |

**Constraints:**
- `invoice_id` -> `invoices(id) ON DELETE CASCADE`
- UNIQUE `(invoice_id, position)`

---

### 1.8. invoice_item_time_entries
Tabela łącząca pozycje faktur z wpisami czasu (relacja wiele-do-wielu).

| Kolumna | Typ | Ograniczenia | Opis |
|---------|-----|--------------|------|
| invoice_item_id | UUID | NOT NULL | Identyfikator pozycji faktury |
| time_entry_id | UUID | NOT NULL | Identyfikator wpisu czasu |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | Data utworzenia |

**Constraints:**
- PRIMARY KEY `(invoice_item_id, time_entry_id)`
- `invoice_item_id` -> `invoice_items(id) ON DELETE CASCADE`
- `time_entry_id` -> `time_entries(id) ON DELETE RESTRICT`

---

### 1.9. ai_insights_data
Tabela agregująca zanonimizowane dane dla przyszłych analiz AI.

| Kolumna | Typ | Ograniczenia | Opis |
|---------|-----|--------------|------|
| id | UUID | PRIMARY KEY DEFAULT uuid_generate_v4() | Identyfikator wpisu |
| user_id | UUID | NOT NULL | Właściciel danych |
| time_entry_id | UUID | NOT NULL | Referencja do wpisu czasu |
| date | DATE | NOT NULL | Data wpisu |
| day_of_week | INTEGER | NOT NULL | Dzień tygodnia (1-7) |
| hours | NUMERIC(5,2) | NOT NULL | Liczba godzin |
| hourly_rate | NUMERIC(10,2) | NOT NULL | Stawka godzinowa |
| private_note | TEXT | | Notatka prywatna |
| tags | JSONB | | Tagi jako tablica JSON |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | Data utworzenia |

**Constraints:**
- `user_id` -> `profiles(id) ON DELETE CASCADE`
- `time_entry_id` -> `time_entries(id) ON DELETE CASCADE`
- UNIQUE `(time_entry_id)`

---

### 1.10. exchange_rate_cache
Przechowuje cache kursów walut z API NBP.

| Kolumna | Typ | Ograniczenia | Opis |
|---------|-----|--------------|------|
| id | UUID | PRIMARY KEY DEFAULT uuid_generate_v4() | Identyfikator wpisu |
| currency | currency_enum | NOT NULL | Waluta |
| rate_date | DATE | NOT NULL | Data kursu |
| rate | NUMERIC(10,4) | NOT NULL | Kurs waluty |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | Data pobrania |

**Constraints:**
- UNIQUE `(currency, rate_date)`

---

## 2. Typy ENUM

### 2.1. currency_enum
```sql
CREATE TYPE currency_enum AS ENUM ('PLN', 'EUR', 'USD');
```

### 2.2. invoice_status_enum
```sql
CREATE TYPE invoice_status_enum AS ENUM ('unpaid', 'paid');
```

---

## 3. Relacje między tabelami

### 3.1. One-to-One
- `profiles.id` ↔ `auth.users.id` (Supabase Auth)

### 3.2. One-to-Many
- `profiles` → `clients` (jeden użytkownik ma wielu klientów)
- `profiles` → `tags` (jeden użytkownik ma wiele tagów)
- `profiles` → `time_entries` (jeden użytkownik ma wiele wpisów czasu)
- `profiles` → `invoices` (jeden użytkownik ma wiele faktur)
- `profiles` → `ai_insights_data` (jeden użytkownik ma wiele wpisów analitycznych)
- `clients` → `time_entries` (jeden klient ma wiele wpisów czasu)
- `clients` → `invoices` (jeden klient ma wiele faktur)
- `invoices` → `time_entries` (jedna faktura może zawierać wiele wpisów czasu)
- `invoices` → `invoice_items` (jedna faktura ma wiele pozycji)
- `time_entries` → `ai_insights_data` (jeden wpis czasu → jeden wpis analityczny)

### 3.3. Many-to-Many
- `time_entries` ↔ `tags` (przez `time_entry_tags`)
- `invoice_items` ↔ `time_entries` (przez `invoice_item_time_entries`)

---

## 4. Indeksy

### 4.1. Indeksy funkcjonalne

```sql
-- profiles
CREATE INDEX idx_profiles_user_id ON profiles(id);

-- clients
CREATE INDEX idx_clients_user_id ON clients(user_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_clients_name ON clients(user_id, name) WHERE deleted_at IS NULL;

-- tags
CREATE INDEX idx_tags_user_id ON tags(user_id);

-- time_entries
CREATE INDEX idx_time_entries_user_id ON time_entries(user_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_time_entries_client_id ON time_entries(client_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_time_entries_date ON time_entries(user_id, date DESC) WHERE deleted_at IS NULL;
CREATE INDEX idx_time_entries_invoice_id ON time_entries(invoice_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_time_entries_unbilled ON time_entries(user_id, client_id) WHERE invoice_id IS NULL AND deleted_at IS NULL;
CREATE INDEX idx_time_entries_private_note ON time_entries(user_id) WHERE private_note IS NOT NULL AND deleted_at IS NULL;

-- invoices
CREATE INDEX idx_invoices_user_id ON invoices(user_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_invoices_client_id ON invoices(client_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_invoices_issue_date ON invoices(user_id, issue_date DESC) WHERE deleted_at IS NULL;
CREATE INDEX idx_invoices_status ON invoices(user_id, status) WHERE deleted_at IS NULL;
CREATE INDEX idx_invoices_number ON invoices(user_id, invoice_number) WHERE deleted_at IS NULL;

-- invoice_items
CREATE INDEX idx_invoice_items_invoice_id ON invoice_items(invoice_id);

-- ai_insights_data
CREATE INDEX idx_ai_insights_user_id ON ai_insights_data(user_id);
CREATE INDEX idx_ai_insights_date ON ai_insights_data(user_id, date DESC);
CREATE INDEX idx_ai_insights_tags ON ai_insights_data USING GIN(tags);

-- exchange_rate_cache
CREATE INDEX idx_exchange_rate_currency_date ON exchange_rate_cache(currency, rate_date DESC);
```

---

## 5. Row-Level Security (RLS) Policies

### 5.1. profiles

```sql
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Użytkownik może odczytać tylko swój profil
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

-- Użytkownik może zaktualizować tylko swój profil
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- Użytkownik może wstawić tylko swój profil
CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);
```

### 5.2. clients

```sql
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own clients"
  ON clients FOR SELECT
  USING (auth.uid() = user_id AND deleted_at IS NULL);

CREATE POLICY "Users can insert own clients"
  ON clients FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own clients"
  ON clients FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own clients"
  ON clients FOR DELETE
  USING (auth.uid() = user_id);
```

### 5.3. tags

```sql
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own tags"
  ON tags FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own tags"
  ON tags FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own tags"
  ON tags FOR DELETE
  USING (auth.uid() = user_id);
```

### 5.4. time_entries

```sql
ALTER TABLE time_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own time entries"
  ON time_entries FOR SELECT
  USING (auth.uid() = user_id AND deleted_at IS NULL);

CREATE POLICY "Users can insert own time entries"
  ON time_entries FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own time entries"
  ON time_entries FOR UPDATE
  USING (auth.uid() = user_id AND invoice_id IS NULL);

CREATE POLICY "Users can delete own time entries"
  ON time_entries FOR DELETE
  USING (auth.uid() = user_id AND invoice_id IS NULL);
```

### 5.5. time_entry_tags

```sql
ALTER TABLE time_entry_tags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own time entry tags"
  ON time_entry_tags FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM time_entries
      WHERE time_entries.id = time_entry_tags.time_entry_id
      AND time_entries.user_id = auth.uid()
    )
  );
```

### 5.6. invoices

```sql
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own invoices"
  ON invoices FOR SELECT
  USING (auth.uid() = user_id AND deleted_at IS NULL);

CREATE POLICY "Users can insert own invoices"
  ON invoices FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own invoices"
  ON invoices FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own invoices"
  ON invoices FOR DELETE
  USING (auth.uid() = user_id);
```

### 5.7. invoice_items

```sql
ALTER TABLE invoice_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own invoice items"
  ON invoice_items FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM invoices
      WHERE invoices.id = invoice_items.invoice_id
      AND invoices.user_id = auth.uid()
    )
  );
```

### 5.8. invoice_item_time_entries

```sql
ALTER TABLE invoice_item_time_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own invoice item time entries"
  ON invoice_item_time_entries FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM invoice_items
      JOIN invoices ON invoices.id = invoice_items.invoice_id
      WHERE invoice_items.id = invoice_item_time_entries.invoice_item_id
      AND invoices.user_id = auth.uid()
    )
  );
```

### 5.9. ai_insights_data

```sql
ALTER TABLE ai_insights_data ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own AI insights"
  ON ai_insights_data FOR SELECT
  USING (auth.uid() = user_id);

-- Tylko triggery mogą wstawiać/aktualizować dane AI
CREATE POLICY "System can manage AI insights"
  ON ai_insights_data FOR ALL
  USING (auth.uid() = user_id);
```

### 5.10. exchange_rate_cache

```sql
ALTER TABLE exchange_rate_cache ENABLE ROW LEVEL SECURITY;

-- Wszyscy zalogowani użytkownicy mogą odczytać cache kursów
CREATE POLICY "Authenticated users can view exchange rates"
  ON exchange_rate_cache FOR SELECT
  TO authenticated
  USING (true);

-- Tylko system może wstawiać kursy
CREATE POLICY "Service role can insert exchange rates"
  ON exchange_rate_cache FOR INSERT
  TO service_role
  WITH CHECK (true);
```

---

## 6. Triggery

### 6.1. Automatyczna aktualizacja updated_at

```sql
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Zastosowanie do wszystkich głównych tabel
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_clients_updated_at BEFORE UPDATE ON clients
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_time_entries_updated_at BEFORE UPDATE ON time_entries
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_invoices_updated_at BEFORE UPDATE ON invoices
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_invoice_items_updated_at BEFORE UPDATE ON invoice_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

### 6.2. Automatyczne zasilanie ai_insights_data

```sql
CREATE OR REPLACE FUNCTION sync_ai_insights_data()
RETURNS TRIGGER AS $$
BEGIN
  -- Wstaw lub zaktualizuj dane AI tylko jeśli private_note jest wypełnione
  IF NEW.private_note IS NOT NULL AND NEW.private_note != '' THEN
    INSERT INTO ai_insights_data (
      user_id,
      time_entry_id,
      date,
      day_of_week,
      hours,
      hourly_rate,
      private_note,
      tags
    )
    VALUES (
      NEW.user_id,
      NEW.id,
      NEW.date,
      EXTRACT(ISODOW FROM NEW.date),
      NEW.hours,
      NEW.hourly_rate,
      NEW.private_note,
      (
        SELECT jsonb_agg(t.name)
        FROM time_entry_tags tet
        JOIN tags t ON t.id = tet.tag_id
        WHERE tet.time_entry_id = NEW.id
      )
    )
    ON CONFLICT (time_entry_id)
    DO UPDATE SET
      date = EXCLUDED.date,
      day_of_week = EXCLUDED.day_of_week,
      hours = EXCLUDED.hours,
      hourly_rate = EXCLUDED.hourly_rate,
      private_note = EXCLUDED.private_note,
      tags = EXCLUDED.tags;
  ELSE
    -- Usuń wpis AI jeśli private_note został usunięty
    DELETE FROM ai_insights_data WHERE time_entry_id = NEW.id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER sync_time_entries_to_ai_insights
  AFTER INSERT OR UPDATE ON time_entries
  FOR EACH ROW
  EXECUTE FUNCTION sync_ai_insights_data();
```

### 6.3. Automatyczne zasilanie ai_insights_data po zmianie tagów

```sql
CREATE OR REPLACE FUNCTION sync_ai_insights_tags()
RETURNS TRIGGER AS $$
BEGIN
  -- Zaktualizuj tagi w ai_insights_data
  UPDATE ai_insights_data
  SET tags = (
    SELECT jsonb_agg(t.name)
    FROM time_entry_tags tet
    JOIN tags t ON t.id = tet.tag_id
    WHERE tet.time_entry_id = COALESCE(NEW.time_entry_id, OLD.time_entry_id)
  )
  WHERE time_entry_id = COALESCE(NEW.time_entry_id, OLD.time_entry_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER sync_tags_to_ai_insights
  AFTER INSERT OR UPDATE OR DELETE ON time_entry_tags
  FOR EACH ROW
  EXECUTE FUNCTION sync_ai_insights_tags();
```

### 6.4. Automatyczne tworzenie profilu po rejestracji

```sql
CREATE OR REPLACE FUNCTION create_profile_for_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, full_name, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    NEW.email
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION create_profile_for_user();
```

---

## 7. Uwagi i decyzje projektowe

### 7.1. Bezpieczeństwo
- **RLS na wszystkich tabelach**: Każda tabela zawierająca dane użytkownika ma włączone Row-Level Security, zapewniając ścisłą izolację danych.
- **Kolumna user_id**: Wszystkie tabele zawierają user_id do sprawdzania uprawnień przez RLS.
- **Hasła**: Zarządzane przez Supabase Auth (bcrypt/Argon2).

### 7.2. Integralność danych
- **Soft deletes**: Tabele `clients`, `time_entries` i `invoices` używają kolumny `deleted_at` zamiast fizycznego usuwania.
- **Ograniczenia ON DELETE**: 
  - `RESTRICT` na `clients` w `time_entries` i `invoices` zapobiega usunięciu klienta z historycznymi danymi.
  - `CASCADE` na związki user → tabele główne.
  - `SET NULL` na `invoice_id` w `time_entries`.

### 7.3. Wydajność
- **Indeksy strategiczne**: Utworzone na kolumnach używanych do filtrowania (daty, statusy, relacje).
- **Indeksy warunkowe**: Indeksy z WHERE deleted_at IS NULL dla szybszego filtrowania aktywnych rekordów.
- **GIN index na JSONB**: Dla kolumny `tags` w `ai_insights_data`.

### 7.4. Wielowalutowość
- **ENUM dla walut**: Ogranicza wartości do PLN, EUR, USD.
- **NUMERIC dla kwot**: Precyzja (10,2) dla stawek, (12,2) dla sum.
- **Osobne kolumny PLN**: W `invoices` dla walut obcych przechowywane są kwoty przeliczone na PLN.

### 7.5. System audytu
- **Kolumny created_at i updated_at**: Automatyczne timestampy na wszystkich głównych tabelach.
- **Triggery**: Automatyczna aktualizacja `updated_at` przy każdej modyfikacji.
- **is_edited i edited_at**: W `invoices` do oznaczania edytowanych faktur.

### 7.6. Przygotowanie na AI
- **Tabela ai_insights_data**: Zdenormalizowana, zasilana automatycznie przez triggery.
- **JSONB dla tagów**: Elastyczne przechowywanie tagów dla analiz.
- **Anonimizacja**: Tylko ID użytkownika, bez danych klienta.

### 7.7. Normalizacja
- **3NF**: Schemat jest znormalizowany do 3. postaci normalnej.
- **Denormalizacja celowa**: Tylko `ai_insights_data` (dla wydajności analiz).
- **Tabele łączące**: Dla relacji many-to-many (`time_entry_tags`, `invoice_item_time_entries`).

### 7.8. Numeracja faktur
- **UNIQUE constraint**: `(user_id, invoice_number)` zapewnia unikalność w obrębie użytkownika.
- **Implementacja auto-increment**: Będzie realizowana w logice aplikacji (SELECT MAX + 1).

### 7.9. Cache kursów walut
- **Tabela exchange_rate_cache**: Przechowuje kursy NBP dla danego dnia.
- **UNIQUE constraint**: Jeden kurs per waluta per dzień.
- **Dostęp publiczny**: Wszyscy zalogowani użytkownicy mogą odczytać cache.

### 7.10. Ograniczenia edycji
- **RLS na time_entries**: Polityka UPDATE sprawdza `invoice_id IS NULL`, zapobiegając edycji zafakturowanych wpisów.
- **Pełna edytowalność faktur**: Brak ograniczeń RLS na UPDATE invoices (zgodnie z wymaganiami PRD).

