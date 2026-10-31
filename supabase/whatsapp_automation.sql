-- Central de atendimento oficial do WhatsApp - LEV Coworking Beauty
-- Execute este arquivo no SQL Editor do projeto Supabase antes de habilitar o webhook da Meta.

create extension if not exists pgcrypto;

create table if not exists public.whatsapp_conversations (
  id uuid primary key default gen_random_uuid(),
  wa_contact_id text not null unique,
  client_phone text not null,
  client_name text not null,
  assigned_professional_id text,
  assigned_professional_name text,
  appointment_id text,
  booking_step text,
  booking_draft jsonb not null default '{}'::jsonb,
  status text not null default 'bot' check (status in ('bot', 'aguardando', 'em_atendimento', 'encerrada')),
  bot_enabled boolean not null default true,
  unread_count integer not null default 0 check (unread_count >= 0),
  last_message text,
  last_message_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.whatsapp_conversations add column if not exists booking_step text;
alter table public.whatsapp_conversations add column if not exists booking_draft jsonb not null default '{}'::jsonb;

create table if not exists public.whatsapp_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.whatsapp_conversations(id) on delete cascade,
  whatsapp_message_id text unique,
  direction text not null check (direction in ('entrada', 'saida')),
  sender_type text not null check (sender_type in ('cliente', 'bot', 'profissional', 'admin', 'sistema')),
  sender_name text not null,
  body text not null,
  message_type text not null default 'text' check (message_type in ('text', 'image', 'audio', 'video', 'document', 'interactive', 'unknown')),
  status text not null default 'pendente' check (status in ('recebida', 'pendente', 'enviada', 'entregue', 'lida', 'falhou')),
  sent_at timestamptz not null default now()
);

create index if not exists whatsapp_conversations_professional_idx
  on public.whatsapp_conversations (assigned_professional_id, last_message_at desc);
create index if not exists whatsapp_messages_conversation_idx
  on public.whatsapp_messages (conversation_id, sent_at);

alter table public.whatsapp_conversations enable row level security;
alter table public.whatsapp_messages enable row level security;

drop policy if exists "Administradores gerenciam conversas" on public.whatsapp_conversations;
create policy "Administradores gerenciam conversas"
  on public.whatsapp_conversations for all to authenticated
  using (exists (select 1 from public.admin_users a where a.user_id = auth.uid()))
  with check (exists (select 1 from public.admin_users a where a.user_id = auth.uid()));

drop policy if exists "Profissionais acessam somente suas conversas" on public.whatsapp_conversations;
create policy "Profissionais acessam somente suas conversas"
  on public.whatsapp_conversations for select to authenticated
  using (exists (
    select 1 from public.professional_access p
    where p.user_id = auth.uid()
      and p.status = 'approved'
      and p.professional_id = whatsapp_conversations.assigned_professional_id
  ));

drop policy if exists "Profissionais atualizam somente suas conversas" on public.whatsapp_conversations;
create policy "Profissionais atualizam somente suas conversas"
  on public.whatsapp_conversations for update to authenticated
  using (exists (
    select 1 from public.professional_access p
    where p.user_id = auth.uid()
      and p.status = 'approved'
      and p.professional_id = whatsapp_conversations.assigned_professional_id
  ))
  with check (exists (
    select 1 from public.professional_access p
    where p.user_id = auth.uid()
      and p.status = 'approved'
      and p.professional_id = whatsapp_conversations.assigned_professional_id
  ));

drop policy if exists "Administradores acessam mensagens" on public.whatsapp_messages;
create policy "Administradores acessam mensagens"
  on public.whatsapp_messages for all to authenticated
  using (exists (select 1 from public.admin_users a where a.user_id = auth.uid()))
  with check (exists (select 1 from public.admin_users a where a.user_id = auth.uid()));

drop policy if exists "Profissionais acessam mensagens atribuídas" on public.whatsapp_messages;
create policy "Profissionais acessam mensagens atribuídas"
  on public.whatsapp_messages for select to authenticated
  using (exists (
    select 1
    from public.whatsapp_conversations c
    join public.professional_access p on p.professional_id = c.assigned_professional_id
    where c.id = whatsapp_messages.conversation_id
      and p.user_id = auth.uid()
      and p.status = 'approved'
  ));

grant select, insert, update, delete on public.whatsapp_conversations to authenticated;
grant select, insert, update, delete on public.whatsapp_messages to authenticated;
