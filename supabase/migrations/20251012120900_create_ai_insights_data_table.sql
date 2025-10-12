-- migration: create ai_insights_data table
-- description: tworzy tabelę ai_insights_data dla agregowania zanonimizowanych danych dla przyszłych analiz AI
-- affected: nowa tabela ai_insights_data
-- special considerations: unique constraint na time_entry_id, zasilana automatycznie przez triggery

-- tworzenie tabeli ai_insights_data
-- tabela agregująca zanonimizowane dane dla przyszłych analiz AI
create table ai_insights_data (
  -- identyfikator wpisu
  id uuid primary key default gen_random_uuid(),
  
  -- właściciel danych
  user_id uuid not null references profiles(id) on delete cascade,
  
  -- referencja do wpisu czasu
  time_entry_id uuid not null references time_entries(id) on delete cascade,
  
  -- data wpisu
  date date not null,
  
  -- dzień tygodnia (1-7, gdzie 1=poniedziałek)
  day_of_week integer not null,
  
  -- liczba godzin
  hours numeric(5,2) not null,
  
  -- stawka godzinowa
  hourly_rate numeric(10,2) not null,
  
  -- notatka prywatna (dla AI)
  private_note text,
  
  -- tagi jako tablica JSON
  tags jsonb,
  
  -- timestamp
  created_at timestamptz default now(),
  
  -- unikalność referencji do wpisu czasu
  constraint unique_time_entry_id unique (time_entry_id)
);

-- włączenie row level security
-- każdy użytkownik może odczytać tylko swoje dane AI
alter table ai_insights_data enable row level security;

-- polityka select: użytkownik może odczytać tylko swoje dane AI
create policy "Users can view own AI insights"
  on ai_insights_data for select
  to authenticated
  using (auth.uid() = user_id);

-- polityka all: użytkownik może zarządzać swoimi danymi AI
-- w praktyce dane są zarządzane przez triggery, ale polityka pozwala na to użytkownikowi
create policy "System can manage AI insights"
  on ai_insights_data for all
  to authenticated
  using (auth.uid() = user_id);

