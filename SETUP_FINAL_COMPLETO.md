# 🚀 SETUP COMPLETO - LEV Coworking Beauty

## ✅ Você vai fazer em 15 minutos:

```
PASSO 1: Copiar 4 credenciais da Meta (5 min)
         ↓
PASSO 2: Me enviar as credenciais aqui (1 min)
         ↓
PASSO 3: Eu configuro no Vercel (2 min)
         ↓
PASSO 4: Testar tudo (5 min)
         ↓
PRONTO! Automação WhatsApp 100% funcional 🎉
```

---

## 📋 PASSO 1: Copiar Credenciais da Meta (5 min)

**Abra:** [SETUP_CREDENCIAIS_META.md](SETUP_CREDENCIAIS_META.md)

Siga exatamente as instruções de **onde encontrar cada uma das 4 credenciais:**

1. ✅ `WHATSAPP_ACCESS_TOKEN` (começa com EAAG)
2. ✅ `WHATSAPP_PHONE_NUMBER_ID` (números)
3. ✅ `WHATSAPP_APP_SECRET` (string aleatória)
4. ✅ `WHATSAPP_VERIFY_TOKEN` (você cria)

**Tempo:** ~5 minutos navegando Meta Business Suite

---

## 📧 PASSO 2: Me Enviar as Credenciais (1 min)

Quando tiver todas as 4, responda nessa conversa com:

```
✅ PRONTO! Aqui estão as credenciais:

ACCESS_TOKEN: EAAG5ZAw4ZC8BAIaZAgZCZAjm5ZBnGw...
PHONE_NUMBER_ID: 1234567890
APP_SECRET: abc123def456ghi789jkl012mno345pqr
VERIFY_TOKEN: MySecureToken_2026_LEV_xyz789_Beauty!
```

⚠️ **Segurança:**
- Estas são suas credenciais de produção
- Eu vou usar apenas para configurar
- Vou apagar esse arquivo após configurar
- Nunca vão ser commitadas no Git

---

## 🔧 PASSO 3: Eu Configuro no Vercel (2 min)

Quando você me enviar, eu vou:

✅ **1. Adicionar no `.env.example`**
```env
WHATSAPP_ACCESS_TOKEN=sua_credencial_aqui
WHATSAPP_PHONE_NUMBER_ID=sua_credencial_aqui
WHATSAPP_APP_SECRET=sua_credencial_aqui
WHATSAPP_VERIFY_TOKEN=sua_credencial_aqui
```

✅ **2. Configurar no Vercel**
```
Project Settings > Environment Variables
Adicionar 4 variáveis
```

✅ **3. Fazer Deploy**
```
git push origin main
Vercel detecta e faz deploy automático
```

✅ **4. Validar**
```
npx tsx scripts/validate-whatsapp.ts
```

---

## 🧪 PASSO 4: Testar Tudo (5 min)

### Teste 1: Validar Configuração
```bash
npx tsx scripts/validate-whatsapp.ts
```

**Esperado:**
```
✅ Variáveis de ambiente OK
✅ Credenciais válidas
✅ API conectada
✅ Webhook pronto
✅ TUDO CONFIGURADO E FUNCIONAL!
```

### Teste 2: Testar Envio Real
```bash
# Substitua pelo seu número
npx tsx scripts/validate-whatsapp.ts 5585999999999
```

**Você vai:**
1. Rodar o comando
2. Aguardar 3-5 segundos
3. Receber mensagem no WhatsApp: "Teste de integração LEV Coworking Beauty"

### Teste 3: Testar Agendamento Completo
```
1. Abra http://seu-app.vercel.app
2. Faça um agendamento de teste
3. Verifique se confirmação chegou no WhatsApp
4. Responda com uma mensagem qualquer
5. Bot deve responder inteligentemente
```

---

## 🎯 Resumo Visual

```
META BUSINESS SUITE                VERCEL                    SEU APP
    ↓                                ↓                          ↓
[Copiar 4                        [Adicionar 4              [Agendamento]
 credenciais]   ────────────→    variáveis]  ────────→    [Confirmação
                                                        WhatsApp automática]
Seu número:
(41) 98497-9940
Status: ✅ Verificado
```

---

## ⚡ Comandos Rápidos

### Setup Automático (Alternativa)

Se preferir, posso criar um script que faz tudo:

**Windows (PowerShell):**
```powershell
powershell -ExecutionPolicy Bypass -File scripts/setup-vercel.ps1
```

**Mac/Linux (Bash):**
```bash
bash scripts/setup-vercel.sh
```

Você vai:
1. Cole as 4 credenciais
2. Script configura tudo no Vercel
3. Script faz redeploy
4. PRONTO!

---

## ✅ Checklist Final

### Antes de me enviar as credenciais:
- [ ] Verifiquei que número está verificado na Meta (verde)
- [ ] Copiei as 4 credenciais com cuidado
- [ ] Verifiquei que não têm espaços em branco
- [ ] Salvei em local seguro (temporariamente)

### Depois que eu configurar:
- [ ] Vercel deployment bem-sucedido
- [ ] Rodei `npx tsx scripts/validate-whatsapp.ts` - ✅ Verde
- [ ] Testei envio - Recebi mensagem no WhatsApp
- [ ] Criei agendamento de teste - Recebi confirmação
- [ ] Respondi no WhatsApp - Bot respondeu

### Automação Completa:
- [ ] Cliente agenda → Confirmação automática
- [ ] 1 dia antes → Lembrete chega
- [ ] 1 hora antes → Lembrete chega
- [ ] Cliente responde → Bot responde inteligentemente
- [ ] Profissional vê mensagens → Pode responder

---

## 🆘 Se Algo Não Funcionar

### "Validação falhou"
```
Execute: npx tsx scripts/validate-whatsapp.ts
Verifique a mensagem de erro específica
Me mande o erro exato
```

### "Mensagem não chegou"
```
1. Número destino tem country code? +55
2. Limite de mensagens na Meta > 0?
3. Token não expirou?
4. Webhook recebeu POST?
```

### "Vercel deployment falhou"
```
Verifique: https://vercel.com/seu-projeto/deployments
Logs podem mostrar o problema
Me mande o erro
```

---

## 📞 Suporte Rápido

Se algo não funcionar:
1. Rode o validador: `npx tsx scripts/validate-whatsapp.ts`
2. Me mande o resultado (verde/vermelho)
3. Vou ajudar a corrigir

---

## 🎉 Resultado Final

Quando tudo estiver pronto:

✅ Cliente agenda serviço no app  
✅ **1 segundo depois:** Confirmação cativante no WhatsApp  
✅ **1 dia antes:** Lembrete automático  
✅ **1 hora antes:** Último lembrete  
✅ **Cliente responde:** Bot responde inteligentemente  
✅ **Profissional vê:** Notificação de novo cliente  
✅ **Após atendimento:** Mensagem de agradecimento  

**Tudo automático, mensagens humanas, satisfação máxima das clientes!** 💚

---

## 🚀 Começar Agora

**Próximo passo:**

1. Abra: [SETUP_CREDENCIAIS_META.md](SETUP_CREDENCIAIS_META.md)
2. Copie as 4 credenciais
3. Responda nessa conversa com as credenciais
4. Eu configuro tudo
5. Você testa

**Você está pronto? Copie as credenciais e me manda!** ✅
