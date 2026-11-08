-- Fase 3 / Tarefa 1: agenda do Google por profissional + regra única do catálogo.
--
-- Pode ser executada mais de uma vez sem erro. Sem blocos "do $$" (quebram ao
-- colar no SQL Editor do Supabase). O código do site funciona com ou sem esta
-- migração: sem a tabela, o salão atual continua usando as variáveis GOOGLE_CALENDAR_ID_*
-- da Vercel.

-- Agenda do Google de cada profissional, em tabela PRÓPRIA e só do servidor:
-- RLS ligada sem nenhuma regra e permissão só para service_role. Assim o público
-- não lê o id da agenda e nenhuma profissional consegue apontar a própria linha
-- para a agenda de outro salão. (Não vai em "professionals": essa tabela é lida
-- pelo público e a profissional pode alterar a própria linha.)
create table if not exists public.professional_calendars (
  salon_id text not null references public.salons(id),
  professional_id text not null,
  google_calendar_id text not null,
  updated_at timestamptz not null default now(),
  primary key (salon_id, professional_id)
);
alter table public.professional_calendars enable row level security;
revoke all on public.professional_calendars from anon, authenticated;
grant select, insert, update, delete on public.professional_calendars to service_role;

-- Regra única (salon_id, id) no catálogo. Só acrescenta; a troca da chave
-- principal fica em 20261108b, para rodar depois da publicação do código novo.
alter table public.catalog_services drop constraint if exists catalog_services_salon_id_id_key;
alter table public.catalog_services add constraint catalog_services_salon_id_id_key unique (salon_id, id);

-- O PostgREST precisa enxergar a tabela nova.
notify pgrst, 'reload schema';

-- ============================================================================
-- VERIFICAÇÃO (rodar à mão no SQL Editor depois da migração; não faz parte dela)
-- ============================================================================
-- -- Esperado: 1 linha (professional_calendars | true)
-- select relname, relrowsecurity from pg_class
--  where relnamespace = 'public'::regnamespace and relname = 'professional_calendars';
--
-- -- Esperado: 0 linhas (nenhuma regra: só a chave de serviço acessa)
-- select policyname from pg_policies
--  where schemaname = 'public' and tablename = 'professional_calendars';
--
-- -- Esperado: 0 linhas (anon e authenticated sem permissão)
-- select grantee, privilege_type from information_schema.role_table_grants
--  where table_schema = 'public' and table_name = 'professional_calendars'
--    and grantee in ('anon', 'authenticated');
--
-- -- Esperado: 1 linha (catalog_services_salon_id_id_key)
-- select conname from pg_constraint
--  where conrelid = 'public.catalog_services'::regclass
--    and conname = 'catalog_services_salon_id_id_key';
