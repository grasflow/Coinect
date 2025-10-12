-- migration: disable all RLS policies
-- description: wyłącza wszystkie polityki Row Level Security z wszystkich tabel oraz wyłącza RLS
-- affected: profiles, clients, tags, time_entries, time_entry_tags, invoices, invoice_items, invoice_item_time_entries, ai_insights_data, exchange_rate_cache
-- special considerations: całkowite wyłączenie RLS - dostęp bez ograniczeń dla zalogowanych użytkowników

-- profiles
drop policy if exists "Users can view own profile" on profiles;
drop policy if exists "Users can insert own profile" on profiles;
drop policy if exists "Users can update own profile" on profiles;
alter table profiles disable row level security;

-- clients
drop policy if exists "Users can view own clients" on clients;
drop policy if exists "Users can insert own clients" on clients;
drop policy if exists "Users can update own clients" on clients;
drop policy if exists "Users can delete own clients" on clients;
alter table clients disable row level security;

-- tags
drop policy if exists "Users can view own tags" on tags;
drop policy if exists "Users can insert own tags" on tags;
drop policy if exists "Users can delete own tags" on tags;
alter table tags disable row level security;

-- time_entries
drop policy if exists "Users can view own time entries" on time_entries;
drop policy if exists "Users can insert own time entries" on time_entries;
drop policy if exists "Users can update own time entries" on time_entries;
drop policy if exists "Users can delete own time entries" on time_entries;
alter table time_entries disable row level security;

-- time_entry_tags
drop policy if exists "Users can manage own time entry tags" on time_entry_tags;
alter table time_entry_tags disable row level security;

-- invoices
drop policy if exists "Users can view own invoices" on invoices;
drop policy if exists "Users can insert own invoices" on invoices;
drop policy if exists "Users can update own invoices" on invoices;
drop policy if exists "Users can delete own invoices" on invoices;
alter table invoices disable row level security;

-- invoice_items
drop policy if exists "Users can manage own invoice items" on invoice_items;
alter table invoice_items disable row level security;

-- invoice_item_time_entries
drop policy if exists "Users can manage own invoice item time entries" on invoice_item_time_entries;
alter table invoice_item_time_entries disable row level security;

-- ai_insights_data
drop policy if exists "Users can view own AI insights" on ai_insights_data;
drop policy if exists "System can manage AI insights" on ai_insights_data;
alter table ai_insights_data disable row level security;

-- exchange_rate_cache
drop policy if exists "Authenticated users can view exchange rates" on exchange_rate_cache;
drop policy if exists "Service role can insert exchange rates" on exchange_rate_cache;
alter table exchange_rate_cache disable row level security;

