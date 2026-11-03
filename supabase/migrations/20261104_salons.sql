-- Multi-salão, Fase 1 / Tarefa 1.1: tabela de salões + etiqueta salon_id.
--
-- Compatível com o código antigo: toda coluna nova tem valor padrão 'lev',
-- então o código atual (que não conhece salon_id) continua funcionando.
-- Pode ser executada mais de uma vez sem erro (idempotente).
--
-- Tabelas appointments, professional_access e admin_users foram criadas
-- pelo painel do Supabase (não estão neste repositório). Se alguma não
-- existir, ela é simplesmente ignorada.

begin;

-- 1) Tabela de salões ------------------------------------------------------
create table if not exists public.salons (
  id text primary key,
  slug text not null unique,
  name text not null,
  status text not null default 'ativo',
  created_at timestamptz not null default now()
);

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'salons_id_format_check'
      and conrelid = 'public.salons'::regclass
  ) then
    alter table public.salons
      add constraint salons_id_format_check check (id ~ '^[a-z0-9-]{2,40}$');
  end if;
end
$$;

-- Só a chave de serviço (servidor) lê/escreve; sem policies para anon/authenticated.
alter table public.salons enable row level security;

-- 2) Primeiro salão: a LEV ---------------------------------------------------
insert into public.salons (id, slug, name)
values ('lev', 'lev', 'LEV Coworking Beauty')
on conflict do nothing;

-- 3) Coluna salon_id + índice em cada tabela (ignora tabela inexistente) ----
do $$
declare
  t text;
begin
  foreach t in array array[
    'appointments',
    'catalog_services',
    'client_profiles',
    'professional_access',
    'admin_users',
    'whatsapp_conversations',
    'whatsapp_messages',
    'reminder_history'
  ]
  loop
    if to_regclass('public.' || quote_ident(t)) is not null then
      execute format(
        'alter table public.%I add column if not exists salon_id text not null default ''lev'' references public.salons(id)',
        t
      );
      execute format(
        'create index if not exists %I on public.%I (salon_id)',
        t || '_salon_id_idx', t
      );
    else
      raise notice 'tabela public.% não existe; ignorada', t;
    end if;
  end loop;
end
$$;

-- 4) client_profiles: único por (salon_id, phone_digits) ----------------------
-- ATENÇÃO: a restrição única antiga em phone_digits NÃO é removida aqui.
-- O código atual (api/clients/index.ts) faz upsert com on_conflict=phone_digits
-- e depende dela. Ela será removida em uma tarefa posterior, junto com a
-- troca do código. Por ora as duas coexistem.
do $$
begin
  if to_regclass('public.client_profiles') is not null
     and not exists (
       select 1 from pg_constraint
       where conname = 'client_profiles_salon_phone_key'
         and conrelid = 'public.client_profiles'::regclass
     ) then
    alter table public.client_profiles
      add constraint client_profiles_salon_phone_key unique (salon_id, phone_digits);
  end if;
end
$$;

commit;

-- ============================================================================
-- VERIFICAÇÃO (rodar à mão no SQL Editor depois da migração; não faz parte dela)
-- ============================================================================
-- -- Esperado: 8 tabelas listadas
-- select table_name from information_schema.columns
--  where column_name = 'salon_id' and table_schema = 'public' order by 1;
--
-- -- Esperado: 0
-- select count(*) from public.appointments where salon_id <> 'lev';
--
-- -- Esperado: 1 linha (client_profiles_salon_phone_key)
-- select conname from pg_constraint
--  where conname = 'client_profiles_salon_phone_key'
--    and conrelid = 'public.client_profiles'::regclass;
