-- Fase 2 / Tarefa 1: dados do painel na nuvem, separados por salão (salon_id).
--
-- Pode ser executada mais de uma vez sem erro. Sem blocos "do $$" (quebram ao
-- colar no SQL Editor do Supabase). O código do site funciona com ou sem esta
-- migração: sem as tabelas, o painel segue usando só o aparelho.
-- Dados pessoais da profissional (MEI, CPF/CNPJ, banco, e-mail) ficam só em
-- professional_private, que o público não lê.

-- ----------------------------------------------------------------------------
-- Funções de apoio às regras (RLS)
-- ----------------------------------------------------------------------------
create or replace function public.staff_salon_id()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (select a.salon_id from public.admin_users a where a.user_id = auth.uid() limit 1),
    (select p.salon_id from public.professional_access p where p.user_id = auth.uid() and p.status = 'approved' limit 1)
  );
$$;

create or replace function public.is_salon_admin(target text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.admin_users a
    where a.user_id = auth.uid() and a.salon_id = target
  );
$$;

create or replace function public.staff_professional_id()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select p.professional_id from public.professional_access p
  where p.user_id = auth.uid() and p.status = 'approved'
  limit 1;
$$;

grant execute on function public.staff_salon_id() to anon, authenticated, service_role;
grant execute on function public.is_salon_admin(text) to anon, authenticated, service_role;
grant execute on function public.staff_professional_id() to anon, authenticated, service_role;

-- ----------------------------------------------------------------------------
-- Tabelas (todas com o mesmo formato)
-- ----------------------------------------------------------------------------
create table if not exists public.salon_settings (
  salon_id text not null references public.salons(id),
  id text not null,
  professional_id text,
  payload jsonb not null,
  updated_at timestamptz not null default now(),
  primary key (salon_id, id)
);
create index if not exists salon_settings_salon_professional_idx on public.salon_settings (salon_id, professional_id);
alter table public.salon_settings enable row level security;

create table if not exists public.professionals (
  salon_id text not null references public.salons(id),
  id text not null,
  professional_id text,
  payload jsonb not null,
  updated_at timestamptz not null default now(),
  primary key (salon_id, id)
);
create index if not exists professionals_salon_professional_idx on public.professionals (salon_id, professional_id);
alter table public.professionals enable row level security;

create table if not exists public.professional_private (
  salon_id text not null references public.salons(id),
  id text not null,
  professional_id text,
  payload jsonb not null,
  updated_at timestamptz not null default now(),
  primary key (salon_id, id)
);
create index if not exists professional_private_salon_professional_idx on public.professional_private (salon_id, professional_id);
alter table public.professional_private enable row level security;

create table if not exists public.payments (
  salon_id text not null references public.salons(id),
  id text not null,
  professional_id text,
  payload jsonb not null,
  updated_at timestamptz not null default now(),
  primary key (salon_id, id)
);
create index if not exists payments_salon_professional_idx on public.payments (salon_id, professional_id);
alter table public.payments enable row level security;

create table if not exists public.schedule_blocks (
  salon_id text not null references public.salons(id),
  id text not null,
  professional_id text,
  payload jsonb not null,
  updated_at timestamptz not null default now(),
  primary key (salon_id, id)
);
create index if not exists schedule_blocks_salon_professional_idx on public.schedule_blocks (salon_id, professional_id);
alter table public.schedule_blocks enable row level security;

create table if not exists public.waitlist (
  salon_id text not null references public.salons(id),
  id text not null,
  professional_id text,
  payload jsonb not null,
  updated_at timestamptz not null default now(),
  primary key (salon_id, id)
);
create index if not exists waitlist_salon_professional_idx on public.waitlist (salon_id, professional_id);
alter table public.waitlist enable row level security;

create table if not exists public.audit_logs (
  salon_id text not null references public.salons(id),
  id text not null,
  professional_id text,
  payload jsonb not null,
  updated_at timestamptz not null default now(),
  primary key (salon_id, id)
);
create index if not exists audit_logs_salon_professional_idx on public.audit_logs (salon_id, professional_id);
alter table public.audit_logs enable row level security;

-- ----------------------------------------------------------------------------
-- Permissões (neste projeto tabela nova não recebe permissão automática)
-- ----------------------------------------------------------------------------
grant select, insert, update, delete on public.salon_settings        to service_role;
grant select, insert, update, delete on public.professionals         to service_role;
grant select, insert, update, delete on public.professional_private  to service_role;
grant select, insert, update, delete on public.payments              to service_role;
grant select, insert, update, delete on public.schedule_blocks       to service_role;
grant select, insert, update, delete on public.waitlist              to service_role;
grant select, insert, update, delete on public.audit_logs            to service_role;

grant select on public.salon_settings to anon;
grant select on public.professionals  to anon;

grant select, insert, update on public.salon_settings       to authenticated;
grant select, insert, update on public.professionals        to authenticated;
grant select, insert, update on public.professional_private to authenticated;
grant select, insert, update on public.payments             to authenticated;
grant select, insert, update on public.schedule_blocks      to authenticated;
grant select, insert, update on public.waitlist             to authenticated;
-- Registro de auditoria: só leitura e inclusão (nunca alterar nem apagar).
grant select, insert         on public.audit_logs           to authenticated;
grant delete                 on public.schedule_blocks      to authenticated;

-- ----------------------------------------------------------------------------
-- Regras (RLS)
-- "admin do salão, ou a própria profissional" =
--   public.is_salon_admin(salon_id)
--   or (professional_id = public.staff_professional_id() and salon_id = public.staff_salon_id())
-- ----------------------------------------------------------------------------

-- salon_settings: todos leem; só admin do salão grava.
drop policy if exists "salon_settings_read" on public.salon_settings;
create policy "salon_settings_read" on public.salon_settings
for select to anon, authenticated using (true);

drop policy if exists "salon_settings_admin_insert" on public.salon_settings;
create policy "salon_settings_admin_insert" on public.salon_settings
for insert to authenticated with check (public.is_salon_admin(salon_id));

drop policy if exists "salon_settings_admin_update" on public.salon_settings;
create policy "salon_settings_admin_update" on public.salon_settings
for update to authenticated
using (public.is_salon_admin(salon_id))
with check (public.is_salon_admin(salon_id));

-- professionals: todos leem; admin do salão ou a própria grava.
drop policy if exists "professionals_read" on public.professionals;
create policy "professionals_read" on public.professionals
for select to anon, authenticated using (true);

drop policy if exists "professionals_write_insert" on public.professionals;
create policy "professionals_write_insert" on public.professionals
for insert to authenticated with check (
  public.is_salon_admin(salon_id)
  or (professional_id = public.staff_professional_id() and salon_id = public.staff_salon_id())
);

drop policy if exists "professionals_write_update" on public.professionals;
create policy "professionals_write_update" on public.professionals
for update to authenticated
using (
  public.is_salon_admin(salon_id)
  or (professional_id = public.staff_professional_id() and salon_id = public.staff_salon_id())
)
with check (
  public.is_salon_admin(salon_id)
  or (professional_id = public.staff_professional_id() and salon_id = public.staff_salon_id())
);

-- professional_private: admin do salão ou a própria (lê e grava).
drop policy if exists "professional_private_read" on public.professional_private;
create policy "professional_private_read" on public.professional_private
for select to authenticated using (
  public.is_salon_admin(salon_id)
  or (professional_id = public.staff_professional_id() and salon_id = public.staff_salon_id())
);

drop policy if exists "professional_private_write_insert" on public.professional_private;
create policy "professional_private_write_insert" on public.professional_private
for insert to authenticated with check (
  public.is_salon_admin(salon_id)
  or (professional_id = public.staff_professional_id() and salon_id = public.staff_salon_id())
);

drop policy if exists "professional_private_write_update" on public.professional_private;
create policy "professional_private_write_update" on public.professional_private
for update to authenticated
using (
  public.is_salon_admin(salon_id)
  or (professional_id = public.staff_professional_id() and salon_id = public.staff_salon_id())
)
with check (
  public.is_salon_admin(salon_id)
  or (professional_id = public.staff_professional_id() and salon_id = public.staff_salon_id())
);

-- payments: admin do salão ou a profissional dona do lançamento (lê e grava).
drop policy if exists "payments_read" on public.payments;
create policy "payments_read" on public.payments
for select to authenticated using (
  public.is_salon_admin(salon_id)
  or (professional_id = public.staff_professional_id() and salon_id = public.staff_salon_id())
);

drop policy if exists "payments_write_insert" on public.payments;
create policy "payments_write_insert" on public.payments
for insert to authenticated with check (
  public.is_salon_admin(salon_id)
  or (professional_id = public.staff_professional_id() and salon_id = public.staff_salon_id())
);

drop policy if exists "payments_write_update" on public.payments;
create policy "payments_write_update" on public.payments
for update to authenticated
using (
  public.is_salon_admin(salon_id)
  or (professional_id = public.staff_professional_id() and salon_id = public.staff_salon_id())
)
with check (
  public.is_salon_admin(salon_id)
  or (professional_id = public.staff_professional_id() and salon_id = public.staff_salon_id())
);

-- schedule_blocks: equipe do salão lê; admin ou a dona grava e apaga.
drop policy if exists "schedule_blocks_read" on public.schedule_blocks;
create policy "schedule_blocks_read" on public.schedule_blocks
for select to authenticated using (salon_id = public.staff_salon_id());

drop policy if exists "schedule_blocks_write_insert" on public.schedule_blocks;
create policy "schedule_blocks_write_insert" on public.schedule_blocks
for insert to authenticated with check (
  public.is_salon_admin(salon_id)
  or (professional_id = public.staff_professional_id() and salon_id = public.staff_salon_id())
);

drop policy if exists "schedule_blocks_write_update" on public.schedule_blocks;
create policy "schedule_blocks_write_update" on public.schedule_blocks
for update to authenticated
using (
  public.is_salon_admin(salon_id)
  or (professional_id = public.staff_professional_id() and salon_id = public.staff_salon_id())
)
with check (
  public.is_salon_admin(salon_id)
  or (professional_id = public.staff_professional_id() and salon_id = public.staff_salon_id())
);

drop policy if exists "schedule_blocks_write_delete" on public.schedule_blocks;
create policy "schedule_blocks_write_delete" on public.schedule_blocks
for delete to authenticated using (
  public.is_salon_admin(salon_id)
  or (professional_id = public.staff_professional_id() and salon_id = public.staff_salon_id())
);

-- waitlist: equipe do salão lê e grava.
drop policy if exists "waitlist_read" on public.waitlist;
create policy "waitlist_read" on public.waitlist
for select to authenticated using (salon_id = public.staff_salon_id());

drop policy if exists "waitlist_write_insert" on public.waitlist;
create policy "waitlist_write_insert" on public.waitlist
for insert to authenticated with check (salon_id = public.staff_salon_id());

drop policy if exists "waitlist_write_update" on public.waitlist;
create policy "waitlist_write_update" on public.waitlist
for update to authenticated
using (salon_id = public.staff_salon_id())
with check (salon_id = public.staff_salon_id());

-- audit_logs: equipe inclui; só admin do salão lê; ninguém altera ou apaga.
drop policy if exists "audit_logs_read" on public.audit_logs;
create policy "audit_logs_read" on public.audit_logs
for select to authenticated using (public.is_salon_admin(salon_id));

drop policy if exists "audit_logs_insert" on public.audit_logs;
create policy "audit_logs_insert" on public.audit_logs
for insert to authenticated with check (salon_id = public.staff_salon_id());

-- ----------------------------------------------------------------------------
-- Catálogo: só mexe em serviço do próprio salão (mantém admin / própria profissional)
-- ----------------------------------------------------------------------------
drop policy if exists "catalog_staff_insert" on public.catalog_services;
create policy "catalog_staff_insert" on public.catalog_services
for insert to authenticated with check (
  catalog_services.salon_id = public.staff_salon_id()
  and (
    exists (select 1 from public.admin_users a where a.user_id = auth.uid())
    or exists (select 1 from public.professional_access p where p.user_id = auth.uid() and p.status = 'approved' and p.professional_id = catalog_services.professional_id)
  )
);

drop policy if exists "catalog_staff_update" on public.catalog_services;
create policy "catalog_staff_update" on public.catalog_services
for update to authenticated
using (
  catalog_services.salon_id = public.staff_salon_id()
  and (
    exists (select 1 from public.admin_users a where a.user_id = auth.uid())
    or exists (select 1 from public.professional_access p where p.user_id = auth.uid() and p.status = 'approved' and p.professional_id = catalog_services.professional_id)
  )
)
with check (
  catalog_services.salon_id = public.staff_salon_id()
  and (
    exists (select 1 from public.admin_users a where a.user_id = auth.uid())
    or exists (select 1 from public.professional_access p where p.user_id = auth.uid() and p.status = 'approved' and p.professional_id = catalog_services.professional_id)
  )
);

-- O PostgREST precisa enxergar as tabelas novas.
notify pgrst, 'reload schema';

-- ============================================================================
-- VERIFICAÇÃO (rodar à mão no SQL Editor depois da migração; não faz parte dela)
-- ============================================================================
-- -- Esperado: 7 linhas, todas com relrowsecurity = true
-- select relname, relrowsecurity from pg_class
--  where relnamespace = 'public'::regnamespace
--    and relname in ('salon_settings','professionals','professional_private','payments','schedule_blocks','waitlist','audit_logs')
--  order by 1;
--
-- -- Esperado: audit_logs 2, payments 3, professional_private 3,
-- -- professionals 3, salon_settings 3, schedule_blocks 4, waitlist 3
-- select tablename, count(*) from pg_policies
--  where schemaname = 'public'
--    and tablename in ('salon_settings','professionals','professional_private','payments','schedule_blocks','waitlist','audit_logs')
--  group by 1 order by 1;
--
-- -- Esperado: 3 funções
-- select proname from pg_proc
--  where pronamespace = 'public'::regnamespace
--    and proname in ('staff_salon_id','is_salon_admin','staff_professional_id');
