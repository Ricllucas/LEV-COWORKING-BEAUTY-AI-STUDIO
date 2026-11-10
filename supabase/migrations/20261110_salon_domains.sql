-- Multi-salão, Fase 4 / Tarefa 4.1: endereço de cada salão.
--
-- Compatível com o código antigo: a coluna nova tem valor padrão (lista vazia).
-- Pode ser executada mais de uma vez sem erro. Sem blocos "do $$".
--
-- salons.domains: domínios próprios do salão, em minúsculas e sem "www."
--   (ex.: '{salaobonito.com.br}'). O subdomínio do produto (<slug>.<domínio>)
--   não precisa ser cadastrado aqui: ele usa a coluna slug.
-- salon_for_address: o site (sem login) e o servidor descobrem o salão pelo
--   endereço. Devolve só o id, e só quando exatamente um salão ativo combina.

alter table public.salons add column if not exists domains text[] not null default '{}';

alter table public.salons drop constraint if exists salons_domains_format_check;
alter table public.salons add constraint salons_domains_format_check
  check (array_to_string(domains, ' ') = lower(array_to_string(domains, ' '))
         and (' ' || array_to_string(domains, ' ')) !~ ' www\.');

create index if not exists salons_domains_idx on public.salons using gin (domains);

create or replace function public.salon_for_address(p_slug text, p_domain text)
returns text
language sql
stable
security definer
set search_path = public
as $$
  select case when count(*) = 1 then min(id) end
    from public.salons
   where status not in ('inativo', 'bloqueado')
     and ((p_slug is not null and slug = p_slug)
       or (p_domain is not null and p_domain = any(domains)));
$$;

revoke all on function public.salon_for_address(text, text) from public;
grant execute on function public.salon_for_address(text, text) to anon, authenticated, service_role;

-- Verificação (rodar depois):
-- select public.salon_for_address('lev', null);            -- 'lev'
-- select public.salon_for_address(null, 'nao-existe.com'); -- null
-- select public.salon_for_address('demo', null);           -- 'demo' (status 'teste')
