-- ============================================================
-- ChantierPro — Planning équipes & Pointage terrain
-- ============================================================

-- ── Planning affectations ────────────────────────────────────
CREATE TABLE IF NOT EXISTS planning_affectations (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  chantier_id uuid REFERENCES chantiers(id) ON DELETE CASCADE,
  ouvrier_nom text NOT NULL,
  date        date NOT NULL,
  heure_debut time,
  heure_fin   time,
  notes       text,
  created_at  timestamptz DEFAULT now()
);

ALTER TABLE planning_affectations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "planning: select own" ON planning_affectations FOR SELECT USING (
  user_id = auth.uid()
  OR user_id IN (SELECT owner_id FROM equipe_membres WHERE member_id = auth.uid() AND statut = 'actif')
);
CREATE POLICY "planning: insert own" ON planning_affectations FOR INSERT WITH CHECK (
  user_id = auth.uid()
  OR user_id IN (SELECT owner_id FROM equipe_membres WHERE member_id = auth.uid() AND statut = 'actif')
);
CREATE POLICY "planning: update own" ON planning_affectations FOR UPDATE USING (
  user_id = auth.uid()
  OR user_id IN (SELECT owner_id FROM equipe_membres WHERE member_id = auth.uid() AND statut = 'actif')
);
CREATE POLICY "planning: delete own" ON planning_affectations FOR DELETE USING (
  user_id = auth.uid()
  OR user_id IN (SELECT owner_id FROM equipe_membres WHERE member_id = auth.uid() AND statut = 'actif')
);

CREATE INDEX IF NOT EXISTS idx_planning_user    ON planning_affectations(user_id);
CREATE INDEX IF NOT EXISTS idx_planning_date    ON planning_affectations(date);
CREATE INDEX IF NOT EXISTS idx_planning_chantier ON planning_affectations(chantier_id);

-- ── Pointages terrain ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS pointages (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  chantier_id  uuid REFERENCES chantiers(id) ON DELETE SET NULL,
  ouvrier_nom  text NOT NULL,
  date         date NOT NULL,
  heure_debut  time,
  heure_fin    time,
  pause_min    int DEFAULT 0,
  notes        text,
  created_at   timestamptz DEFAULT now()
);

ALTER TABLE pointages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "pointages: select own" ON pointages FOR SELECT USING (
  user_id = auth.uid()
  OR user_id IN (SELECT owner_id FROM equipe_membres WHERE member_id = auth.uid() AND statut = 'actif')
);
CREATE POLICY "pointages: insert own" ON pointages FOR INSERT WITH CHECK (
  user_id = auth.uid()
  OR user_id IN (SELECT owner_id FROM equipe_membres WHERE member_id = auth.uid() AND statut = 'actif')
);
CREATE POLICY "pointages: update own" ON pointages FOR UPDATE USING (
  user_id = auth.uid()
  OR user_id IN (SELECT owner_id FROM equipe_membres WHERE member_id = auth.uid() AND statut = 'actif')
);
CREATE POLICY "pointages: delete own" ON pointages FOR DELETE USING (
  user_id = auth.uid()
  OR user_id IN (SELECT owner_id FROM equipe_membres WHERE member_id = auth.uid() AND statut = 'actif')
);

CREATE INDEX IF NOT EXISTS idx_pointages_user    ON pointages(user_id);
CREATE INDEX IF NOT EXISTS idx_pointages_date    ON pointages(date);
CREATE INDEX IF NOT EXISTS idx_pointages_chantier ON pointages(chantier_id);

-- ── Tâches chantier ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS chantier_taches (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  chantier_id uuid REFERENCES chantiers(id) ON DELETE CASCADE NOT NULL,
  titre       text NOT NULL,
  statut      text NOT NULL DEFAULT 'a_faire'
                CHECK (statut IN ('a_faire', 'en_cours', 'fait')),
  ordre       int DEFAULT 0,
  created_at  timestamptz DEFAULT now()
);

ALTER TABLE chantier_taches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "chantier_taches: select own" ON chantier_taches FOR SELECT
  USING (EXISTS (SELECT 1 FROM chantiers c WHERE c.id = chantier_id AND (
    c.user_id = auth.uid()
    OR c.user_id IN (SELECT owner_id FROM equipe_membres WHERE member_id = auth.uid() AND statut = 'actif')
  )));
CREATE POLICY "chantier_taches: insert own" ON chantier_taches FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM chantiers c WHERE c.id = chantier_id AND (
    c.user_id = auth.uid()
    OR c.user_id IN (SELECT owner_id FROM equipe_membres WHERE member_id = auth.uid() AND statut = 'actif')
  )));
CREATE POLICY "chantier_taches: update own" ON chantier_taches FOR UPDATE
  USING (EXISTS (SELECT 1 FROM chantiers c WHERE c.id = chantier_id AND (
    c.user_id = auth.uid()
    OR c.user_id IN (SELECT owner_id FROM equipe_membres WHERE member_id = auth.uid() AND statut = 'actif')
  )));
CREATE POLICY "chantier_taches: delete own" ON chantier_taches FOR DELETE
  USING (EXISTS (SELECT 1 FROM chantiers c WHERE c.id = chantier_id AND (
    c.user_id = auth.uid()
    OR c.user_id IN (SELECT owner_id FROM equipe_membres WHERE member_id = auth.uid() AND statut = 'actif')
  )));

CREATE INDEX IF NOT EXISTS idx_taches_chantier ON chantier_taches(chantier_id);

-- ── Notes chantier ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS chantier_notes (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  chantier_id uuid REFERENCES chantiers(id) ON DELETE CASCADE NOT NULL,
  user_id     uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  contenu     text NOT NULL,
  created_at  timestamptz DEFAULT now()
);

ALTER TABLE chantier_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "chantier_notes: select own" ON chantier_notes FOR SELECT
  USING (EXISTS (SELECT 1 FROM chantiers c WHERE c.id = chantier_id AND (
    c.user_id = auth.uid()
    OR c.user_id IN (SELECT owner_id FROM equipe_membres WHERE member_id = auth.uid() AND statut = 'actif')
  )));
CREATE POLICY "chantier_notes: insert own" ON chantier_notes FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM chantiers c WHERE c.id = chantier_id AND (
    c.user_id = auth.uid()
    OR c.user_id IN (SELECT owner_id FROM equipe_membres WHERE member_id = auth.uid() AND statut = 'actif')
  )));
CREATE POLICY "chantier_notes: delete own" ON chantier_notes FOR DELETE
  USING (EXISTS (SELECT 1 FROM chantiers c WHERE c.id = chantier_id AND (
    c.user_id = auth.uid()
    OR c.user_id IN (SELECT owner_id FROM equipe_membres WHERE member_id = auth.uid() AND statut = 'actif')
  )));

CREATE INDEX IF NOT EXISTS idx_notes_chantier ON chantier_notes(chantier_id);
