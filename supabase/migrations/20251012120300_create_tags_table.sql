-- migration: create tags table
-- description: tworzy tabelę tags dla przechowywania tagów używanych w prywatnych notatkach wpisów czasu
-- affected: nowa tabela tags
-- special considerations: unique constraint na (user_id, name)

-- tworzenie tabeli tags
-- przechowuje tagi używane w prywatnych notatkach wpisów czasu
create table tags (
  -- identyfikator tagu
  id uuid primary key default gen_random_uuid(),
  
  -- właściciel tagu
  user_id uuid not null references profiles(id) on delete cascade,
  
  -- nazwa tagu
  name varchar(100) not null,
  
  -- timestamp
  created_at timestamptz default now(),
  
  -- unikalność nazwy tagu w obrębie użytkownika
  constraint unique_tag_name unique (user_id, name)
);

-- włączenie row level security
-- każdy użytkownik może zarządzać tylko swoimi tagami
alter table tags enable row level security;

-- polityka select: użytkownik może odczytać tylko swoje tagi
create policy "Users can view own tags"
  on tags for select
  to authenticated
  using (auth.uid() = user_id);

-- polityka insert: użytkownik może wstawić tylko swoje tagi
create policy "Users can insert own tags"
  on tags for insert
  to authenticated
  with check (auth.uid() = user_id);

-- polityka delete: użytkownik może usunąć tylko swoje tagi
create policy "Users can delete own tags"
  on tags for delete
  to authenticated
  using (auth.uid() = user_id);

