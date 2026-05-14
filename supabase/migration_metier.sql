-- Ajout du champ métier sur la table entreprise
-- À exécuter dans l'éditeur SQL de Supabase

ALTER TABLE entreprise
  ADD COLUMN IF NOT EXISTS metier TEXT
    CHECK (metier IN ('plombier', 'electricien', 'autre'))
    DEFAULT 'autre';
