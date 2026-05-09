-- ============================================================
-- ChantierPro — Parc véhicules & matériel
-- ============================================================

CREATE TABLE IF NOT EXISTS vehicules (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id               uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  nom                   text NOT NULL,
  type                  text NOT NULL DEFAULT 'vehicule'
                          CHECK (type IN ('vehicule', 'engin', 'outil', 'autre')),
  immatriculation       text,
  marque                text,
  modele                text,
  annee                 int,
  statut                text NOT NULL DEFAULT 'disponible'
                          CHECK (statut IN ('disponible', 'en_service', 'maintenance', 'hors_service')),
  kilometrage           int,
  date_controle_tech    date,
  date_assurance        date,
  date_revision         date,
  notes                 text,
  created_at            timestamptz DEFAULT now(),
  updated_at            timestamptz DEFAULT now()
);

ALTER TABLE vehicules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "vehicules: select own" ON vehicules FOR SELECT USING (
  user_id = auth.uid()
  OR user_id IN (SELECT owner_id FROM equipe_membres WHERE member_id = auth.uid() AND statut = 'actif')
);
CREATE POLICY "vehicules: insert own" ON vehicules FOR INSERT WITH CHECK (
  user_id = auth.uid()
  OR user_id IN (SELECT owner_id FROM equipe_membres WHERE member_id = auth.uid() AND statut = 'actif')
);
CREATE POLICY "vehicules: update own" ON vehicules FOR UPDATE USING (
  user_id = auth.uid()
  OR user_id IN (SELECT owner_id FROM equipe_membres WHERE member_id = auth.uid() AND statut = 'actif')
);
CREATE POLICY "vehicules: delete own" ON vehicules FOR DELETE USING (
  user_id = auth.uid()
  OR user_id IN (SELECT owner_id FROM equipe_membres WHERE member_id = auth.uid() AND statut = 'actif')
);

CREATE INDEX IF NOT EXISTS idx_vehicules_user   ON vehicules(user_id);
CREATE INDEX IF NOT EXISTS idx_vehicules_statut ON vehicules(statut);

CREATE TRIGGER vehicules_updated_at
  BEFORE UPDATE ON vehicules
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
