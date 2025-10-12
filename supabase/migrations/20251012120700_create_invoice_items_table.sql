-- migration: create invoice_items table
-- description: tworzy tabelę invoice_items dla przechowywania pozycji (linii) na fakturze
-- affected: nowa tabela invoice_items
-- special considerations: unique constraint na (invoice_id, position)

-- tworzenie tabeli invoice_items
-- przechowuje pozycje (linie) na fakturze
create table invoice_items (
  -- identyfikator pozycji
  id uuid primary key default gen_random_uuid(),
  
  -- faktura, do której należy pozycja
  invoice_id uuid not null references invoices(id) on delete cascade,
  
  -- numer pozycji na fakturze (LP)
  position integer not null,
  
  -- opis usługi
  description text not null,
  
  -- liczba godzin
  quantity numeric(10,2) not null check (quantity > 0),
  
  -- stawka godzinowa
  unit_price numeric(10,2) not null check (unit_price >= 0),
  
  -- wartość netto (quantity × unit_price)
  net_amount numeric(12,2) not null,
  
  -- timestampy
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  
  -- unikalność pozycji w obrębie faktury
  constraint unique_invoice_item_position unique (invoice_id, position)
);

-- włączenie row level security
-- użytkownik może zarządzać pozycjami tylko swoich faktur
alter table invoice_items enable row level security;

-- polityka all: użytkownik może zarządzać pozycjami tylko swoich faktur
-- sprawdzamy czy faktura należy do użytkownika
create policy "Users can manage own invoice items"
  on invoice_items for all
  to authenticated
  using (
    exists (
      select 1 from invoices
      where invoices.id = invoice_items.invoice_id
      and invoices.user_id = auth.uid()
    )
  );

