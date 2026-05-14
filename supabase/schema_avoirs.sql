-- ============================================================
-- Bati Prelvio — Avoirs (notes de crédit)
-- À exécuter dans l'éditeur SQL Supabase
-- ============================================================

CREATE TABLE IF NOT EXISTS avoirs (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  client_id   uuid REFERENCES clients(id) ON DELETE SET NULL,
  facture_id  uuid REFERENCES factures(id) ON DELETE SET NULL,
  numero      text NOT NULL,
  motif       text,
  total_ht    numeric(12,2) DEFAULT 0,
  total_tva   numeric(12,2) DEFAULT 0,
  total_ttc   numeric(12,2) DEFAULT 0,
  statut      text NOT NULL DEFAULT 'emis' CHECK (statut IN ('emis', 'rembourse')),
  created_at  timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS lignes_avoir (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  avoir_id    uuid REFERENCES avoirs(id) ON DELETE CASCADE NOT NULL,
  designation text NOT NULL,
  quantite    numeric(10,2) DEFAULT 1,
  pu_ht       numeric(12,2) NOT NULL,
  total_ht    numeric(12,2) NOT NULL,
  created_at  timestamptz DEFAULT now()
);

ALTER TABLE avoirs ENABLE ROW LEVEL SECURITY;
ALTER TABLE lignes_avoir ENABLE ROW LEVEL SECURITY;

CREATE POLICY "avoirs: select own" ON avoirs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "avoirs: insert own" ON avoirs FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "avoirs: update own" ON avoirs FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "avoirs: delete own" ON avoirs FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "lignes_avoir: select own" ON lignes_avoir FOR SELECT
  USING (EXISTS (SELECT 1 FROM avoirs a WHERE a.id = avoir_id AND a.user_id = auth.uid()));
CREATE POLICY "lignes_avoir: insert own" ON lignes_avoir FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM avoirs a WHERE a.id = avoir_id AND a.user_id = auth.uid()));
CREATE POLICY "lignes_avoir: delete own" ON lignes_avoir FOR DELETE
  USING (EXISTS (SELECT 1 FROM avoirs a WHERE a.id = avoir_id AND a.user_id = auth.uid()));

CREATE INDEX IF NOT EXISTS idx_avoirs_user     ON avoirs(user_id);
CREATE INDEX IF NOT EXISTS idx_avoirs_facture  ON avoirs(facture_id);
CREATE INDEX IF NOT EXISTS idx_lignes_avoir_id ON lignes_avoir(avoir_id);
ALTER TABLE avoirs ADD CONSTRAINT avoirs_user_numero_unique UNIQUE (user_id, numero);
