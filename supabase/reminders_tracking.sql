-- Tabela para rastrear lembretes enviados
-- Execute este arquivo no SQL Editor do Supabase para ativar o sistema de lembretes automáticos

-- Adicionar coluna à tabela de agendamentos (se não existir)
ALTER TABLE public.appointments
ADD COLUMN IF NOT EXISTS reminders_sent JSONB DEFAULT '{"1dia": false, "1hora": false, "confirmacao": false}'::jsonb;

-- Tabela de histórico de lembretes
CREATE TABLE IF NOT EXISTS public.reminder_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id TEXT NOT NULL,
  reminder_type TEXT NOT NULL CHECK (reminder_type IN ('1dia', '1hora', 'confirmacao')),
  sent_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  success BOOLEAN NOT NULL DEFAULT true,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS reminder_history_appointment_idx
  ON public.reminder_history (appointment_id, reminder_type);

CREATE INDEX IF NOT EXISTS reminder_history_sent_at_idx
  ON public.reminder_history (sent_at DESC);

-- RLS: Apenas admin pode ver histórico de lembretes
ALTER TABLE public.reminder_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admin acessa histórico de lembretes" ON public.reminder_history;
CREATE POLICY "Admin acessa histórico de lembretes"
  ON public.reminder_history FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.admin_users a WHERE a.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.admin_users a WHERE a.user_id = auth.uid()));

GRANT SELECT, INSERT ON public.reminder_history TO authenticated;
