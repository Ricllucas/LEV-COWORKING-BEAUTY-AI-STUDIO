-- Segurança: o site público grava agendamentos SOMENTE pela API da Vercel
-- (/api/appointments/create), que valida serviço, horário, limite por telefone
-- e a verificação anti-robô. A gravação direta pelo navegador ficava aberta e
-- permitia pular todas essas proteções (inclusive criar horários já "confirmados",
-- o que faria o robô de WhatsApp mandar mensagens para qualquer número).
-- A API usa a chave de serviço e não depende desta regra.
drop policy if exists "public_can_create_appointments" on public.appointments;
revoke insert on table public.appointments from anon;
