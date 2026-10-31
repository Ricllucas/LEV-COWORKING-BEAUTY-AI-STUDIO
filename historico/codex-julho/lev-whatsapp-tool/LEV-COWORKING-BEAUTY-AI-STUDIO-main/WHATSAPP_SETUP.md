# Central WhatsApp LEV

## Componentes

- `api/whatsapp/webhook`: recebe mensagens e confirmações de entrega da Meta.
- `api/whatsapp/send`: envia respostas autenticadas do painel administrativo/profissional.
- `api/whatsapp/appointment`: envia o modelo de confirmação quando recebe um webhook de novo agendamento.
- `supabase/whatsapp_automation.sql`: cria conversas, mensagens e as políticas que isolam cada profissional.

## Ativação

1. Execute `supabase/whatsapp_automation.sql` no SQL Editor do Supabase.
2. Cadastre na Vercel todas as variáveis de `.env.example`.
3. Na Meta, configure o webhook como `https://lev-coworking-beauty.vercel.app/api/whatsapp/webhook` e assine o campo `messages`.
4. Crie e aprove o modelo `confirmacao_agendamento_lev` em português do Brasil com cinco variáveis: cliente, serviço, profissional, data e horário.
5. No Supabase, crie um Database Webhook para `INSERT` em `appointments`, apontando para `https://lev-coworking-beauty.vercel.app/api/whatsapp/appointment` e envie o cabeçalho `x-automation-secret` com o mesmo valor de `WHATSAPP_AUTOMATION_SECRET`.

Tokens da Meta e a chave `service_role` são segredos de servidor e jamais devem ser colocados em arquivos públicos ou em variáveis iniciadas por `VITE_`.
