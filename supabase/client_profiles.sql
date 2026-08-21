create table if not exists public.client_profiles (
  id text primary key,
  phone_digits text not null unique,
  professional_id text,
  payload jsonb not null default '{}'::jsonb,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists client_profiles_professional_id_idx
  on public.client_profiles (professional_id);

alter table public.client_profiles enable row level security;

