-- Agenda o envio de lembretes a cada 5 minutos pelo próprio Supabase (pg_cron + pg_net).
-- O plano gratuito da Vercel só permite cron diário, por isso o disparo sai daqui.
--
-- ANTES de executar, guarde o mesmo valor de CRON_SECRET configurado na Vercel no Vault
-- (rode uma única vez no SQL Editor, trocando o texto pelo segredo real):
--   select vault.create_secret('COLE_AQUI_O_CRON_SECRET', 'cron_secret');

CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

SELECT cron.schedule(
  'send-reminders',
  '*/5 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://lev-coworking-beauty.vercel.app/api/cron/send-reminders',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'cron_secret')
    ),
    body := '{}'::jsonb,
    timeout_milliseconds := 55000
  );
  $$
);
