-- ============================================================
-- Bati Prelvio — Signature électronique sur devis
-- À exécuter dans l'éditeur SQL Supabase
-- ============================================================

ALTER TABLE devis ADD COLUMN IF NOT EXISTS signature_token  uuid   UNIQUE DEFAULT gen_random_uuid();
ALTER TABLE devis ADD COLUMN IF NOT EXISTS signature_base64 text;
ALTER TABLE devis ADD COLUMN IF NOT EXISTS signe_le         timestamptz;
ALTER TABLE devis ADD COLUMN IF NOT EXISTS signe_par        text;

-- S'assurer que les lignes existantes ont un token unique
UPDATE devis SET signature_token = gen_random_uuid() WHERE signature_token IS NULL;

CREATE INDEX IF NOT EXISTS idx_devis_signature_token ON devis(signature_token);

-- Policy lecture publique par token (pour la page de signature)
-- La Edge Function sign-devis utilisera le service role key — pas de policy nécessaire
