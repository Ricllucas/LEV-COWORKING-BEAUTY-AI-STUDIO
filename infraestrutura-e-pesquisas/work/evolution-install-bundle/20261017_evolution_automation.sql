-- Executar no SQL Editor antes de habilitar a integração na Vercel.
create table if not exists public.whatsapp_automation_connections (
  professional_id text primary key check (professional_id in ('prof_elisangela','prof_talitha','prof_nayara')),
  enabled boolean not null default false,
  updated_at timestamptz not null default now()
);
create table if not exists public.whatsapp_automation_jobs (
  id uuid primary key default gen_random_uuid(),
  dedupe_key text not null unique,
  appointment_id text not null,
  professional_id text not null references public.whatsapp_automation_connections(professional_id),
  kind text not null check (kind in ('reserva','confirmacao','cancelamento','reagendamento','1dia','1hora')),
  appointment_date text not null, start_time text not null, expected_status text not null,
  status text not null default 'pending' check (status in ('pending','processing','sent','failed','skipped','uncertain')),
  provider_message_id text, error_message text,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create index if not exists whatsapp_automation_pending on public.whatsapp_automation_jobs(created_at) where status = 'pending';
alter table public.whatsapp_automation_connections enable row level security;
alter table public.whatsapp_automation_jobs enable row level security;
revoke all on public.whatsapp_automation_connections, public.whatsapp_automation_jobs from anon, authenticated;
grant all on public.whatsapp_automation_connections, public.whatsapp_automation_jobs to service_role;
insert into public.whatsapp_automation_connections(professional_id) values ('prof_elisangela'),('prof_talitha'),('prof_nayara') on conflict do nothing;

create or replace function public.lev_enqueue_whatsapp(p_key text,p_appointment_id text,p_professional_id text,p_kind text,p_date text,p_time text,p_status text)
returns void language sql security invoker set search_path = public as $$
  insert into whatsapp_automation_jobs(dedupe_key,appointment_id,professional_id,kind,appointment_date,start_time,expected_status)
  select p_key,p_appointment_id,p_professional_id,p_kind,p_date,p_time,p_status
  where exists(select 1 from whatsapp_automation_connections where professional_id=p_professional_id and enabled)
  on conflict(dedupe_key) do update set expected_status=excluded.expected_status,status='pending',updated_at=now()
  where whatsapp_automation_jobs.status in ('pending','skipped');
$$;
create or replace function public.lev_claim_whatsapp(p_limit integer default 2)
returns setof public.whatsapp_automation_jobs language plpgsql security invoker set search_path = public as $$
begin
  update whatsapp_automation_jobs set status='uncertain',error_message='Execução interrompida; revisar antes de repetir.',updated_at=now()
  where status='processing' and updated_at < now() - interval '3 minutes';
  return query
  update whatsapp_automation_jobs j set status='processing',updated_at=now()
  where j.id in (select id from whatsapp_automation_jobs where status='pending' order by created_at limit least(greatest(p_limit,1),2) for update skip locked)
  returning j.*;
end;
$$;
revoke execute on function public.lev_enqueue_whatsapp(text,text,text,text,text,text,text) from public, anon, authenticated;
revoke execute on function public.lev_claim_whatsapp(integer) from public, anon, authenticated;
grant execute on function public.lev_enqueue_whatsapp(text,text,text,text,text,text,text),public.lev_claim_whatsapp(integer) to service_role;

create schema if not exists lev_private;
revoke all on schema lev_private from public,anon,authenticated;

-- A fila é registrada na mesma transação da agenda, inclusive para gravações
-- que não passam pelas funções HTTP. Evita perder notificações após uma reserva.
create or replace function lev_private.whatsapp_appointment_event()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  a jsonb := new.payload;
  previous jsonb;
  event_kind text;
  event_key text;
begin
  if tg_op = 'UPDATE' then previous := old.payload; end if;
  if a->>'clientPhone' is null or a->>'professionalId' is null then return new; end if;
  if not exists (select 1 from public.whatsapp_automation_connections where professional_id=a->>'professionalId' and enabled) then return new; end if;
  begin
    if ((a->>'date') || 'T' || (a->>'startTime') || ':00-03:00')::timestamptz <= now() then return new; end if;
  exception when invalid_datetime_format or datetime_field_overflow then return new;
  end;
  if tg_op='INSERT' then
    if a->>'status'='confirmado' then event_kind:='confirmacao';
    elsif a->>'status'='aguardando_confirmacao' then event_kind:='reserva';
    else return new; end if;
  elsif a->>'status' like 'cancelado%' and a->>'status' is distinct from previous->>'status' then event_kind:='cancelamento';
  elsif a->>'status' in ('confirmado','reagendado','aguardando_confirmacao') and
    (a->>'date' is distinct from previous->>'date' or a->>'startTime' is distinct from previous->>'startTime') then event_kind:='reagendamento';
  elsif a->>'status'='confirmado' and a->>'status' is distinct from previous->>'status' then event_kind:='confirmacao';
  else return new; end if;
  event_key:=md5(concat_ws('|',new.id,a->>'professionalId',event_kind,a->>'date',a->>'startTime',a->>'status',a->>'clientPhone'));
  perform public.lev_enqueue_whatsapp(event_key,new.id,a->>'professionalId',event_kind,a->>'date',a->>'startTime',a->>'status');
  return new;
end;
$$;
drop trigger if exists lev_whatsapp_appointment_event on public.appointments;
create trigger lev_whatsapp_appointment_event after insert or update on public.appointments
for each row execute function lev_private.whatsapp_appointment_event();
revoke execute on function lev_private.whatsapp_appointment_event() from public,anon,authenticated;
