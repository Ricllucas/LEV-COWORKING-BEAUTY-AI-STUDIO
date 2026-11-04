-- Multi-salão, Fase 1 / Tarefa 1.5: remove a regra antiga "um telefone por
-- cliente no sistema inteiro" (único só em phone_digits).
--
-- Rodar este arquivo só alguns dias depois de o código novo estar no ar e quando
-- não houver chance de voltar o site para a versão antiga (o código antigo faz
-- upsert com on_conflict=phone_digits e quebraria).
--
-- ATENÇÃO: rodar SOMENTE depois que o código da Tarefa 1.5 estiver no ar em
-- produção. O código antigo faz upsert com on_conflict=phone_digits e QUEBRA
-- sem esta regra. O código novo usa on_conflict=salon_id,phone_digits, que
-- depende de client_profiles_salon_phone_key (criada em 20261104_salons.sql).
--
-- O que faz: procura em pg_constraint a restrição ÚNICA de client_profiles
-- cujas colunas são exatamente (phone_digits) e a remove. Nunca remove
-- client_profiles_salon_phone_key, nem chave primária.
-- Pode ser executada mais de uma vez sem erro (idempotente).

begin;

do $$
declare
  old_constraint record;
  phone_attnum smallint;
begin
  if to_regclass('public.client_profiles') is null then
    return;
  end if;

  -- Segurança: sem a regra nova, não remove a antiga.
  if not exists (
    select 1 from pg_constraint
    where conname = 'client_profiles_salon_phone_key'
      and conrelid = 'public.client_profiles'::regclass
  ) then
    raise exception 'client_profiles_salon_phone_key não existe: rode 20261104_salons.sql antes.';
  end if;

  select attnum into phone_attnum
  from pg_attribute
  where attrelid = 'public.client_profiles'::regclass
    and attname = 'phone_digits'
    and not attisdropped;

  if phone_attnum is null then
    return;
  end if;

  for old_constraint in
    select conname
    from pg_constraint
    where conrelid = 'public.client_profiles'::regclass
      and contype = 'u'
      and conkey = array[phone_attnum]
      and conname <> 'client_profiles_salon_phone_key'
  loop
    execute format('alter table public.client_profiles drop constraint %I', old_constraint.conname);
    raise notice 'Removida a restrição antiga %', old_constraint.conname;
  end loop;
end
$$;

-- Faz o PostgREST reler o esquema do banco.
notify pgrst, 'reload schema';

commit;

-- ============================================================================
-- VERIFICAÇÃO (rodar à mão no SQL Editor depois da migração; não faz parte dela)
-- ============================================================================
-- -- Esperado: só client_profiles_salon_phone_key (e a chave primária, se houver)
-- select conname, contype, pg_get_constraintdef(oid) from pg_constraint
--  where conrelid = 'public.client_profiles'::regclass and contype in ('u', 'p');
--
-- -- Esperado: nenhum índice único só em phone_digits (se aparecer um, ele foi
-- -- criado como índice e não como restrição; avisar antes de remover à mão)
-- select indexname, indexdef from pg_indexes
--  where schemaname = 'public' and tablename = 'client_profiles' and indexdef ilike '%unique%';
--
-- -- Prova de que o mesmo telefone pode existir em dois salões (desfaz tudo no fim).
-- -- Esperado: sem erro
-- begin;
-- insert into public.salons (id, slug, name, status)
--   values ('teste-tel', 'teste-tel', 'Teste telefone', 'inativo');
-- insert into public.client_profiles (id, phone_digits, salon_id, payload)
--   select 'cli_teste-tel_' || phone_digits, phone_digits, 'teste-tel', payload
--   from public.client_profiles where salon_id = 'lev' limit 1;
-- rollback;
