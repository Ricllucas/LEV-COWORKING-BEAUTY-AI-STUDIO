-- Multi-salão, Fase 1 / Tarefa 1.1: tabela de salões + etiqueta salon_id.
--
-- Compatível com o código antigo: toda coluna nova tem valor padrão 'lev'.
-- Pode ser executada mais de uma vez sem erro. Sem blocos "do $$" (quebravam
-- ao colar no SQL Editor do Supabase). O SQL Editor roda tudo como uma
-- transação só: se qualquer linha falhar, nada é aplicado.
-- A restrição única antiga em client_profiles.phone_digits NÃO é removida
-- aqui (o código antigo depende dela); sai em 20261104b, depois.

create table if not exists public.salons (
  id text primary key,
  slug text not null unique,
  name text not null,
  status text not null default 'ativo',
  created_at timestamptz not null default now()
);

alter table public.salons drop constraint if exists salons_id_format_check;
alter table public.salons add constraint salons_id_format_check check (id ~ '^[a-z0-9-]{2,40}$');

-- Só a chave de serviço (servidor) lê/escreve; sem policies para anon/authenticated.
alter table public.salons enable row level security;

insert into public.salons (id, slug, name)
values ('lev', 'lev', 'LEV Coworking Beauty')
on conflict do nothing;

alter table public.appointments           add column if not exists salon_id text not null default 'lev' references public.salons(id);
alter table public.catalog_services       add column if not exists salon_id text not null default 'lev' references public.salons(id);
alter table public.client_profiles        add column if not exists salon_id text not null default 'lev' references public.salons(id);
alter table public.professional_access    add column if not exists salon_id text not null default 'lev' references public.salons(id);
alter table public.admin_users            add column if not exists salon_id text not null default 'lev' references public.salons(id);
alter table public.whatsapp_conversations add column if not exists salon_id text not null default 'lev' references public.salons(id);
alter table public.whatsapp_messages      add column if not exists salon_id text not null default 'lev' references public.salons(id);
alter table public.reminder_history       add column if not exists salon_id text not null default 'lev' references public.salons(id);

create index if not exists appointments_salon_id_idx           on public.appointments (salon_id);
create index if not exists catalog_services_salon_id_idx       on public.catalog_services (salon_id);
create index if not exists client_profiles_salon_id_idx        on public.client_profiles (salon_id);
create index if not exists professional_access_salon_id_idx    on public.professional_access (salon_id);
create index if not exists admin_users_salon_id_idx            on public.admin_users (salon_id);
create index if not exists whatsapp_conversations_salon_id_idx on public.whatsapp_conversations (salon_id);
create index if not exists whatsapp_messages_salon_id_idx      on public.whatsapp_messages (salon_id);
create index if not exists reminder_history_salon_id_idx       on public.reminder_history (salon_id);

alter table public.client_profiles drop constraint if exists client_profiles_salon_phone_key;
alter table public.client_profiles add constraint client_profiles_salon_phone_key unique (salon_id, phone_digits);

-- O PostgREST precisa enxergar a coluna salon_id nova; sem isto os filtros devolvem erro 400.
notify pgrst, 'reload schema';

-- ============================================================================
-- VERIFICAÇÃO (rodar à mão no SQL Editor depois da migração; não faz parte dela)
-- ============================================================================
-- -- Esperado: 8 tabelas listadas
-- select table_name from information_schema.columns
--  where column_name = 'salon_id' and table_schema = 'public' order by 1;
--
-- -- Esperado: lev | ativo
-- select id, status from public.salons;
--
-- -- Esperado: 1 linha (client_profiles_salon_phone_key)
-- select conname from pg_constraint
--  where conname = 'client_profiles_salon_phone_key'
--    and conrelid = 'public.client_profiles'::regclass;
