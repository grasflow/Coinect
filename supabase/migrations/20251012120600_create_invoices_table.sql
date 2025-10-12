-- migration: create invoices table
-- description: tworzy tabelę invoices dla przechowywania faktur wygenerowanych przez użytkownika
-- affected: nowa tabela invoices
-- special considerations: soft delete (deleted_at), unique constraint na (user_id, invoice_number), check constraint dla exchange_rate

-- tworzenie tabeli invoices
-- przechowuje faktury wygenerowane przez użytkownika
create table invoices (
  -- identyfikator faktury
  id uuid primary key default gen_random_uuid(),
  
  -- właściciel faktury
  user_id uuid not null references profiles(id) on delete cascade,
  
  -- klient, dla którego wystawiono fakturę
  client_id uuid not null references clients(id) on delete restrict,
  
  -- dane faktury
  invoice_number varchar(50) not null,
  issue_date date not null,
  sale_date date not null,
  
  -- waluta i kurs
  currency currency_enum not null,
  exchange_rate numeric(10,4),
  exchange_rate_date date,
  is_custom_exchange_rate boolean default false,
  
  -- kwoty w walucie faktury
  net_amount numeric(12,2) not null,
  vat_rate numeric(5,2) not null,
  vat_amount numeric(12,2) not null,
  gross_amount numeric(12,2) not null,
  
  -- kwoty w PLN (dla walut obcych)
  net_amount_pln numeric(12,2),
  vat_amount_pln numeric(12,2),
  gross_amount_pln numeric(12,2),
  
  -- kwota brutto słownie
  gross_amount_words text,
  
  -- status
  status invoice_status_enum default 'unpaid',
  is_paid boolean default false,
  
  -- flagi
  is_imported boolean default false,
  is_edited boolean default false,
  edited_at timestamptz,
  
  -- PDF
  pdf_url text,
  
  -- soft delete
  deleted_at timestamptz,
  
  -- timestampy
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  
  -- sprawdzenie: dla walut obcych wymagany jest kurs wymiany
  constraint check_exchange_rate check (
    (currency != 'PLN' and exchange_rate is not null) or (currency = 'PLN')
  )
);

-- unikalny indeks na numer faktury w obrębie użytkownika (tylko dla nieusuniętych)
create unique index unique_invoice_number on invoices(user_id, invoice_number) where deleted_at is null;

-- dodanie foreign key do time_entries.invoice_id (teraz gdy tabela invoices istnieje)
alter table time_entries
  add constraint fk_time_entries_invoice_id 
  foreign key (invoice_id) 
  references invoices(id) 
  on delete set null;

-- włączenie row level security
-- każdy użytkownik może zarządzać tylko swoimi fakturami
alter table invoices enable row level security;

-- polityka select: użytkownik może odczytać tylko swoje faktury (nieusunięte)
create policy "Users can view own invoices"
  on invoices for select
  to authenticated
  using (auth.uid() = user_id and deleted_at is null);

-- polityka insert: użytkownik może wstawić tylko swoje faktury
create policy "Users can insert own invoices"
  on invoices for insert
  to authenticated
  with check (auth.uid() = user_id);

-- polityka update: użytkownik może zaktualizować tylko swoje faktury
-- brak ograniczeń na edycję faktur (zgodnie z wymaganiami PRD)
create policy "Users can update own invoices"
  on invoices for update
  to authenticated
  using (auth.uid() = user_id);

-- polityka delete: użytkownik może usunąć tylko swoje faktury
-- uwaga: w aplikacji należy używać soft delete (ustawienie deleted_at)
create policy "Users can delete own invoices"
  on invoices for delete
  to authenticated
  using (auth.uid() = user_id);

