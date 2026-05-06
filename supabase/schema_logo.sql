-- Ajouter colonne logo_url à la table entreprise
ALTER TABLE entreprise ADD COLUMN IF NOT EXISTS logo_url TEXT;

-- Créer le bucket Supabase Storage pour les logos
INSERT INTO storage.buckets (id, name, public)
VALUES ('logos', 'logos', true)
ON CONFLICT (id) DO NOTHING;

-- Policies Storage
CREATE POLICY "logos: upload own" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'logos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "logos: read public" ON storage.objects
  FOR SELECT USING (bucket_id = 'logos');

CREATE POLICY "logos: update own" ON storage.objects
  FOR UPDATE USING (bucket_id = 'logos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "logos: delete own" ON storage.objects
  FOR DELETE USING (bucket_id = 'logos' AND auth.uid()::text = (storage.foldername(name))[1]);
