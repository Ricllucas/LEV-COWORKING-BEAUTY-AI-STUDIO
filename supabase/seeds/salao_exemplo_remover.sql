-- Apaga só o salão de exemplo (Studio Aurora, id 'demo'). Pedir aprovação da dona antes de rodar.
--
-- Remove as linhas com salon_id = 'demo' em todas as tabelas que têm salon_id e,
-- por último, a linha de public.salons. Não mexe em nenhum outro salão.
-- Pode ser executado mais de uma vez sem erro.

delete from public.audit_logs            where salon_id = 'demo';
delete from public.waitlist              where salon_id = 'demo';
delete from public.schedule_blocks       where salon_id = 'demo';
delete from public.payments              where salon_id = 'demo';
delete from public.professional_private  where salon_id = 'demo';
delete from public.professionals         where salon_id = 'demo';
delete from public.salon_settings        where salon_id = 'demo';
delete from public.catalog_services      where salon_id = 'demo';
delete from public.reminder_history      where salon_id = 'demo';
delete from public.whatsapp_messages     where salon_id = 'demo';
delete from public.whatsapp_conversations where salon_id = 'demo';
delete from public.appointments          where salon_id = 'demo';
delete from public.client_profiles       where salon_id = 'demo';
delete from public.professional_access   where salon_id = 'demo';
delete from public.admin_users           where salon_id = 'demo';

delete from public.salons where id = 'demo';

-- Conferência (esperado: 0 linhas)
-- select id from public.salons where id = 'demo';
