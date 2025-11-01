-- migration: drop tags tables
-- description: usuwa tabele tags i time_entry_tags wraz z politykami RLS
-- affected: DROP TABLE time_entry_tags, DROP TABLE tags
-- special considerations: tags feature has been removed from the application

-- usunięcie tabeli time_entry_tags (najpierw, bo ma foreign keys)
DROP TABLE IF EXISTS time_entry_tags CASCADE;

-- usunięcie tabeli tags
DROP TABLE IF EXISTS tags CASCADE;
