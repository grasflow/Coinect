-- migration: create clients table
-- description: tworzy tabelę clients dla przechowywania danych klientów użytkownika
-- affected: nowa tabela clients
-- special considerations: soft delete (deleted_at), unique constraint na (user_id, name)

-- tworzenie tabeli clients
-- przechowuje dane klientów użytkownika
create table clients (
  -- identyfikator klienta
  id uuid primary key default gen_random_uuid(),
  
  -- właściciel klienta
  user_id uuid not null references profiles(id) on delete cascade,
  
  -- dane podstawowe
  name varchar(255) not null,
  tax_id varchar(20),
  
  -- adres
  street varchar(255),
  city varchar(100),
  postal_code varchar(20),
  country varchar(100) default 'Polska',
  
  -- kontakt
  email varchar(255),
  phone varchar(50),
  
  -- domyślne ustawienia rozliczeń
  default_currency currency_enum default 'PLN',
  default_hourly_rate numeric(10,2),
  
  -- soft delete
  deleted_at timestamptz,
  
  -- timestampy
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- unikalny indeks na nazwę klienta w obrębie użytkownika (tylko dla nieusuniętych)
create unique index unique_client_name on clients(user_id, name) where deleted_at is null;

-- włączenie row level security
-- każdy użytkownik może zarządzać tylko swoimi klientami
alter table clients enable row level security;

-- polityka select: użytkownik może odczytać tylko swoich klientów (nieusuniętych)
create policy "Users can view own clients"
  on clients for select
  to authenticated
  using (auth.uid() = user_id and deleted_at is null);

-- polityka insert: użytkownik może wstawić tylko swoich klientów
create policy "Users can insert own clients"
  on clients for insert
  to authenticated
  with check (auth.uid() = user_id);

-- polityka update: użytkownik może zaktualizować tylko swoich klientów
create policy "Users can update own clients"
  on clients for update
  to authenticated
  using (auth.uid() = user_id);

-- polityka delete: użytkownik może usunąć tylko swoich klientów
-- uwaga: w aplikacji należy używać soft delete (ustawienie deleted_at)
create policy "Users can delete own clients"
  on clients for delete
  to authenticated
  using (auth.uid() = user_id);

