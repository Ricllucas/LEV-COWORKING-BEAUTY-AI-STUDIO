# 📱 GUIA VISUAL - Como Copiar as 4 Credenciais

## 🎯 Você vai fazer EXATAMENTE isso:

```
1. Abrir Meta Business Suite em browser
2. Navegar para encontrar cada credencial
3. Copiar e colar aqui nessa conversa
4. Pronto! Eu configuro tudo
```

---

# ✅ CREDENCIAL #1: ACCESS_TOKEN

## PASSO A PASSO (Com imagens descritivas)

### Passo 1: Abra Meta Business Suite
```
URL: https://business.facebook.com
Faça login com sua conta que tem WhatsApp Business
```

### Passo 2: Vá em "Contas"
```
┌─────────────────────────────────────┐
│  Menu (≡) no canto superior esquerdo │
│                                     │
│  Clique em: Contas                  │
└─────────────────────────────────────┘
```

### Passo 3: Selecione sua conta
```
┌─────────────────────────────────────┐
│  Você vai ver lista de contas       │
│                                     │
│  Selecione: LEV Coworking Beauty    │
└─────────────────────────────────────┘
```

### Passo 4: Vá em Configurações
```
┌─────────────────────────────────────┐
│  No menu esquerdo procure por:      │
│                                     │
│  ⚙️  Configurações                  │
│     (Settings)                      │
└─────────────────────────────────────┘
```

### Passo 5: Encontre o Token
```
┌─────────────────────────────────────┐
│  Na página de configurações:        │
│                                     │
│  Procure por:                       │
│  "Tokens" ou "Access Tokens"        │
│                                     │
│  Vai ter um botão "Copiar" 📋       │
└─────────────────────────────────────┘
```

### Passo 6: Copie
```
┌─────────────────────────────────────┐
│  Token tem esse formato:            │
│                                     │
│  EAAG5ZAw4ZC8BAIaZAgZCZAjm5ZBnGw   │
│  ...muito longo...                  │
│                                     │
│  Clique: COPIAR 📋                  │
└─────────────────────────────────────┘
```

### ✅ Cole aqui:
```
WHATSAPP_ACCESS_TOKEN: 
[Seu token EAAG...]
```

---

# ✅ CREDENCIAL #2: PHONE_NUMBER_ID

## PASSO A PASSO

### Passo 1: Ainda na Meta Business Suite
```
Menu esquerdo, procure por:
  📱 WhatsApp
```

### Passo 2: Clique em Configurações
```
┌─────────────────────────────────────┐
│  Menu WhatsApp (esquerda)           │
│                                     │
│  Clique em: Configurações           │
│             (Settings)              │
└─────────────────────────────────────┘
```

### Passo 3: Encontre "Seu Número"
```
┌─────────────────────────────────────┐
│  Você vai ver a lista de números    │
│                                     │
│  Procure: (41) 98497-9940           │
│                                     │
│  Clique nele                        │
└─────────────────────────────────────┘
```

### Passo 4: Copie o ID
```
┌─────────────────────────────────────┐
│  Quando clica no número:            │
│                                     │
│  Vai ver: "ID do Número"            │
│           ou "Number ID"            │
│                                     │
│  Exemplo: 1234567890               │
│           (números, nada mais)      │
│                                     │
│  Clique: COPIAR 📋                  │
└─────────────────────────────────────┘
```

### ✅ Cole aqui:
```
WHATSAPP_PHONE_NUMBER_ID:
[10-15 números]
```

---

# ✅ CREDENCIAL #3: APP_SECRET

## PASSO A PASSO

### Passo 1: Abra Developers Facebook
```
URL: https://developers.facebook.com
```

### Passo 2: Vá em "Meus Apps"
```
┌─────────────────────────────────────┐
│  Menu superior direito               │
│                                     │
│  Clique em: Meus Apps               │
│            (My Apps)                │
└─────────────────────────────────────┘
```

### Passo 3: Selecione seu app
```
┌─────────────────────────────────────┐
│  Você vai ver lista de apps         │
│                                     │
│  Procure: "LEV Coworking"           │
│  ou o app que tem WhatsApp          │
│                                     │
│  Clique nele                        │
└─────────────────────────────────────┘
```

### Passo 4: Vá em Configurações
```
┌─────────────────────────────────────┐
│  Menu esquerdo                      │
│                                     │
│  ⚙️  Configurações                  │
│     (Settings)                      │
│                                     │
│  Clique em: Básico                  │
│            (Basic)                  │
└─────────────────────────────────────┘
```

### Passo 5: Encontre App Secret
```
┌─────────────────────────────────────┐
│  Você vai ver:                      │
│                                     │
│  App ID: 123456789                  │
│  App Secret: ••••••••••••••••       │
│                                     │
│  Clique em: "Mostrar"               │
│            (Show)                   │
│                                     │
│  Vai aparecer: abc123def456ghi789   │
└─────────────────────────────────────┘
```

### Passo 6: Copie
```
┌─────────────────────────────────────┐
│  App Secret tem ~32 caracteres      │
│                                     │
│  Exemplo:                           │
│  abc123def456ghi789jkl012mno345pqr │
│                                     │
│  Clique: COPIAR 📋                  │
└─────────────────────────────────────┘
```

### ✅ Cole aqui:
```
WHATSAPP_APP_SECRET:
[String aleatória ~32 chars]
```

---

# ✅ CREDENCIAL #4: VERIFY_TOKEN (VOCÊ CRIA!)

## ⚠️ Este você CRIA você mesmo (não copia)

### Opção A: Gerar Aleatório (RECOMENDADO)

**Se está no Windows:**

1. Abra PowerShell
2. Cole esse comando:
```powershell
-join ((33..126) | Get-Random -Count 32 | % {[char]$_})
```
3. Pressione ENTER
4. Vai sair uma string aleatória

**Exemplo de saída:**
```
7*kL9@mP2$qR5#xT8!vW3&yZ1%bN6^cD4
```

### Opção B: Criar Manual

Use letras, números e símbolos:
```
MySecureToken_2026_LEV_xyz789_Beauty!
```

Só precisa ter:
- Mínimo 20 caracteres
- Misturado (letras + números + símbolos)
- Algo que você lembra (você vai usar depois)

### ✅ Cole aqui:
```
WHATSAPP_VERIFY_TOKEN:
[String que você criou]
```

---

# 📋 RESUMO - As 4 Credenciais

Quando tiver todas, você vai ter:

```
┌──────────────────────────────────────────┐
│ 1. ACCESS_TOKEN                          │
│    EAAG5ZAw4ZC8BAIaZAgZCZAjm5ZBnGw...  │
│                                          │
│ 2. PHONE_NUMBER_ID                       │
│    1234567890                            │
│                                          │
│ 3. APP_SECRET                            │
│    abc123def456ghi789jkl012mno345pqr   │
│                                          │
│ 4. VERIFY_TOKEN (você criou)             │
│    MySecureToken_2026_LEV_xyz789_Beauty! │
└──────────────────────────────────────────┘
```

---

# 🎬 ORDEM DE AÇÕES

## 1️⃣ Copiar Credenciais (5 min)
```
Passo 1: Meta Business Suite (Credenciais 1 e 2)
Passo 2: Facebook Developers (Credencial 3)
Passo 3: PowerShell/Manual (Credencial 4)
```

## 2️⃣ Me Enviar Aqui (1 min)
```
Responda com as 4 credenciais nessa conversa
```

## 3️⃣ Eu Configuro (7 min)
```
Eu adiciono no Vercel
Eu faz deploy
Pronto! 🎉
```

---

# ✅ Checklist Antes de Me Enviar

- [ ] Copiei WHATSAPP_ACCESS_TOKEN (começa com EAAG)
- [ ] Copiei WHATSAPP_PHONE_NUMBER_ID (números)
- [ ] Copiei WHATSAPP_APP_SECRET (string aleatória)
- [ ] Criei WHATSAPP_VERIFY_TOKEN (meu token)
- [ ] Tenho as 4 credenciais anotadas
- [ ] Nenhuma tem espaços em branco
- [ ] Estou pronto para enviar

---

# 🚀 PRÓXIMO PASSO

Quando tiver as 4, responda nessa conversa com:

```
✅ CREDENCIAIS PRONTAS!

ACCESS_TOKEN: EAAG5ZAw4ZC8BAIaZAgZCZAjm5ZBnGw...
PHONE_NUMBER_ID: 1234567890
APP_SECRET: abc123def456ghi789jkl012mno345pqr
VERIFY_TOKEN: MySecureToken_2026_LEV_xyz789_Beauty!
```

---

**Ficou claro?** Comece agora! 🚀
