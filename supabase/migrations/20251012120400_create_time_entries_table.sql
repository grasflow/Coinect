-- migration: create time_entries table
-- description: tworzy tabelę time_entries dla przechowywania wpisów czasu pracy użytkownika
-- affected: nowa tabela time_entries
-- special considerations: soft delete (deleted_at), ograniczenie edycji zafakturowanych wpisów w RLS

-- tworzenie tabeli time_entries
-- przechowuje wpisy czasu pracy użytkownika
create table time_entries (
  -- identyfikator wpisu
  id uuid primary key default gen_random_uuid(),
  
  -- właściciel wpisu
  user_id uuid not null references profiles(id) on delete cascade,
  
  -- klient, dla którego wykonano pracę
  client_id uuid not null references clients(id) on delete restrict,
  
  -- data i czas
  date date not null,
  hours numeric(5,2) not null check (hours > 0),
  
  -- rozliczenie
  hourly_rate numeric(10,2) not null check (hourly_rate >= 0),
  currency currency_enum not null,
  
  -- opisy
  public_description text,
  private_note text,
  
  -- faktura (jeśli wpis został zafakturowany)
  -- foreign key zostanie dodany później po utworzeniu tabeli invoices
  invoice_id uuid,
  
  -- soft delete
  deleted_at timestamptz,
  
  -- timestampy
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- włączenie row level security
-- każdy użytkownik może zarządzać tylko swoimi wpisami czasu
alter table time_entries enable row level security;

-- polityka select: użytkownik może odczytać tylko swoje wpisy czasu (nieusunięte)
create policy "Users can view own time entries"
  on time_entries for select
  to authenticated
  using (auth.uid() = user_id and deleted_at is null);

-- polityka insert: użytkownik może wstawić tylko swoje wpisy czasu
create policy "Users can insert own time entries"
  on time_entries for insert
  to authenticated
  with check (auth.uid() = user_id);

-- polityka update: użytkownik może zaktualizować tylko swoje niezafakturowane wpisy czasu
-- wpisy przypisane do faktury (invoice_id is not null) nie mogą być edytowane
create policy "Users can update own time entries"
  on time_entries for update
  to authenticated
  using (auth.uid() = user_id and invoice_id is null);

-- polityka delete: użytkownik może usunąć tylko swoje niezafakturowane wpisy czasu
-- uwaga: w aplikacji należy używać soft delete (ustawienie deleted_at)
-- wpisy przypisane do faktury (invoice_id is not null) nie mogą być usunięte
create policy "Users can delete own time entries"
  on time_entries for delete
  to authenticated
  using (auth.uid() = user_id and invoice_id is null);

