# ✅ Guia de Verificação - WhatsApp Business (41) 98497-9940

## 🔍 Como Verificar se o Número Está Credenciado e Funcional

### Opção 1: Verificação Automática (Recomendado)

```bash
# Testar SEM enviar mensagem
npx tsx scripts/validate-whatsapp.ts

# Testar E enviar mensagem de teste
npx tsx scripts/validate-whatsapp.ts 5585999999999
# (Substitua 5585999999999 pelo seu número com country code)
```

**Saída esperada:**
```
🔍 VALIDADOR WHATSAPP BUSINESS LEV COWORKING

============================================================

1️⃣ Verificando variáveis de ambiente...
   Status: ✅ Todas as variáveis de ambiente estão configuradas

2️⃣ Validando formato das credenciais...
   Status: ✅ Formato das credenciais está válido
   - tokenFormat: EAAG... ✓
   - phoneIdFormat: 123...✓

3️⃣ Testando conexão com WhatsApp API...
   Status: ✅ Conexão com WhatsApp API estabelecida com sucesso
   - phoneNumber: +55 41 98497-9940
   - qualityRating: HIGH

4️⃣ Validando webhook...
   Status: ✅ APP_SECRET configurado para validação de webhook

5️⃣ Testando envio de mensagem para 5585999999999...
   Status: ✅ Mensagem de teste enviada com sucesso!
   - ID da Mensagem: wamid.xxxxx
   - Status: Enviada ✓

============================================================

📊 RESUMO:
✅ TUDO CONFIGURADO E FUNCIONAL!

Próximos passos:
1. Deploy para Vercel
2. Testar agendamento via app
3. Validar confirmação no WhatsApp
```

---

### Opção 2: Verificação Manual na Meta Business Suite

#### A. Verificar Credenciais

1. **Acesse Meta Business Suite:**
   ```
   https://business.facebook.com
   ```

2. **Vá em WhatsApp > Configurações:**
   ```
   Menu > Contas > Suas contas de negócios
   Selecione: LEV Coworking Beauty
   Vá em: WhatsApp > Configurações
   ```

3. **Copie e valide as credenciais:**

   **WHATSAPP_PHONE_NUMBER_ID:**
   ```
   Localização: Configurações > Seu número
   Aparência: "1234567890" (10-15 dígitos)
   Anotação: Este é o ID do número, não o número em si
   ```

   **WHATSAPP_ACCESS_TOKEN:**
   ```
   Localização: Configurações > Tokens de acesso
   Aparência: "EAAG..." (muito longo)
   Validade: Pode expirar - verificar data
   ```

   **WHATSAPP_APP_SECRET:**
   ```
   Localização: Configurações do App > Segurança
   Aparência: "abc123def456..." (string aleatória)
   ```

---

#### B. Verificar Número Credenciado

1. **Vá em: WhatsApp > Números de Telefone:**
   ```
   Configurações > Números > Seus números
   ```

2. **Procure por `(41) 98497-9940`:**
   - ✅ Status: **Verificado** (verde)
   - ✅ Qualidade: **HIGH** ou **MEDIUM**
   - ✅ Limite de mensagens: Acima de 0
   - ✅ Última atividade: Recente

3. **Se o status for ❌ Não Verificado:**
   ```
   Clique em "Solicitar Verificação"
   Aguarde aprovação da Meta (24-48 horas)
   ```

---

#### C. Verificar Webhook

1. **Vá em: Configurações > API do Webhook:**
   ```
   Configurações > API Webhook
   ```

2. **Verifique:**
   - ✅ URL do Webhook: `https://seu-app.vercel.app/api/whatsapp/webhook`
   - ✅ Verify Token: Configurado e seguro
   - ✅ Eventos subscritos: `messages`, `message_status`
   - ✅ Status: **Conectado** (verde)

3. **Se estiver desconectado:**
   ```
   1. Clique em "Reconectar"
   2. Verifique se URL está correta
   3. Verifique se Verify Token corresponde ao .env
   ```

---

### Opção 3: Teste Manual de Envio

**Teste na Meta Business Suite:**

1. **Vá em: API > Teste de Envio:**
   ```
   Configurações > API > Teste de Envio
   ```

2. **Selecione seu número:**
   ```
   Número: (41) 98497-9940
   Destinatário: Seu número de teste
   Mensagem: "Teste de integração"
   ```

3. **Clique em "Enviar":**
   - ✅ Você deve receber no WhatsApp
   - ⏱️ Dentro de 5-10 segundos

4. **Se não receber:**
   ```
   ❌ Número pode estar suspenso ou desverificado
   ❌ Limite de mensagens pode estar zerado
   ❌ Webhook pode estar bloqueando
   ```

---

### Opção 4: Teste de Curl (Linha de Comando)

```bash
# Substituir pelos seus valores reais
TOKEN="seu_token_aqui"
PHONE_ID="seu_phone_id_aqui"
NUMERO_DESTINO="5585999999999"

# 1. Testar conexão com API
curl -X GET \
  "https://graph.instagram.com/v18.0/$PHONE_ID?access_token=$TOKEN"

# Resposta esperada:
# {
#   "id": "1234567890",
#   "display_phone_number": "+55 41 98497-9940",
#   "quality_rating": "HIGH"
# }

# 2. Enviar mensagem de teste
curl -X POST \
  "https://graph.instagram.com/v18.0/$PHONE_ID/messages" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "messaging_product": "whatsapp",
    "to": "'$NUMERO_DESTINO'",
    "type": "text",
    "text": {
      "body": "Teste de integração LEV Coworking"
    }
  }'

# Resposta esperada:
# {
#   "messages": [{
#     "id": "wamid.xxxxx"
#   }]
# }
```

---

## 🚨 Possíveis Problemas e Soluções

### ❌ Erro: "Assinatura inválida"
```
Causa: APP_SECRET incorreto ou espaços em branco
Solução: 
1. Copiar novamente do Meta Business Suite
2. Verificar se não tem espaços em branco
3. Verificar se está entre aspas no .env
```

### ❌ Erro: "Token expirado"
```
Causa: Access token tem validade limitada (30-60 dias)
Solução:
1. Gerar novo token no Meta Business Suite
2. Atualizar WHATSAPP_ACCESS_TOKEN no Vercel
3. Fazer redeploy da aplicação
```

### ❌ Erro: "Número não verificado"
```
Causa: WhatsApp Business exige verificação do número
Solução:
1. Ir em Configurações > Números
2. Clicar em "Solicitar Verificação"
3. Seguir instruções da Meta
4. Aguardar aprovação (24-48h)
```

### ❌ Erro: "Limite de mensagens zerado"
```
Causa: Limite de mensagens diárias foi atingido
Solução:
1. Esperar até próximo dia para resetar limite
2. Ou aumentar limite pagando à Meta
3. Verificar em Configurações > Limites
```

### ❌ Erro: "Webhook não recebe mensagens"
```
Causa: URL incorreta ou Verify Token não bate
Solução:
1. Verificar URL: https://seu-app.vercel.app/api/whatsapp/webhook
2. Verificar Verify Token no .env
3. Testar GET no webhook (deve retornar challenge)
4. Verificar logs do Vercel
```

### ❌ Erro: "Mensagem não entrega"
```
Causa: Pode ser cliente, API, ou infraestrutura
Verificar:
1. Número destino tem país code (+55)
2. Número tem WhatsApp ativo
3. Tente enviar manualmente no WhatsApp antes
4. Verifique logs em "Logs de Mensagens" na Meta
```

---

## 📋 Checklist de Verificação Completa

### Antes de Deploy

- [ ] **Variáveis de Ambiente**
  - [ ] WHATSAPP_ACCESS_TOKEN = `EAAG...` (longo)
  - [ ] WHATSAPP_PHONE_NUMBER_ID = numérico
  - [ ] WHATSAPP_APP_SECRET = string aleatória
  - [ ] WHATSAPP_VERIFY_TOKEN = seguro

- [ ] **Meta Business Suite**
  - [ ] Número (41) 98497-9940 verificado ✓
  - [ ] Status: Verde (Verificado)
  - [ ] Qualidade: HIGH ou MEDIUM
  - [ ] Limite de mensagens > 0

- [ ] **Webhook**
  - [ ] URL configurada corretamente
  - [ ] Verify Token bate com .env
  - [ ] Status: Conectado
  - [ ] Eventos subscritos: messages, message_status

- [ ] **Testes**
  - [ ] `npx tsx scripts/validate-whatsapp.ts` ✓
  - [ ] Teste de envio manual via Meta ✓
  - [ ] Webhook recebe GET (challenge) ✓
  - [ ] Mensagem enviada com sucesso ✓

### Depois de Deploy

- [ ] Vercel deploy bem-sucedido
- [ ] Variáveis configuradas no Vercel
- [ ] Teste agendamento no app
- [ ] Confirmação chega no WhatsApp
- [ ] Webhook recebe resposta (POST)

---

## 🎯 Próximos Passos

**Se tudo passou na verificação:**
1. ✅ Deploy para Vercel
2. ✅ Agendar serviço de teste
3. ✅ Verificar confirmação no WhatsApp
4. ✅ Profissionais testam interação

**Se algo falhou:**
1. ❌ Corrigir problema específico
2. ❌ Rerun do validador
3. ❌ Contatar suporte Meta se necessário
4. ❌ Deploy apenas quando tudo passar

---

## 📞 Contato Meta Business Support

Se tiver problemas que não consegue resolver:

**Meta Business Support:**
- https://business.facebook.com/help
- Buscar: "WhatsApp Business API"
- Chat de suporte 24/7

**Documentação Oficial:**
- https://developers.facebook.com/docs/whatsapp/cloud-api/
- https://www.whatsapp.com/business/

---

**Data**: 2026-08-01  
**Status**: Verificação Pronta ✅
