-- ============================================================
-- Bati Prelvio — Multi-utilisateurs / Équipe
-- À exécuter dans l'éditeur SQL Supabase (après schema_modules.sql)
-- ============================================================

-- ── Table equipe_membres ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS equipe_membres (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id     uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  member_email text NOT NULL,
  member_id    uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  role         text NOT NULL DEFAULT 'membre' CHECK (role IN ('admin', 'membre')),
  statut       text NOT NULL DEFAULT 'invite' CHECK (statut IN ('invite', 'actif')),
  invite_token uuid UNIQUE DEFAULT gen_random_uuid(),
  created_at   timestamptz DEFAULT now(),
  UNIQUE(owner_id, member_email)
);

ALTER TABLE equipe_membres ENABLE ROW LEVEL SECURITY;

CREATE POLICY "equipe: owner manage" ON equipe_membres FOR ALL USING (auth.uid() = owner_id);
CREATE POLICY "equipe: member view"  ON equipe_membres FOR SELECT USING (auth.uid() = member_id);

CREATE INDEX IF NOT EXISTS idx_equipe_owner  ON equipe_membres(owner_id);
CREATE INDEX IF NOT EXISTS idx_equipe_member ON equipe_membres(member_id);
CREATE INDEX IF NOT EXISTS idx_equipe_token  ON equipe_membres(invite_token);

-- ── Mise à jour RLS — accès partagé équipe ───────────────────
-- Les membres actifs d'une équipe voient/modifient les données du propriétaire

-- CLIENTS
DROP POLICY IF EXISTS "clients: select own" ON clients;
DROP POLICY IF EXISTS "clients: insert own" ON clients;
DROP POLICY IF EXISTS "clients: update own" ON clients;
DROP POLICY IF EXISTS "clients: delete own" ON clients;

CREATE POLICY "clients: select own" ON clients FOR SELECT USING (
  user_id = auth.uid()
  OR user_id IN (SELECT owner_id FROM equipe_membres WHERE member_id = auth.uid() AND statut = 'actif')
);
CREATE POLICY "clients: insert own" ON clients FOR INSERT WITH CHECK (
  user_id = auth.uid()
  OR user_id IN (SELECT owner_id FROM equipe_membres WHERE member_id = auth.uid() AND statut = 'actif')
);
CREATE POLICY "clients: update own" ON clients FOR UPDATE USING (
  user_id = auth.uid()
  OR user_id IN (SELECT owner_id FROM equipe_membres WHERE member_id = auth.uid() AND statut = 'actif')
);
CREATE POLICY "clients: delete own" ON clients FOR DELETE USING (
  user_id = auth.uid()
  OR user_id IN (SELECT owner_id FROM equipe_membres WHERE member_id = auth.uid() AND statut = 'actif')
);

-- DEVIS
DROP POLICY IF EXISTS "devis: select own" ON devis;
DROP POLICY IF EXISTS "devis: insert own" ON devis;
DROP POLICY IF EXISTS "devis: update own" ON devis;
DROP POLICY IF EXISTS "devis: delete own" ON devis;

CREATE POLICY "devis: select own" ON devis FOR SELECT USING (
  user_id = auth.uid()
  OR user_id IN (SELECT owner_id FROM equipe_membres WHERE member_id = auth.uid() AND statut = 'actif')
);
CREATE POLICY "devis: insert own" ON devis FOR INSERT WITH CHECK (
  user_id = auth.uid()
  OR user_id IN (SELECT owner_id FROM equipe_membres WHERE member_id = auth.uid() AND statut = 'actif')
);
CREATE POLICY "devis: update own" ON devis FOR UPDATE USING (
  user_id = auth.uid()
  OR user_id IN (SELECT owner_id FROM equipe_membres WHERE member_id = auth.uid() AND statut = 'actif')
);
CREATE POLICY "devis: delete own" ON devis FOR DELETE USING (
  user_id = auth.uid()
  OR user_id IN (SELECT owner_id FROM equipe_membres WHERE member_id = auth.uid() AND statut = 'actif')
);

-- LIGNES DEVIS
DROP POLICY IF EXISTS "lignes: select own" ON lignes_devis;
DROP POLICY IF EXISTS "lignes: insert own" ON lignes_devis;
DROP POLICY IF EXISTS "lignes: update own" ON lignes_devis;
DROP POLICY IF EXISTS "lignes: delete own" ON lignes_devis;

CREATE POLICY "lignes: select own" ON lignes_devis FOR SELECT
  USING (EXISTS (SELECT 1 FROM devis d WHERE d.id = devis_id AND (
    d.user_id = auth.uid()
    OR d.user_id IN (SELECT owner_id FROM equipe_membres WHERE member_id = auth.uid() AND statut = 'actif')
  )));
CREATE POLICY "lignes: insert own" ON lignes_devis FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM devis d WHERE d.id = devis_id AND (
    d.user_id = auth.uid()
    OR d.user_id IN (SELECT owner_id FROM equipe_membres WHERE member_id = auth.uid() AND statut = 'actif')
  )));
CREATE POLICY "lignes: update own" ON lignes_devis FOR UPDATE
  USING (EXISTS (SELECT 1 FROM devis d WHERE d.id = devis_id AND (
    d.user_id = auth.uid()
    OR d.user_id IN (SELECT owner_id FROM equipe_membres WHERE member_id = auth.uid() AND statut = 'actif')
  )));
CREATE POLICY "lignes: delete own" ON lignes_devis FOR DELETE
  USING (EXISTS (SELECT 1 FROM devis d WHERE d.id = devis_id AND (
    d.user_id = auth.uid()
    OR d.user_id IN (SELECT owner_id FROM equipe_membres WHERE member_id = auth.uid() AND statut = 'actif')
  )));

-- CHANTIERS
DROP POLICY IF EXISTS "chantiers: select own" ON chantiers;
DROP POLICY IF EXISTS "chantiers: insert own" ON chantiers;
DROP POLICY IF EXISTS "chantiers: update own" ON chantiers;
DROP POLICY IF EXISTS "chantiers: delete own" ON chantiers;

CREATE POLICY "chantiers: select own" ON chantiers FOR SELECT USING (
  user_id = auth.uid()
  OR user_id IN (SELECT owner_id FROM equipe_membres WHERE member_id = auth.uid() AND statut = 'actif')
);
CREATE POLICY "chantiers: insert own" ON chantiers FOR INSERT WITH CHECK (
  user_id = auth.uid()
  OR user_id IN (SELECT owner_id FROM equipe_membres WHERE member_id = auth.uid() AND statut = 'actif')
);
CREATE POLICY "chantiers: update own" ON chantiers FOR UPDATE USING (
  user_id = auth.uid()
  OR user_id IN (SELECT owner_id FROM equipe_membres WHERE member_id = auth.uid() AND statut = 'actif')
);
CREATE POLICY "chantiers: delete own" ON chantiers FOR DELETE USING (
  user_id = auth.uid()
  OR user_id IN (SELECT owner_id FROM equipe_membres WHERE member_id = auth.uid() AND statut = 'actif')
);

-- FACTURES
DROP POLICY IF EXISTS "factures: select own" ON factures;
DROP POLICY IF EXISTS "factures: insert own" ON factures;
DROP POLICY IF EXISTS "factures: update own" ON factures;
DROP POLICY IF EXISTS "factures: delete own" ON factures;

CREATE POLICY "factures: select own" ON factures FOR SELECT USING (
  user_id = auth.uid()
  OR user_id IN (SELECT owner_id FROM equipe_membres WHERE member_id = auth.uid() AND statut = 'actif')
);
CREATE POLICY "factures: insert own" ON factures FOR INSERT WITH CHECK (
  user_id = auth.uid()
  OR user_id IN (SELECT owner_id FROM equipe_membres WHERE member_id = auth.uid() AND statut = 'actif')
);
CREATE POLICY "factures: update own" ON factures FOR UPDATE USING (
  user_id = auth.uid()
  OR user_id IN (SELECT owner_id FROM equipe_membres WHERE member_id = auth.uid() AND statut = 'actif')
);
CREATE POLICY "factures: delete own" ON factures FOR DELETE USING (
  user_id = auth.uid()
  OR user_id IN (SELECT owner_id FROM equipe_membres WHERE member_id = auth.uid() AND statut = 'actif')
);

-- LIGNES FACTURE
DROP POLICY IF EXISTS "lignes_facture: select own" ON lignes_facture;
DROP POLICY IF EXISTS "lignes_facture: insert own" ON lignes_facture;
DROP POLICY IF EXISTS "lignes_facture: update own" ON lignes_facture;
DROP POLICY IF EXISTS "lignes_facture: delete own" ON lignes_facture;

CREATE POLICY "lignes_facture: select own" ON lignes_facture FOR SELECT
  USING (EXISTS (SELECT 1 FROM factures f WHERE f.id = facture_id AND (
    f.user_id = auth.uid()
    OR f.user_id IN (SELECT owner_id FROM equipe_membres WHERE member_id = auth.uid() AND statut = 'actif')
  )));
CREATE POLICY "lignes_facture: insert own" ON lignes_facture FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM factures f WHERE f.id = facture_id AND (
    f.user_id = auth.uid()
    OR f.user_id IN (SELECT owner_id FROM equipe_membres WHERE member_id = auth.uid() AND statut = 'actif')
  )));
CREATE POLICY "lignes_facture: update own" ON lignes_facture FOR UPDATE
  USING (EXISTS (SELECT 1 FROM factures f WHERE f.id = facture_id AND (
    f.user_id = auth.uid()
    OR f.user_id IN (SELECT owner_id FROM equipe_membres WHERE member_id = auth.uid() AND statut = 'actif')
  )));
CREATE POLICY "lignes_facture: delete own" ON lignes_facture FOR DELETE
  USING (EXISTS (SELECT 1 FROM factures f WHERE f.id = facture_id AND (
    f.user_id = auth.uid()
    OR f.user_id IN (SELECT owner_id FROM equipe_membres WHERE member_id = auth.uid() AND statut = 'actif')
  )));

-- ENTREPRISE (membres peuvent lire, seul le propriétaire peut modifier)
DROP POLICY IF EXISTS "entreprise: select own" ON entreprise;
DROP POLICY IF EXISTS "entreprise: insert own" ON entreprise;
DROP POLICY IF EXISTS "entreprise: update own" ON entreprise;
DROP POLICY IF EXISTS "entreprise: delete own" ON entreprise;

CREATE POLICY "entreprise: select own" ON entreprise FOR SELECT USING (
  user_id = auth.uid()
  OR user_id IN (SELECT owner_id FROM equipe_membres WHERE member_id = auth.uid() AND statut = 'actif')
);
CREATE POLICY "entreprise: insert own" ON entreprise FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "entreprise: update own" ON entreprise FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "entreprise: delete own" ON entreprise FOR DELETE USING (auth.uid() = user_id);

-- AVOIRS (si déjà créé avec schema_avoirs.sql, mettre à jour aussi)
DROP POLICY IF EXISTS "avoirs: select own" ON avoirs;
DROP POLICY IF EXISTS "avoirs: insert own" ON avoirs;
DROP POLICY IF EXISTS "avoirs: update own" ON avoirs;
DROP POLICY IF EXISTS "avoirs: delete own" ON avoirs;

CREATE POLICY "avoirs: select own" ON avoirs FOR SELECT USING (
  user_id = auth.uid()
  OR user_id IN (SELECT owner_id FROM equipe_membres WHERE member_id = auth.uid() AND statut = 'actif')
);
CREATE POLICY "avoirs: insert own" ON avoirs FOR INSERT WITH CHECK (
  user_id = auth.uid()
  OR user_id IN (SELECT owner_id FROM equipe_membres WHERE member_id = auth.uid() AND statut = 'actif')
);
CREATE POLICY "avoirs: update own" ON avoirs FOR UPDATE USING (
  user_id = auth.uid()
  OR user_id IN (SELECT owner_id FROM equipe_membres WHERE member_id = auth.uid() AND statut = 'actif')
);
CREATE POLICY "avoirs: delete own" ON avoirs FOR DELETE USING (
  user_id = auth.uid()
  OR user_id IN (SELECT owner_id FROM equipe_membres WHERE member_id = auth.uid() AND statut = 'actif')
);
