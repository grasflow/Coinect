-- migration: create invoice_item_time_entries table
-- description: tworzy tabelę invoice_item_time_entries dla relacji wiele-do-wielu między pozycjami faktur a wpisami czasu
-- affected: nowa tabela invoice_item_time_entries
-- special considerations: tabela łącząca, primary key złożony

-- tworzenie tabeli invoice_item_time_entries
-- tabela łącząca pozycje faktur z wpisami czasu (relacja wiele-do-wielu)
create table invoice_item_time_entries (
  -- identyfikator pozycji faktury
  invoice_item_id uuid not null references invoice_items(id) on delete cascade,
  
  -- identyfikator wpisu czasu
  time_entry_id uuid not null references time_entries(id) on delete restrict,
  
  -- timestamp
  created_at timestamptz default now(),
  
  -- klucz główny złożony (para invoice_item_id, time_entry_id)
  primary key (invoice_item_id, time_entry_id)
);

-- włączenie row level security
-- użytkownik może zarządzać powiązaniami tylko swoich pozycji faktur
alter table invoice_item_time_entries enable row level security;

-- polityka all: użytkownik może zarządzać powiązaniami tylko swoich pozycji faktur
-- sprawdzamy czy pozycja faktury należy do faktury użytkownika
create policy "Users can manage own invoice item time entries"
  on invoice_item_time_entries for all
  to authenticated
  using (
    exists (
      select 1 from invoice_items
      join invoices on invoices.id = invoice_items.invoice_id
      where invoice_items.id = invoice_item_time_entries.invoice_item_id
      and invoices.user_id = auth.uid()
    )
  );

