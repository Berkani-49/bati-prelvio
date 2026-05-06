-- Activer l'extension pg_cron (à exécuter dans Supabase SQL Editor)
-- Note : pg_cron est disponible sur les plans Pro/Team de Supabase

-- Exécuter la relance chaque jour à 8h00 (UTC)
SELECT cron.schedule(
  'relances-factures-quotidien',
  '0 8 * * *',
  $$
  SELECT net.http_post(
    url := current_setting('app.supabase_url') || '/functions/v1/relances-factures',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.service_role_key')
    ),
    body := '{}'::jsonb
  );
  $$
);
