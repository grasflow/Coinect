-- migration: create exchange_rate_cache table
-- description: tworzy tabelę exchange_rate_cache dla przechowywania cache kursów walut z API NBP
-- affected: nowa tabela exchange_rate_cache
-- special considerations: unique constraint na (currency, rate_date), dostęp publiczny dla zalogowanych

-- tworzenie tabeli exchange_rate_cache
-- przechowuje cache kursów walut z API NBP
create table exchange_rate_cache (
  -- identyfikator wpisu
  id uuid primary key default gen_random_uuid(),
  
  -- waluta
  currency currency_enum not null,
  
  -- data kursu
  rate_date date not null,
  
  -- kurs waluty
  rate numeric(10,4) not null,
  
  -- timestamp pobrania
  created_at timestamptz default now(),
  
  -- unikalność kursu dla danej waluty i daty
  constraint unique_currency_rate_date unique (currency, rate_date)
);

-- włączenie row level security
-- wszyscy zalogowani użytkownicy mogą odczytać cache kursów
alter table exchange_rate_cache enable row level security;

-- polityka select: wszyscy zalogowani użytkownicy mogą odczytać cache kursów
-- kursy walut są danymi publicznymi
create policy "Authenticated users can view exchange rates"
  on exchange_rate_cache for select
  to authenticated
  using (true);

-- polityka insert: tylko service role może wstawiać kursy
-- używane przez scheduled functions lub background jobs
create policy "Service role can insert exchange rates"
  on exchange_rate_cache for insert
  to service_role
  with check (true);

