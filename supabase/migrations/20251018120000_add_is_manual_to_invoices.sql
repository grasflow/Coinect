-- Dodanie kolumny is_manual do tabeli invoices
-- Kolumna wskazuje czy faktura została wygenerowana manualnie czy z wpisów czasowych

ALTER TABLE invoices
ADD COLUMN is_manual boolean NOT NULL DEFAULT false;

-- Dodanie komentarza do kolumny
COMMENT ON COLUMN invoices.is_manual IS 'Czy faktura została utworzona manualnie (true) czy z wpisów czasowych (false)';

-- Dodanie indeksu dla filtrowania faktur manualnych
CREATE INDEX idx_invoices_is_manual ON invoices(is_manual);

-- Aktualizacja istniejących polityk RLS jeśli potrzebne
-- (Aktualnie wszystkie faktury są tworzone przez użytkownika, więc RLS działa poprawnie)
