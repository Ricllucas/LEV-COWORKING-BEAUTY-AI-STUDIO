create table if not exists public.catalog_services (
  id text primary key,
  professional_id text not null,
  payload jsonb,
  deleted boolean not null default false,
  updated_at timestamptz not null default now()
);

alter table public.catalog_services enable row level security;

grant select on table public.catalog_services to anon, authenticated;
grant insert, update on table public.catalog_services to authenticated;

drop policy if exists "catalog_public_read" on public.catalog_services;
create policy "catalog_public_read" on public.catalog_services
for select to anon, authenticated using (true);

drop policy if exists "catalog_staff_insert" on public.catalog_services;
create policy "catalog_staff_insert" on public.catalog_services
for insert to authenticated with check (
  exists (select 1 from public.admin_users a where a.user_id = auth.uid())
  or exists (select 1 from public.professional_access p where p.user_id = auth.uid() and p.status = 'approved' and p.professional_id = catalog_services.professional_id)
);

drop policy if exists "catalog_staff_update" on public.catalog_services;
create policy "catalog_staff_update" on public.catalog_services
for update to authenticated
using (
  exists (select 1 from public.admin_users a where a.user_id = auth.uid())
  or exists (select 1 from public.professional_access p where p.user_id = auth.uid() and p.status = 'approved' and p.professional_id = catalog_services.professional_id)
)
with check (
  exists (select 1 from public.admin_users a where a.user_id = auth.uid())
  or exists (select 1 from public.professional_access p where p.user_id = auth.uid() and p.status = 'approved' and p.professional_id = catalog_services.professional_id)
);
