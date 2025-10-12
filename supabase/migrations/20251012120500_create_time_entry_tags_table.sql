-- migration: create time_entry_tags table
-- description: tworzy tabelę time_entry_tags dla relacji wiele-do-wielu między wpisami czasu a tagami
-- affected: nowa tabela time_entry_tags
-- special considerations: tabela łącząca, primary key złożony

-- tworzenie tabeli time_entry_tags
-- tabela łącząca wpisy czasu z tagami (relacja wiele-do-wielu)
create table time_entry_tags (
  -- identyfikator wpisu czasu
  time_entry_id uuid not null references time_entries(id) on delete cascade,
  
  -- identyfikator tagu
  tag_id uuid not null references tags(id) on delete cascade,
  
  -- timestamp
  created_at timestamptz default now(),
  
  -- klucz główny złożony (para time_entry_id, tag_id)
  primary key (time_entry_id, tag_id)
);

-- włączenie row level security
-- użytkownik może zarządzać tagami tylko swoich wpisów czasu
alter table time_entry_tags enable row level security;

-- polityka all: użytkownik może zarządzać tagami tylko swoich wpisów czasu
-- sprawdzamy czy wpis czasu należy do użytkownika
create policy "Users can manage own time entry tags"
  on time_entry_tags for all
  to authenticated
  using (
    exists (
      select 1 from time_entries
      where time_entries.id = time_entry_tags.time_entry_id
      and time_entries.user_id = auth.uid()
    )
  );

