# 📱 Automação WhatsApp Completa - LEV Coworking Beauty

## 🎯 O Que Funciona

✅ **Confirmação automática** - Cliente recebe confirmação personalizada por profissional  
✅ **Lembretes automáticos** - 1 dia antes + 1 hora antes do agendamento  
✅ **Mensagens humanizadas** - Cada profissional tem seu tom e estilo  
✅ **Interação bidirecional** - Clientes podem cancelar, remarcar e tirar dúvidas  
✅ **Roteamento inteligente** - Cliente escolhe profissional ou sistema escolhe  
✅ **Notificação às profissionais** - Aviso quando novo cliente chega

---

## 📋 Fluxo Completo de Mensagens

### 1️⃣ Cliente Realiza Agendamento

```
CLIENTE                                 APP LEV
                    Preenche formulário
                    Confirma agendamento
                             ↓
                    Salva no banco dados
                             ↓
                    Dispara confirmação WhatsApp
                             ↓
RECEBE CONFIRMAÇÃO ←─────────────────
(Personalizada)
```

**Exemplo de Confirmação (Elisangela):**
```
✨ Oi Maria!

Que alegria saber que você escolheu nosso espaço! 💅

Seu agendamento foi CONFIRMADO com toda carinho:

📅 Data: 15 de agosto de 2026
⏰ Horário: 14:00
💆‍♀️ Serviço: Manicure Tradicional
💰 Valor: R$ 45,00

Vou estar aqui especialmente para deixar suas unhas IMPECÁVEIS! 
Você vai sair daqui sentindo-se RAINHA! 👑

Beijos e até lá! 💋
Elisangela ✨
```

---

### 2️⃣ Lembretes Automáticos

**1 dia antes (10:00 AM):**
```
🌟 E aí, Maria?

Só um carinho lembrando que amanhã você vem para transformar essas unhas! 💅✨

⏰ Não esqueça: 14:00 em ponto!

Prepare-se para sair daqui se sentindo uma DEUSA! Vai ser lindo demais! 🔥

Beijos! 💋
Elisangela
```

**1 hora antes:**
```
⏰ Olha o reloginho! ⏰

Você tem 1 HORA para chegar aqui! Nos vemos logo! 💅✨

Já estou aqui me preparando para deixar você LINDA DEMAIS!

Beijoss! 💋
Elisangela
```

---

### 3️⃣ Cliente Interage (Responde com Dúvidas)

**Cliente:** "Posso desmarcar?"

**Resposta Automática:**
```
Entendi que você gostaria de cancelar seu agendamento. 💔

Para cancelar com segurança, você precisa:
1. Nos avisar com NO MÍNIMO 24 horas de antecedência
2. Fazer isso por aqui via WhatsApp

Qual é o agendamento que você gostaria de cancelar? 
Envie a data e horário, por favor!

Estamos aqui para te ajudar! ✨
```

---

### 4️⃣ Cliente Escolhe Profissional

**Cliente (primeira mensagem):** "Olá"

**Bot responde:**
```
Oi, Maria! Bem-vinda ao LEV Coworking Beauty! 💅✨

COM QUEM VOCÊ DESEJA CONVERSAR?
1️⃣ Elisangela — Unhas impecáveis (Manicure, Pedicure, SPA)
2️⃣ Talitha — Maquiagem, Penteados & Sobrancelhas
3️⃣ Nayara — Unhas em Gel Lindíssimas

Responda com o número ou com o nome! 😊
```

**Cliente:** "Talitha"

**Bot notifica profissional:**
```
📱 Nova cliente esperando!

👤 Maria Silva
💬 "Talitha"

Responda quando estiver disponível! ✨
```

**Bot confirma para cliente:**
```
Oi, Maria! Que alegria saber que você quer falar com Talitha!

Talitha continuará a conversa por aqui assim que estiver disponível. 
Enquanto isso, você pode me tirar qualquer dúvida! 😊

Estamos aqui para deixar você linda! ✨
```

---

## 🛠️ Tecnologia por Trás

### Arquivos de Implementação

```
api/_lib/
├── whatsappTemplates.ts      ← Templates por profissional
├── whatsappService.ts        ← Serviço de envio/recebimento
└── reminderScheduler.ts      ← Sistema de lembretes

api/whatsapp/
├── webhook.ts                ← Recebe mensagens (ATUALIZADO)
└── send.ts                   ← Envia mensagens

api/appointments/
└── create.ts                 ← Dispara confirmação
```

### Fluxo de Dados

```
CLIENT ENVIA MENSAGEM
        ↓
WEBHOOK RECEBE
        ↓
VALIDAR ASSINATURA (Meta)
        ↓
PROCESSAR MENSAGEM
        ↓
IDENTIFICAR TIPO (cancelar/remarcar/dúvida/etc)
        ↓
RESPONDER AUTOMATICAMENTE
        ↓
NOTIFICAR PROFISSIONAL
        ↓
REGISTRAR NO BANCO
```

---

## 📝 Templates Personalizados

Cada profissional tem **6 tipos de mensagem**:

### 1. **Confirmação** - Após agendamento
### 2. **Lembrete 1 Dia** - 1 dia antes, 10:00 AM
### 3. **Lembrete 1 Hora** - 1 hora antes
### 4. **Obrigada** - Após conclusão do serviço
### 5. **Atraso** - Se cliente não aparecer na hora
### 6. **Cancelamento** - Se cliente cancela

**Exemplo: Talitha (Maquiagem)**

```typescript
prof_talitha: {
  confirmacao: `✨ Olá {{clientName}}!
  
Que EMOÇÃO saber que você confia em mim para sua transformação! 💄✨
...`
}
```

---

## 🔄 Lembretes Agendados

### Como Funciona

```
AGENDAMENTO CRIADO
        ↓
CALCULAR HORÁRIOS
  ├─ 1 dia antes @ 10:00
  └─ 1 hora antes
        ↓
ARMAZENAR NA FILA
        ↓
VERIFICAR A CADA MINUTO
        ↓
HORA CHEGOU?
  ├─ SIM: Enviar mensagem
  ├─ NÃO: Aguardar
  └─ ENVIADO: Remover da fila
```

### Em Produção

Use **cron job** (node-cron ou Vercel Crons):

```javascript
// Executar a cada minuto
schedule.scheduleJob('* * * * *', async () => {
  const reminders = await reminderScheduler.processReminders(appointments);
  console.log(`Sent ${reminders.sent} reminders`);
});
```

---

## 📞 Número Oficial

### (41) 98497-9940

**Todas as mensagens vêm dessa número**, mas parecem das profissionais:

```
"Elisangela ✨" ← Assinatura
"Talitha 💄"     ← Assinatura  
"Nayara 💅"      ← Assinatura
```

**Cliente pensa:** "Estou conversando com Elisangela"  
**Realidade:** Mensagens do sistema com tom pessoal

---

## 🚀 Como Configurar

### Passo 1: Criar Conta WhatsApp Business

```bash
1. Acesse https://business.facebook.com
2. Crie conta WhatsApp Business
3. Configure seu número: (41) 98497-9940
4. Gere credenciais:
   - WHATSAPP_ACCESS_TOKEN
   - WHATSAPP_PHONE_NUMBER_ID
   - WHATSAPP_APP_SECRET
   - WHATSAPP_VERIFY_TOKEN
```

### Passo 2: Configurar Webhook

```bash
1. Vá em configurações do app
2. Webhook URL: https://seu-app.vercel.app/api/whatsapp/webhook
3. Verify Token: (qualquer string segura)
4. Subscribe a eventos: messages, message_status
```

### Passo 3: Adicionar ao .env no Vercel

```
WHATSAPP_ACCESS_TOKEN=EAAG...
WHATSAPP_PHONE_NUMBER_ID=123456789
WHATSAPP_APP_SECRET=abc123def456
WHATSAPP_VERIFY_TOKEN=verify_token_123
```

### Passo 4: Números das Profissionais (opcional)

Para notificações diretas às profissionais:

```env
ELISANGELA_PHONE=5511971112233
TALITHA_PHONE=5511972223344
NAYARA_PHONE=5511973334455
```

---

## 🎯 Mensagens Cativantes

### Princípios de Design

✅ **Personalização** - Use nome do cliente  
✅ **Emojis** - Deixa mais humanizado e alegre  
✅ **Tom amigável** - Não é robô, é amiga  
✅ **Valor** - Mostra benefícios/cuidados  
✅ **Chamada à ação** - "Me avisa!", "Volta sempre!"  
✅ **Saudações** - Beijos, abraços, carinho

### Exemplos Cativantes

**Elisangela (Unhas - Tradicional):**
```
👑 Você vai sair daqui sentindo-se RAINHA!
🔥 Vai ser lindo demais!
💋 Beijos!
```

**Talitha (Maquiagem - Glamourosa):**
```
💄 Você vai brilhar!
✨ Estou super ansiosa para criar a melhor versão de você!
🌟 Beijos de luz!
```

**Nayara (Unhas Gel - Moderna):**
```
🔥 Você vai se apaixonar!
💅✨ Vamos criar algo LINDÍSSIMO!
💚 Um abraço gigante!
```

---

## 📊 Métricas de Sucesso

### O Que Medir

- **Taxa de entrega** - Mensagens que chegaram com sucesso
- **Taxa de leitura** - Clientes que leram a mensagem
- **Taxa de resposta** - Clientes que responderam
- **Taxa de rescheduling** - Clientes que remarcaram
- **Satisfação** - Feedback positivo dos clientes

### Dashboard de Monitoramento

```sql
SELECT 
  professional_id,
  COUNT(*) as total_messages,
  SUM(CASE WHEN status = 'lida' THEN 1 ELSE 0 END) as read_count,
  SUM(CASE WHEN status = 'lida' THEN 1 ELSE 0 END) * 100.0 / COUNT(*) as read_rate
FROM whatsapp_messages
GROUP BY professional_id;
```

---

## ✅ Checklist de Setup

- [ ] Conta WhatsApp Business criada
- [ ] Número (41) 98497-9940 verificado
- [ ] Credenciais geradas
- [ ] Webhook URL configurado
- [ ] Variáveis de ambiente no Vercel
- [ ] Teste: Agendar serviço via app
- [ ] Verificar: Confirmação chegou no WhatsApp
- [ ] Teste: Cliente responde com "sim" ou "não"
- [ ] Verificar: Bot responde inteligentemente
- [ ] Validar: Mensagens são cativantes

---

## 🐛 Troubleshooting

### "Confirmação não chegou"
```
✓ Verificar WHATSAPP_ACCESS_TOKEN válido
✓ Verificar WHATSAPP_PHONE_NUMBER_ID correto
✓ Verificar número do cliente tem country code (+55)
✓ Testar número no WhatsApp manualmente
```

### "Webhook não recebe mensagens"
```
✓ Verificar URL do webhook está correta
✓ Verificar token de verificação está configurado
✓ Verificar logs do Vercel (Functions)
✓ Testar webhook GET (deve retornar challenge)
```

### "Lembretes não chegam"
```
✓ Aguardar até a hora (sistema processa cada minuto)
✓ Verificar agendamento tem status 'confirmado'
✓ Verificar número do cliente está correto
✓ Verificar logs: `reminderScheduler.processReminders()`
```

---

## 🔐 Segurança

### O Que Está Protegido

- ✅ Validação de assinatura Meta (HMAC-SHA256)
- ✅ Variáveis de ambiente não expostas
- ✅ Mensagens salvas no banco de dados
- ✅ Rastreamento de status de entrega

### Boas Práticas

- Nunca commitar credenciais
- Rotacionar tokens periodicamente
- Usar HTTPS apenas
- Testar webhook com ferramentas como Postman

---

**Status**: 🟢 **COMPLETO E PRONTO PARA PRODUÇÃO**  
**Data de Implementação**: 2026-08-01  
**Próxima Revisão**: 2026-09-01
