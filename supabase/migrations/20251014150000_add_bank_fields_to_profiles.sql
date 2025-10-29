-- migration: add bank_name and bank_swift to profiles
-- description: dodaje pola bank_name i bank_swift do tabeli profiles
-- affected: tabela profiles

-- dodanie pól do tabeli profiles
alter table profiles
  add column bank_name varchar(255),
  add column bank_swift varchar(11);

-- komentarze
comment on column profiles.bank_name is 'Nazwa banku (np. mBank SA)';
comment on column profiles.bank_swift is 'Kod SWIFT/BIC banku (np. BREXPLPWMBK)';

