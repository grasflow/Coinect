-- migration: create indexes
-- description: tworzy indeksy strategiczne dla optymalizacji wydajności zapytań
-- affected: wszystkie główne tabele
-- special considerations: indeksy warunkowe z WHERE dla soft delete i innych filtrów

-- indeksy dla tabeli profiles
-- indeks na id użytkownika (klucz główny, automatyczny)
create index idx_profiles_user_id on profiles(id);

-- indeksy dla tabeli clients
-- indeks na user_id dla szybkiego filtrowania klientów użytkownika (tylko nieusunięci)
create index idx_clients_user_id on clients(user_id) where deleted_at is null;

-- indeks na nazwę klienta w obrębie użytkownika (tylko nieusunięci)
create index idx_clients_name on clients(user_id, name) where deleted_at is null;

-- indeksy dla tabeli tags
-- indeks na user_id dla szybkiego filtrowania tagów użytkownika
create index idx_tags_user_id on tags(user_id);

-- indeksy dla tabeli time_entries
-- indeks na user_id dla szybkiego filtrowania wpisów czasu użytkownika (tylko nieusunięte)
create index idx_time_entries_user_id on time_entries(user_id) where deleted_at is null;

-- indeks na client_id dla szybkiego filtrowania wpisów czasu klienta (tylko nieusunięte)
create index idx_time_entries_client_id on time_entries(client_id) where deleted_at is null;

-- indeks na datę dla sortowania wpisów czasu (DESC - od najnowszych) (tylko nieusunięte)
create index idx_time_entries_date on time_entries(user_id, date desc) where deleted_at is null;

-- indeks na invoice_id dla szybkiego filtrowania wpisów czasu przypisanych do faktury (tylko nieusunięte)
create index idx_time_entries_invoice_id on time_entries(invoice_id) where deleted_at is null;

-- indeks na niezafakturowane wpisy czasu (invoice_id is null) dla szybkiego filtrowania (tylko nieusunięte)
create index idx_time_entries_unbilled on time_entries(user_id, client_id) where invoice_id is null and deleted_at is null;

-- indeks na wpisy czasu z wypełnioną notatką prywatną (dla AI) (tylko nieusunięte)
create index idx_time_entries_private_note on time_entries(user_id) where private_note is not null and deleted_at is null;

-- indeksy dla tabeli invoices
-- indeks na user_id dla szybkiego filtrowania faktur użytkownika (tylko nieusunięte)
create index idx_invoices_user_id on invoices(user_id) where deleted_at is null;

-- indeks na client_id dla szybkiego filtrowania faktur klienta (tylko nieusunięte)
create index idx_invoices_client_id on invoices(client_id) where deleted_at is null;

-- indeks na datę wystawienia dla sortowania faktur (DESC - od najnowszych) (tylko nieusunięte)
create index idx_invoices_issue_date on invoices(user_id, issue_date desc) where deleted_at is null;

-- indeks na status faktury dla szybkiego filtrowania (tylko nieusunięte)
create index idx_invoices_status on invoices(user_id, status) where deleted_at is null;

-- indeks na numer faktury dla szybkiego wyszukiwania (tylko nieusunięte)
create index idx_invoices_number on invoices(user_id, invoice_number) where deleted_at is null;

-- indeksy dla tabeli invoice_items
-- indeks na invoice_id dla szybkiego filtrowania pozycji faktury
create index idx_invoice_items_invoice_id on invoice_items(invoice_id);

-- indeksy dla tabeli ai_insights_data
-- indeks na user_id dla szybkiego filtrowania danych AI użytkownika
create index idx_ai_insights_user_id on ai_insights_data(user_id);

-- indeks na datę dla sortowania danych AI (DESC - od najnowszych)
create index idx_ai_insights_date on ai_insights_data(user_id, date desc);

-- indeks GIN na JSONB dla szybkiego wyszukiwania po tagach
create index idx_ai_insights_tags on ai_insights_data using gin(tags);

-- indeksy dla tabeli exchange_rate_cache
-- indeks na walutę i datę kursu dla szybkiego wyszukiwania (DESC - od najnowszych)
create index idx_exchange_rate_currency_date on exchange_rate_cache(currency, rate_date desc);

