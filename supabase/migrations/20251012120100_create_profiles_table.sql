-- migration: create profiles table
-- description: tworzy tabelę profiles dla przechowywania danych profilowych użytkowników
-- affected: nowa tabela profiles, trigger dla auth.users
-- special considerations: id referencyjny do auth.users(id), automatyczne tworzenie profilu po rejestracji

-- tworzenie tabeli profiles
-- przechowuje dane profilowe użytkowników (wystawców faktur)
create table profiles (
  -- identyfikator profilu (równy auth.users.id)
  id uuid primary key references auth.users(id) on delete cascade,
  
  -- dane podstawowe
  full_name varchar(255) not null,
  tax_id varchar(20),
  
  -- adres
  street varchar(255),
  city varchar(100),
  postal_code varchar(20),
  country varchar(100) default 'Polska',
  
  -- kontakt
  email varchar(255),
  phone varchar(50),
  
  -- dane finansowe
  bank_account varchar(50),
  
  -- personalizacja
  logo_url text,
  accent_color varchar(7) default '#2563EB',
  
  -- onboarding
  onboarding_completed boolean default false,
  onboarding_step integer default 0,
  
  -- timestampy
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- włączenie row level security
-- każdy użytkownik może zobaczyć tylko swój profil
alter table profiles enable row level security;

-- polityka select: użytkownik może odczytać tylko swój profil
create policy "Users can view own profile"
  on profiles for select
  to authenticated
  using (auth.uid() = id);

-- polityka insert: użytkownik może wstawić tylko swój profil
create policy "Users can insert own profile"
  on profiles for insert
  to authenticated
  with check (auth.uid() = id);

-- polityka update: użytkownik może zaktualizować tylko swój profil
create policy "Users can update own profile"
  on profiles for update
  to authenticated
  using (auth.uid() = id);

-- trigger: automatyczne tworzenie profilu po rejestracji użytkownika
-- wykonywany po każdym insert w auth.users
create or replace function create_profile_for_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    new.email
  );
  return new;
end;
$$ language plpgsql security definer set search_path = public;

create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function create_profile_for_user();

