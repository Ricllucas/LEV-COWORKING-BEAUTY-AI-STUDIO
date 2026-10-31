# 🔐 Guia Seguro para Copiar Credenciais da Meta

⚠️ **SEGURANÇA IMPORTANTE:**
- Nunca compartilhe essas credenciais em público
- Use este documento apenas localmente
- Após copiar, apague este arquivo
- Cada credencial é como uma senha - PROTEJA-A

---

## 1️⃣ WHATSAPP_ACCESS_TOKEN

### Onde encontrar:

```
Abra: https://business.facebook.com
          ↓
Menu superior esquerdo > Contas
          ↓
Selecione: "LEV Coworking Beauty"
          ↓
Menu esquerdo > "Configurações"
          ↓
Clique em: "Usuários e permissões"
          ↓
Clique em: "Tokens do sistema"
          ↓
Procure por: "Token de acesso" ou "Access Token"
          ↓
Clique em: "Copiar" ou "Copy"
```

### Como fica:
```
EAAG5ZAw4ZC8BAIaZAgZCZAjm5ZBnGw...
(muito longo, começa com EAAG)
```

### Cole aqui (temporariamente):
```
┌─────────────────────────────────────────────┐
│ ACCESS_TOKEN:                               │
│                                             │
│ EAAG5ZAw4ZC8BAIaZAgZCZAjm5ZBnGw...        │
│                                             │
└─────────────────────────────────────────────┘
```

---

## 2️⃣ WHATSAPP_PHONE_NUMBER_ID

### Onde encontrar:

```
Abra: https://business.facebook.com
          ↓
Menu > Contas
          ↓
Selecione: "LEV Coworking Beauty"
          ↓
Menu esquerdo > "WhatsApp"
          ↓
Clique em: "Configurações"
          ↓
Clique em: "Seu número" ou "Phone Numbers"
          ↓
Procure pelo número: (41) 98497-9940
          ↓
Embaixo, procure por: "ID do Número" ou "Number ID"
          ↓
Clique em: "Copiar" ou "Copy"
```

### Como fica:
```
1234567890
(10-15 dígitos, sem símbolos)
```

### Cole aqui:
```
┌─────────────────────────────────────────────┐
│ PHONE_NUMBER_ID:                            │
│                                             │
│ 1234567890                                  │
│                                             │
└─────────────────────────────────────────────┘
```

---

## 3️⃣ WHATSAPP_APP_SECRET

### Onde encontrar:

```
Abra: https://developers.facebook.com
          ↓
Menu superior > Meus Apps
          ↓
Selecione seu app: "LEV Coworking"
          ↓
Menu esquerdo > "Configurações"
          ↓
Clique em: "Básico"
          ↓
Procure por: "App Secret" ou "Segredo do App"
          ↓
Pode precisar clicar em: "Mostrar" (Show)
          ↓
Clique em: "Copiar" ou "Copy"
```

### Como fica:
```
abc123def456ghi789jkl012mno345pqr
(string aleatória, cerca de 32 caracteres)
```

### Cole aqui:
```
┌─────────────────────────────────────────────┐
│ APP_SECRET:                                 │
│                                             │
│ abc123def456ghi789jkl012mno345pqr          │
│                                             │
└─────────────────────────────────────────────┘
```

---

## 4️⃣ WHATSAPP_VERIFY_TOKEN

⚠️ **ESTE VOCÊ CRIA!**

Escolha uma string segura aleatória (mínimo 20 caracteres):

### Opção A: Gerar aleatório (copie e cole no terminal)

**No Windows (PowerShell):**
```powershell
-join ((33..126) | Get-Random -Count 32 | % {[char]$_})
```

**No Mac/Linux (Terminal):**
```bash
openssl rand -base64 32
```

### Opção B: Criar manualmente
```
Use letras, números e símbolos aleatoriamente:
Exemplo: MySecureToken_2026_LEV_xyz789_Beauty!
```

### Cole aqui:
```
┌─────────────────────────────────────────────┐
│ VERIFY_TOKEN (você cria):                   │
│                                             │
│ MySecureToken_2026_LEV_xyz789_Beauty!       │
│                                             │
└─────────────────────────────────────────────┘
```

---

## ✅ Checklist Antes de Continuar

- [ ] Copiei WHATSAPP_ACCESS_TOKEN (começa com EAAG)
- [ ] Copiei WHATSAPP_PHONE_NUMBER_ID (10-15 dígitos)
- [ ] Copiei WHATSAPP_APP_SECRET (32+ caracteres)
- [ ] Criei WHATSAPP_VERIFY_TOKEN (20+ caracteres)
- [ ] Todas as 4 credenciais estão prontas
- [ ] Verifiquei que nenhuma tem espaços em branco
- [ ] Salvei em local seguro (temporariamente)

---

## 📧 Próximo Passo

Você vai me enviar as **4 credenciais** por aqui (na conversa).

⚠️ **Forma segura de compartilhar:**

Copie exatamente assim:

```
ACCESS_TOKEN: EAAG5ZAw4ZC8BAIa...
PHONE_NUMBER_ID: 1234567890
APP_SECRET: abc123def456ghi789...
VERIFY_TOKEN: MySecureToken_2026_LEV_xyz789_Beauty!
```

E me manda por aqui. Eu vou:
1. ✅ Configurar no Vercel automaticamente
2. ✅ Atualizar o .env.example
3. ✅ Rodar validação
4. ✅ Apagar esse arquivo com suas credenciais
5. ✅ Fazer deploy

---

**Está pronto?** Copie as credenciais e me envia! 🚀
