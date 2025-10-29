-- migration: enable Row Level Security on all tables
-- description: włącza RLS i tworzy granularne polityki bezpieczeństwa dla wszystkich tabel
-- affected: profiles, clients, tags, time_entries, time_entry_tags, invoices, invoice_items, invoice_item_time_entries, ai_insights_data, exchange_rate_cache
-- special considerations: polityki są granularne (osobne dla select/insert/update/delete) i dla każdej roli (anon/authenticated)

-- ============================================================================
-- PROFILES TABLE
-- ============================================================================
-- rationale: użytkownicy mogą zarządzać tylko swoim własnym profilem
-- security: user_id musi być równe auth.uid()

alter table profiles enable row level security;

-- policy: authenticated users can view their own profile
create policy "profiles_select_authenticated" on profiles
  for select
  to authenticated
  using (id = auth.uid());

-- policy: anonymous users cannot view profiles
create policy "profiles_select_anon" on profiles
  for select
  to anon
  using (false);

-- policy: authenticated users can insert their own profile (during registration)
create policy "profiles_insert_authenticated" on profiles
  for insert
  to authenticated
  with check (id = auth.uid());

-- policy: anonymous users cannot insert profiles
create policy "profiles_insert_anon" on profiles
  for insert
  to anon
  with check (false);

-- policy: authenticated users can update their own profile
create policy "profiles_update_authenticated" on profiles
  for update
  to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

-- policy: anonymous users cannot update profiles
create policy "profiles_update_anon" on profiles
  for update
  to anon
  using (false);

-- policy: authenticated users cannot delete profiles
create policy "profiles_delete_authenticated" on profiles
  for delete
  to authenticated
  using (false);

-- policy: anonymous users cannot delete profiles
create policy "profiles_delete_anon" on profiles
  for delete
  to anon
  using (false);

-- ============================================================================
-- CLIENTS TABLE
-- ============================================================================
-- rationale: użytkownicy mogą zarządzać tylko swoimi klientami
-- security: user_id musi być równe auth.uid()

alter table clients enable row level security;

-- policy: authenticated users can view their own clients (excluding soft deleted)
create policy "clients_select_authenticated" on clients
  for select
  to authenticated
  using (user_id = auth.uid() AND deleted_at IS NULL);

-- policy: anonymous users cannot view clients
create policy "clients_select_anon" on clients
  for select
  to anon
  using (false);

-- policy: authenticated users can insert their own clients
create policy "clients_insert_authenticated" on clients
  for insert
  to authenticated
  with check (user_id = auth.uid());

-- policy: anonymous users cannot insert clients
create policy "clients_insert_anon" on clients
  for insert
  to anon
  with check (false);

-- policy: authenticated users can update their own clients
create policy "clients_update_authenticated" on clients
  for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- policy: anonymous users cannot update clients
create policy "clients_update_anon" on clients
  for update
  to anon
  using (false);

-- policy: authenticated users can delete their own clients (soft delete via deleted_at)
create policy "clients_delete_authenticated" on clients
  for delete
  to authenticated
  using (user_id = auth.uid());

-- policy: anonymous users cannot delete clients
create policy "clients_delete_anon" on clients
  for delete
  to anon
  using (false);

-- ============================================================================
-- TAGS TABLE
-- ============================================================================
-- rationale: użytkownicy mogą zarządzać tylko swoimi tagami
-- security: user_id musi być równe auth.uid()

alter table tags enable row level security;

-- policy: authenticated users can view their own tags
create policy "tags_select_authenticated" on tags
  for select
  to authenticated
  using (user_id = auth.uid());

-- policy: anonymous users cannot view tags
create policy "tags_select_anon" on tags
  for select
  to anon
  using (false);

-- policy: authenticated users can insert their own tags
create policy "tags_insert_authenticated" on tags
  for insert
  to authenticated
  with check (user_id = auth.uid());

-- policy: anonymous users cannot insert tags
create policy "tags_insert_anon" on tags
  for insert
  to anon
  with check (false);

-- policy: authenticated users can update their own tags
create policy "tags_update_authenticated" on tags
  for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- policy: anonymous users cannot update tags
create policy "tags_update_anon" on tags
  for update
  to anon
  using (false);

-- policy: authenticated users can delete their own tags
create policy "tags_delete_authenticated" on tags
  for delete
  to authenticated
  using (user_id = auth.uid());

-- policy: anonymous users cannot delete tags
create policy "tags_delete_anon" on tags
  for delete
  to anon
  using (false);

-- ============================================================================
-- TIME_ENTRIES TABLE
-- ============================================================================
-- rationale: użytkownicy mogą zarządzać tylko swoimi wpisami czasu
-- security: user_id musi być równe auth.uid()

alter table time_entries enable row level security;

-- policy: authenticated users can view their own time entries
create policy "time_entries_select_authenticated" on time_entries
  for select
  to authenticated
  using (user_id = auth.uid());

-- policy: anonymous users cannot view time entries
create policy "time_entries_select_anon" on time_entries
  for select
  to anon
  using (false);

-- policy: authenticated users can insert their own time entries
create policy "time_entries_insert_authenticated" on time_entries
  for insert
  to authenticated
  with check (user_id = auth.uid());

-- policy: anonymous users cannot insert time entries
create policy "time_entries_insert_anon" on time_entries
  for insert
  to anon
  with check (false);

-- policy: authenticated users can update their own time entries
create policy "time_entries_update_authenticated" on time_entries
  for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- policy: anonymous users cannot update time entries
create policy "time_entries_update_anon" on time_entries
  for update
  to anon
  using (false);

-- policy: authenticated users can delete their own time entries (soft delete via deleted_at)
create policy "time_entries_delete_authenticated" on time_entries
  for delete
  to authenticated
  using (user_id = auth.uid());

-- policy: anonymous users cannot delete time entries
create policy "time_entries_delete_anon" on time_entries
  for delete
  to anon
  using (false);

-- ============================================================================
-- TIME_ENTRY_TAGS TABLE
-- ============================================================================
-- rationale: użytkownicy mogą zarządzać tagami tylko dla swoich wpisów czasu
-- security: sprawdzamy user_id poprzez relację z time_entries

alter table time_entry_tags enable row level security;

-- policy: authenticated users can view tags for their own time entries
create policy "time_entry_tags_select_authenticated" on time_entry_tags
  for select
  to authenticated
  using (
    exists (
      select 1 from time_entries
      where time_entries.id = time_entry_tags.time_entry_id
      and time_entries.user_id = auth.uid()
    )
  );

-- policy: anonymous users cannot view time entry tags
create policy "time_entry_tags_select_anon" on time_entry_tags
  for select
  to anon
  using (false);

-- policy: authenticated users can insert tags for their own time entries
create policy "time_entry_tags_insert_authenticated" on time_entry_tags
  for insert
  to authenticated
  with check (
    exists (
      select 1 from time_entries
      where time_entries.id = time_entry_tags.time_entry_id
      and time_entries.user_id = auth.uid()
    )
  );

-- policy: anonymous users cannot insert time entry tags
create policy "time_entry_tags_insert_anon" on time_entry_tags
  for insert
  to anon
  with check (false);

-- policy: authenticated users can update tags for their own time entries
create policy "time_entry_tags_update_authenticated" on time_entry_tags
  for update
  to authenticated
  using (
    exists (
      select 1 from time_entries
      where time_entries.id = time_entry_tags.time_entry_id
      and time_entries.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from time_entries
      where time_entries.id = time_entry_tags.time_entry_id
      and time_entries.user_id = auth.uid()
    )
  );

-- policy: anonymous users cannot update time entry tags
create policy "time_entry_tags_update_anon" on time_entry_tags
  for update
  to anon
  using (false);

-- policy: authenticated users can delete tags for their own time entries
create policy "time_entry_tags_delete_authenticated" on time_entry_tags
  for delete
  to authenticated
  using (
    exists (
      select 1 from time_entries
      where time_entries.id = time_entry_tags.time_entry_id
      and time_entries.user_id = auth.uid()
    )
  );

-- policy: anonymous users cannot delete time entry tags
create policy "time_entry_tags_delete_anon" on time_entry_tags
  for delete
  to anon
  using (false);

-- ============================================================================
-- INVOICES TABLE
-- ============================================================================
-- rationale: użytkownicy mogą zarządzać tylko swoimi fakturami
-- security: user_id musi być równe auth.uid()

alter table invoices enable row level security;

-- policy: authenticated users can view their own invoices
create policy "invoices_select_authenticated" on invoices
  for select
  to authenticated
  using (user_id = auth.uid());

-- policy: anonymous users cannot view invoices
create policy "invoices_select_anon" on invoices
  for select
  to anon
  using (false);

-- policy: authenticated users can insert their own invoices
create policy "invoices_insert_authenticated" on invoices
  for insert
  to authenticated
  with check (user_id = auth.uid());

-- policy: anonymous users cannot insert invoices
create policy "invoices_insert_anon" on invoices
  for insert
  to anon
  with check (false);

-- policy: authenticated users can update their own invoices
create policy "invoices_update_authenticated" on invoices
  for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- policy: anonymous users cannot update invoices
create policy "invoices_update_anon" on invoices
  for update
  to anon
  using (false);

-- policy: authenticated users can delete their own invoices (soft delete via deleted_at)
create policy "invoices_delete_authenticated" on invoices
  for delete
  to authenticated
  using (user_id = auth.uid());

-- policy: anonymous users cannot delete invoices
create policy "invoices_delete_anon" on invoices
  for delete
  to anon
  using (false);

-- ============================================================================
-- INVOICE_ITEMS TABLE
-- ============================================================================
-- rationale: użytkownicy mogą zarządzać pozycjami tylko dla swoich faktur
-- security: sprawdzamy user_id poprzez relację z invoices

alter table invoice_items enable row level security;

-- policy: authenticated users can view items for their own invoices
create policy "invoice_items_select_authenticated" on invoice_items
  for select
  to authenticated
  using (
    exists (
      select 1 from invoices
      where invoices.id = invoice_items.invoice_id
      and invoices.user_id = auth.uid()
    )
  );

-- policy: anonymous users cannot view invoice items
create policy "invoice_items_select_anon" on invoice_items
  for select
  to anon
  using (false);

-- policy: authenticated users can insert items for their own invoices
create policy "invoice_items_insert_authenticated" on invoice_items
  for insert
  to authenticated
  with check (
    exists (
      select 1 from invoices
      where invoices.id = invoice_items.invoice_id
      and invoices.user_id = auth.uid()
    )
  );

-- policy: anonymous users cannot insert invoice items
create policy "invoice_items_insert_anon" on invoice_items
  for insert
  to anon
  with check (false);

-- policy: authenticated users can update items for their own invoices
create policy "invoice_items_update_authenticated" on invoice_items
  for update
  to authenticated
  using (
    exists (
      select 1 from invoices
      where invoices.id = invoice_items.invoice_id
      and invoices.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from invoices
      where invoices.id = invoice_items.invoice_id
      and invoices.user_id = auth.uid()
    )
  );

-- policy: anonymous users cannot update invoice items
create policy "invoice_items_update_anon" on invoice_items
  for update
  to anon
  using (false);

-- policy: authenticated users can delete items for their own invoices
create policy "invoice_items_delete_authenticated" on invoice_items
  for delete
  to authenticated
  using (
    exists (
      select 1 from invoices
      where invoices.id = invoice_items.invoice_id
      and invoices.user_id = auth.uid()
    )
  );

-- policy: anonymous users cannot delete invoice items
create policy "invoice_items_delete_anon" on invoice_items
  for delete
  to anon
  using (false);

-- ============================================================================
-- INVOICE_ITEM_TIME_ENTRIES TABLE
-- ============================================================================
-- rationale: użytkownicy mogą zarządzać powiązaniami tylko dla swoich faktur i wpisów czasu
-- security: sprawdzamy user_id poprzez relacje z invoice_items->invoices i time_entries

alter table invoice_item_time_entries enable row level security;

-- policy: authenticated users can view links for their own invoice items and time entries
create policy "invoice_item_time_entries_select_authenticated" on invoice_item_time_entries
  for select
  to authenticated
  using (
    exists (
      select 1 from invoice_items
      join invoices on invoices.id = invoice_items.invoice_id
      where invoice_items.id = invoice_item_time_entries.invoice_item_id
      and invoices.user_id = auth.uid()
    )
    and exists (
      select 1 from time_entries
      where time_entries.id = invoice_item_time_entries.time_entry_id
      and time_entries.user_id = auth.uid()
    )
  );

-- policy: anonymous users cannot view invoice item time entries
create policy "invoice_item_time_entries_select_anon" on invoice_item_time_entries
  for select
  to anon
  using (false);

-- policy: authenticated users can insert links for their own invoice items and time entries
create policy "invoice_item_time_entries_insert_authenticated" on invoice_item_time_entries
  for insert
  to authenticated
  with check (
    exists (
      select 1 from invoice_items
      join invoices on invoices.id = invoice_items.invoice_id
      where invoice_items.id = invoice_item_time_entries.invoice_item_id
      and invoices.user_id = auth.uid()
    )
    and exists (
      select 1 from time_entries
      where time_entries.id = invoice_item_time_entries.time_entry_id
      and time_entries.user_id = auth.uid()
    )
  );

-- policy: anonymous users cannot insert invoice item time entries
create policy "invoice_item_time_entries_insert_anon" on invoice_item_time_entries
  for insert
  to anon
  with check (false);

-- policy: authenticated users can update links for their own invoice items and time entries
create policy "invoice_item_time_entries_update_authenticated" on invoice_item_time_entries
  for update
  to authenticated
  using (
    exists (
      select 1 from invoice_items
      join invoices on invoices.id = invoice_items.invoice_id
      where invoice_items.id = invoice_item_time_entries.invoice_item_id
      and invoices.user_id = auth.uid()
    )
    and exists (
      select 1 from time_entries
      where time_entries.id = invoice_item_time_entries.time_entry_id
      and time_entries.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from invoice_items
      join invoices on invoices.id = invoice_items.invoice_id
      where invoice_items.id = invoice_item_time_entries.invoice_item_id
      and invoices.user_id = auth.uid()
    )
    and exists (
      select 1 from time_entries
      where time_entries.id = invoice_item_time_entries.time_entry_id
      and time_entries.user_id = auth.uid()
    )
  );

-- policy: anonymous users cannot update invoice item time entries
create policy "invoice_item_time_entries_update_anon" on invoice_item_time_entries
  for update
  to anon
  using (false);

-- policy: authenticated users can delete links for their own invoice items and time entries
create policy "invoice_item_time_entries_delete_authenticated" on invoice_item_time_entries
  for delete
  to authenticated
  using (
    exists (
      select 1 from invoice_items
      join invoices on invoices.id = invoice_items.invoice_id
      where invoice_items.id = invoice_item_time_entries.invoice_item_id
      and invoices.user_id = auth.uid()
    )
    and exists (
      select 1 from time_entries
      where time_entries.id = invoice_item_time_entries.time_entry_id
      and time_entries.user_id = auth.uid()
    )
  );

-- policy: anonymous users cannot delete invoice item time entries
create policy "invoice_item_time_entries_delete_anon" on invoice_item_time_entries
  for delete
  to anon
  using (false);

-- ============================================================================
-- AI_INSIGHTS_DATA TABLE
-- ============================================================================
-- rationale: użytkownicy mogą wyświetlać tylko swoje dane AI insights
-- security: user_id musi być równe auth.uid(), tylko system może modyfikować dane (przez triggery)

alter table ai_insights_data enable row level security;

-- policy: authenticated users can view their own AI insights
create policy "ai_insights_data_select_authenticated" on ai_insights_data
  for select
  to authenticated
  using (user_id = auth.uid());

-- policy: anonymous users cannot view AI insights
create policy "ai_insights_data_select_anon" on ai_insights_data
  for select
  to anon
  using (false);

-- policy: authenticated users cannot manually insert AI insights (handled by triggers)
create policy "ai_insights_data_insert_authenticated" on ai_insights_data
  for insert
  to authenticated
  with check (false);

-- policy: anonymous users cannot insert AI insights
create policy "ai_insights_data_insert_anon" on ai_insights_data
  for insert
  to anon
  with check (false);

-- policy: authenticated users cannot manually update AI insights (handled by triggers)
create policy "ai_insights_data_update_authenticated" on ai_insights_data
  for update
  to authenticated
  using (false);

-- policy: anonymous users cannot update AI insights
create policy "ai_insights_data_update_anon" on ai_insights_data
  for update
  to anon
  using (false);

-- policy: authenticated users cannot manually delete AI insights (handled by triggers)
create policy "ai_insights_data_delete_authenticated" on ai_insights_data
  for delete
  to authenticated
  using (false);

-- policy: anonymous users cannot delete AI insights
create policy "ai_insights_data_delete_anon" on ai_insights_data
  for delete
  to anon
  using (false);

-- ============================================================================
-- EXCHANGE_RATE_CACHE TABLE
-- ============================================================================
-- rationale: wszyscy zalogowani użytkownicy mogą odczytać kursy walut (publiczne dane)
-- security: tylko system (service_role) może dodawać/aktualizować kursy

alter table exchange_rate_cache enable row level security;

-- policy: authenticated users can view all exchange rates (public data)
create policy "exchange_rate_cache_select_authenticated" on exchange_rate_cache
  for select
  to authenticated
  using (true);

-- policy: anonymous users can view all exchange rates (public data)
create policy "exchange_rate_cache_select_anon" on exchange_rate_cache
  for select
  to anon
  using (true);

-- policy: authenticated users cannot insert exchange rates (system-managed)
create policy "exchange_rate_cache_insert_authenticated" on exchange_rate_cache
  for insert
  to authenticated
  with check (false);

-- policy: anonymous users cannot insert exchange rates
create policy "exchange_rate_cache_insert_anon" on exchange_rate_cache
  for insert
  to anon
  with check (false);

-- policy: authenticated users cannot update exchange rates (system-managed)
create policy "exchange_rate_cache_update_authenticated" on exchange_rate_cache
  for update
  to authenticated
  using (false);

-- policy: anonymous users cannot update exchange rates
create policy "exchange_rate_cache_update_anon" on exchange_rate_cache
  for update
  to anon
  using (false);

-- policy: authenticated users cannot delete exchange rates (system-managed)
create policy "exchange_rate_cache_delete_authenticated" on exchange_rate_cache
  for delete
  to authenticated
  using (false);

-- policy: anonymous users cannot delete exchange rates
create policy "exchange_rate_cache_delete_anon" on exchange_rate_cache
  for delete
  to anon
  using (false);

