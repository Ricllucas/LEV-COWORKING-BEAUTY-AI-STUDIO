-- Fase 3 / Tarefa 1: agenda do Google por profissional + regra única do catálogo.
--
-- Pode ser executada mais de uma vez sem erro. Sem blocos "do $$" (quebram ao
-- colar no SQL Editor do Supabase). O código do site funciona com ou sem esta
-- migração: sem a coluna, a LEV continua usando as variáveis GOOGLE_CALENDAR_ID_*
-- da Vercel.

-- Agenda do Google de cada profissional. Fica fora do "payload" de propósito:
-- a sincronização do painel grava só o payload e não pode apagar este campo.
alter table public.professionals add column if not exists google_calendar_id text;

-- Regra única (salon_id, id) no catálogo. Só acrescenta; a troca da chave
-- principal fica em 20261108b, para rodar depois da publicação do código novo.
alter table public.catalog_services drop constraint if exists catalog_services_salon_id_id_key;
alter table public.catalog_services add constraint catalog_services_salon_id_id_key unique (salon_id, id);

-- O PostgREST precisa enxergar a coluna nova.
notify pgrst, 'reload schema';

-- ============================================================================
-- VERIFICAÇÃO (rodar à mão no SQL Editor depois da migração; não faz parte dela)
-- ============================================================================
-- -- Esperado: 1 linha (google_calendar_id | text)
-- select column_name, data_type from information_schema.columns
--  where table_schema = 'public' and table_name = 'professionals' and column_name = 'google_calendar_id';
--
-- -- Esperado: 1 linha (catalog_services_salon_id_id_key)
-- select conname from pg_constraint
--  where conrelid = 'public.catalog_services'::regclass
--    and conname = 'catalog_services_salon_id_id_key';
