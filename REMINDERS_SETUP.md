# 📱 Sistema de Lembretes Automáticos via WhatsApp - Setup Completo

## 🎯 Resumo da Solução Implementada

Seu projeto LEV Coworking agora tem **automação de lembretes via WhatsApp** usando Vercel Cron Jobs. O sistema:

✅ Envia lembrete **1 dia antes** do agendamento  
✅ Envia lembrete **1 hora antes** do agendamento  
✅ Usa templates personalizados por profissional  
✅ Registra todos os envios no banco de dados  
✅ Executa a cada **5 minutos** automaticamente  

---

## 📋 Arquivos Criados/Modificados

### 1. **Banco de Dados** - `supabase/reminders_tracking.sql`
- Adiciona coluna `reminders_sent` aos agendamentos
- Cria tabela `reminder_history` para auditoria
- Implementa RLS (Row Level Security)

### 2. **Endpoint Cron** - `api/cron/send-reminders.ts`
- Busca agendamentos próximos
- Verifica se lembrete já foi enviado
- Envia mensagem WhatsApp com template
- Registra sucesso/falha no banco

### 3. **Configuração Vercel** - `vercel.json`
```json
{
  "crons": [
    {
      "path": "/api/cron/send-reminders",
      "schedule": "*/5 * * * *"
    }
  ]
}
```

### 4. **Variáveis de Ambiente** - `.env.example`
```
CRON_SECRET=your_random_cron_secret_here
```

---

## 🚀 Como Implementar (Passo a Passo)

### Passo 1: Executar Migração SQL no Supabase ⭐ IMPORTANTE

1. Acesse seu dashboard Supabase: https://supabase.com
2. Selecione seu projeto LEV Coworking
3. Vá para **SQL Editor** → **New Query**
4. Copie o conteúdo de `supabase/reminders_tracking.sql`
5. Cole na query e clique **Run**

```sql
-- Verificar se funcionou:
SELECT * FROM reminder_history LIMIT 1;
```

### Passo 2: Gerar Secret para Cron Job

```bash
# No seu terminal, gere um token seguro:
openssl rand -hex 32
# Resultado: abc123def456...
```

### Passo 3: Configurar Variáveis em Vercel

1. Acesse Vercel: https://vercel.com
2. Selecione seu projeto **LEV Coworking**
3. Vá para **Settings** → **Environment Variables**
4. Adicione:
   - **Nome**: `CRON_SECRET`
   - **Valor**: Cole o token gerado no Passo 2
   - **Ambiente**: Production (e Preview se quiser testar)
5. Clique **Save**

### Passo 4: Deploy da Nova Código

```bash
# No seu repositório local:
git add api/cron/ supabase/reminders_tracking.sql vercel.json .env.example
git commit -m "feat: Add WhatsApp reminder automation with Vercel Cron

- Implement cron endpoint for sending reminders 1 day and 1 hour before
- Add reminder history tracking in Supabase
- Configure Vercel to run every 5 minutes
- Support for professional-specific templates"

git push origin main
```

O Vercel fará deploy automaticamente.

### Passo 5: Verificar Configuração

Aguarde 2-5 minutos após o deploy, depois:

1. Acesse seu dashboard Vercel
2. Vá para **Functions** → **Crons**
3. Procure por `/api/cron/send-reminders`
4. Clique na função para ver logs

Você deverá ver algo como:
```
[REMINDER CRON] Iniciando envio de lembretes...
[REMINDER CRON] 5 agendamentos encontrados
[REMINDER CRON] Lembrete 1 dia enviado para Maria Silva
[REMINDER CRON] Resultado: { sent: { '1dia': 1, '1hora': 0, total: 1 }, failed: 0 }
```

---

## 🧪 Como Testar Localmente

### Teste 1: Chamar o Endpoint Manualmente

```bash
# Terminal (PowerShell ou Bash):
curl -X POST https://seu-app.vercel.app/api/cron/send-reminders \
  -H "Authorization: Bearer seu_cron_secret_aqui"
```

Resultado esperado:
```json
{
  "success": true,
  "timestamp": "2026-09-12T15:30:00.000Z",
  "sent": {
    "1dia": 2,
    "1hora": 1,
    "total": 3
  },
  "failed": 0,
  "appointments_checked": 10
}
```

### Teste 2: Criar Agendamento de Teste

1. Vá para seu site LEV Coworking
2. Marque um agendamento para **hoje + 1 dia exato** (26h atrás)
3. Aguarde 5 minutos (proxima execução do cron)
4. Cliente deve receber mensagem no WhatsApp

### Teste 3: Verificar Histórico no Banco

```sql
-- No SQL Editor do Supabase:
SELECT * FROM reminder_history 
ORDER BY created_at DESC 
LIMIT 10;
```

Você verá registros como:
```
| appointment_id | reminder_type | success | error_message |
|---|---|---|---|
| apt_123 | 1dia | true | NULL |
| apt_124 | 1hora | true | NULL |
```

---

## 🔧 Troubleshooting

### Problema: Lembretes não estão sendo enviados

**Checklist:**

1. ✅ Migration SQL executada no Supabase?
   ```sql
   SELECT column_name FROM information_schema.columns 
   WHERE table_name='appointments' AND column_name='reminders_sent';
   ```

2. ✅ CRON_SECRET configurado em Vercel?
   - Settings → Environment Variables → procure por CRON_SECRET

3. ✅ Deploy executado após atualizar code?
   - Vercel → Deployments → últimas 3 devem mostrar sucesso

4. ✅ Agendamentos têm dados corretos?
   ```sql
   SELECT id, client_phone, appointment_date, reminders_sent FROM appointments 
   LIMIT 5;
   ```

5. ✅ WhatsApp configurado corretamente?
   - Teste enviando mensagem manual via painel admin

### Problema: Erro de autenticação no cron

**Solução:**
```
# Verifique as variáveis em Vercel:
WHATSAPP_ACCESS_TOKEN=EAAG...  ✅ Válido?
WHATSAPP_PHONE_NUMBER_ID=12345  ✅ Correto?
SUPABASE_SERVICE_ROLE_KEY=eyJ...  ✅ Não expirou?
```

### Problema: Função cron não aparece em Vercel

**Solução:**
1. Verificar `vercel.json`:
   ```json
   {
     "crons": [
       {
         "path": "/api/cron/send-reminders",
         "schedule": "*/5 * * * *"
       }
     ]
   }
   ```
2. Redeployar: `git push origin main` novamente

---

## 📊 Monitorar em Produção

### Logs do Vercel

```
Vercel Dashboard → seu-projeto → Functions → Logs
```

Procure por `[REMINDER CRON]` para filtrar mensagens do sistema.

### Histórico no Supabase

```sql
-- Lembretes enviados hoje:
SELECT * FROM reminder_history 
WHERE created_at > now() - interval '24 hours'
ORDER BY created_at DESC;

-- Taxa de sucesso:
SELECT 
  reminder_type,
  COUNT(*) as total,
  SUM(CASE WHEN success THEN 1 ELSE 0 END) as sucesso,
  ROUND(100.0 * SUM(CASE WHEN success THEN 1 ELSE 0 END) / COUNT(*), 2) as taxa_sucesso
FROM reminder_history
WHERE created_at > now() - interval '7 days'
GROUP BY reminder_type;
```

### Verificar Agendamentos Próximos

```sql
-- Próximas 48 horas:
SELECT 
  id,
  client_name,
  client_phone,
  appointment_date,
  start_time,
  reminders_sent,
  (reminders_sent->>'1dia')::boolean as lembrete_1_dia_enviado
FROM appointments
WHERE appointment_date >= CURRENT_DATE
  AND appointment_date <= CURRENT_DATE + interval '2 days'
ORDER BY appointment_date, start_time;
```

---

## 🎯 Checklist de Implementação

- [ ] Executar `supabase/reminders_tracking.sql` no Supabase
- [ ] Gerar CRON_SECRET com `openssl rand -hex 32`
- [ ] Configurar CRON_SECRET em Vercel Environment Variables
- [ ] Push do código para main (git push origin main)
- [ ] Aguardar deploy completar (~3 minutos)
- [ ] Verificar logs em Vercel → Functions
- [ ] Testar com agendamento próximo
- [ ] Verificar histórico em `reminder_history`
- [ ] Documentar em seu time

---

## ❓ Perguntas Frequentes

**P: Posso mudar a frequência de 5 minutos?**
R: Sim, edite `vercel.json`:
```json
"schedule": "*/10 * * * *"  // A cada 10 minutos
"schedule": "0 10 * * *"    // Diariamente 10:00 AM (UTC)
```

**P: E se o cliente não quer receber lembretes?**
R: Adicione campo `receive_reminders` no banco e filtre na query.

**P: Posso testar sem colocar em produção?**
R: Sim, chame o endpoint manualmente:
```bash
curl https://seu-app.vercel.app/api/cron/send-reminders \
  -H "Authorization: Bearer seu_secret"
```

**P: Quantas mensagens WhatsApp vou usar?**
R: Depende dos agendamentos. Estimativa: 2 lembretes × agendamentos/dia = ~60/mês

**P: E se WhatsApp falhar?**
R: Sistema registra em `reminder_history` com `success=false` e `error_message`. Você pode reprocessar após.

**P: Como cancelar lembretes se cliente desmarcar?**
R: Adicione lógica em `api/appointments/cancel.ts` para resetar:
```typescript
reminders_sent: { '1dia': false, '1hora': false }
```

---

## 📞 Suporte

Se encontrar problemas:

1. **Verificar logs**: Vercel → Functions → Logs
2. **Verificar banco**: SQL Editor do Supabase
3. **Testar endpoint**: curl manual
4. **Verificar credenciais**: .env em Vercel está correto?

Documento atualizado em: **2026-09-12**  
Versão: **1.0**
