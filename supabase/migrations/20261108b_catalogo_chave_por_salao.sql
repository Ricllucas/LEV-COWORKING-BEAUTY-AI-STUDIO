-- Fase 3 / Tarefa 1 (parte 2): chave principal do catálogo passa a ser (salon_id, id).
--
-- RODAR SÓ DEPOIS QUE O CÓDIGO DA FASE 3 ESTIVER NO AR: o código antigo grava com
-- on_conflict=id, que deixa de funcionar quando a chave principal muda.
-- Precisa de 20261108_fase3_salao_proprio.sql já aplicada.
-- Pode ser executada mais de uma vez sem erro. Sem blocos "do $$".

alter table public.catalog_services drop constraint if exists catalog_services_pkey;
alter table public.catalog_services add constraint catalog_services_pkey primary key (salon_id, id);

-- A regra única provisória não é mais necessária (a chave principal já garante).
alter table public.catalog_services drop constraint if exists catalog_services_salon_id_id_key;

notify pgrst, 'reload schema';

-- ============================================================================
-- VERIFICAÇÃO (rodar à mão no SQL Editor depois da migração; não faz parte dela)
-- ============================================================================
-- -- Esperado: 1 linha, definição "PRIMARY KEY (salon_id, id)"
-- select conname, pg_get_constraintdef(oid) from pg_constraint
--  where conrelid = 'public.catalog_services'::regclass and contype = 'p';
--
-- -- Esperado: 0 linhas
-- select conname from pg_constraint
--  where conrelid = 'public.catalog_services'::regclass
--    and conname = 'catalog_services_salon_id_id_key';
