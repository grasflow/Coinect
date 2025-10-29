-- migration: add due_date, payment_status, and notes to invoices
-- description: dodaje pola due_date, payment_status i notes do tabeli invoices
-- affected: tabela invoices

-- dodanie pól do tabeli invoices
alter table invoices
  add column due_date date,
  add column payment_status varchar(20) default 'unpaid',
  add column notes text;

-- komentarze
comment on column invoices.due_date is 'Termin płatności faktury';
comment on column invoices.payment_status is 'Status płatności (paid, unpaid, overdue)';
comment on column invoices.notes is 'Dodatkowe uwagi do faktury';

-- index dla szybszego wyszukiwania po terminie płatności
create index idx_invoices_due_date on invoices(due_date) where due_date is not null;

