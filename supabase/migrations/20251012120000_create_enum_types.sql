-- migration: create enum types
-- description: tworzy typy enum dla walut i statusów faktur
-- affected: nowe typy enum
-- special considerations: muszą być utworzone przed tabelami, które ich używają

-- tworzenie typu enum dla walut
-- obsługiwane waluty: PLN (złoty polski), EUR (euro), USD (dolar amerykański)
create type currency_enum as enum ('PLN', 'EUR', 'USD');

-- tworzenie typu enum dla statusów faktur
-- status 'unpaid' - faktura nieopłacona (domyślny)
-- status 'paid' - faktura opłacona
create type invoice_status_enum as enum ('unpaid', 'paid');

