# 🔄 WORKFLOW CENTRAL ÚNICO - LEV Coworking Beauty

**Fluxo unificado para programar em CODEX ou CLAUDE sem perder nada**

---

## 📋 Resumo Executivo

Você tem **UM ÚNICO REPOSITÓRIO** no GitHub. Não importa se programar no Codex (notebook) ou Claude (celular), o fluxo é **sempre o mesmo**:

```
┌──────────────┐     ┌──────────────┐
│    CODEX     │     │    CLAUDE    │
│  (Notebook)  │     │   (Celular)  │
└──────┬───────┘     └──────┬───────┘
       │                    │
       └────────┬───────────┘
                │
         ┌──────▼──────┐
         │   GITHUB    │
         │ (Centralizado)
         └─────────────┘
```

---

## ✅ FLUXO PADRÃO (Sempre seguir)

### **Toda vez que vai programar (em QUALQUER ambiente):**

#### **Passo 1: Verificar Repositório (30 segundos)**
```bash
git fetch origin                    # Baixa mudanças do GitHub
git pull origin claude/beauty-project-continuation-4g1tc2  # Traz para sua máquina
```

#### **Passo 2: Programar**
Faça as mudanças que precisa no código.

#### **Passo 3: Salvar para GitHub (1 minuto)**
```bash
git add .                           # Adiciona tudo
git commit -m "feat: descrição"     # Faz commit
git push origin claude/beauty-project-continuation-4g1tc2  # Sobe para GitHub
```

**Pronto! Tudo sincronizado ✅**

---

## 🎯 CENÁRIOS PRÁTICOS

### **Cenário 1: Você programou no CODEX**

```powershell
# No Codex (seu notebook)
cd seu-projeto
git fetch origin
git pull origin claude/beauty-project-continuation-4g1tc2
# [faça as mudanças]
git add .
git commit -m "feat: nova funcionalidade"
git push origin claude/beauty-project-continuation-4g1tc2
```

**Resultado:** Código disponível no GitHub e acessível do Claude também ✅

---

### **Cenário 2: Você programou no CLAUDE**

```bash
# No Claude (mobile/cloud)
cd /home/user/LEV-COWORKING-BEAUTY-AI-STUDIO
git fetch origin
git pull origin claude/beauty-project-continuation-4g1tc2
# [faça as mudanças]
git add .
git commit -m "fix: corrigir bug"
git push origin claude/beauty-project-continuation-4g1tc2
```

**Resultado:** Código disponível no GitHub e acessível do Codex também ✅

---

### **Cenário 3: Alternativamente use o Script de Sync**

Se preferir um fluxo mais visual e guiado:

```bash
# No Claude (mobile)
bash scripts/sync-codex-claude.sh
```

Aí você escolhe:
- **Opção 1:** Sincronizar (faz merge automático)
- **Opção 2:** Ver diferenças
- **Opção 3:** Criar backup antes de sincronizar
- **Opção 4:** Cancelar

---

## ⚠️ IMPORTANTE: Regras de Ouro

### **Sempre antes de programar:**
```bash
git fetch origin && git pull origin claude/beauty-project-continuation-4g1tc2
```

Isso garante que você tem **TUDO** que foi programado em outro lugar.

### **Sempre depois de programar:**
```bash
git add .
git commit -m "feat/fix: descrição"
git push origin claude/beauty-project-continuation-4g1tc2
```

Isso garante que **NINGUÉM perde seu trabalho**.

### **NUNCA:**
- ❌ Faça mudanças sem fazer commit e push
- ❌ Programa em dois lugares ao mesmo tempo sem sincronizar
- ❌ Ignore conflitos de merge - resolva logo!

---

## 🔄 Exemplo Completo: Do Início ao Fim

**Dia 1 - Você no CODEX:**
```powershell
cd C:\Users\ricll\Documents\seu-projeto
git fetch origin && git pull origin claude/beauty-project-continuation-4g1tc2

# Cria novo componente LoginModal.tsx
# Testa e funciona perfeito

git add .
git commit -m "feat: criar LoginModal component"
git push origin claude/beauty-project-continuation-4g1tc2
```

**Dia 2 - Você no CLAUDE (celular):**
```bash
cd /home/user/LEV-COWORKING-BEAUTY-AI-STUDIO
git fetch origin && git pull origin claude/beauty-project-continuation-4g1tc2

# LoginModal já está aqui! ✅
# Adiciona melhorias no componente

git add .
git commit -m "feat: adicionar dark mode no LoginModal"
git push origin claude/beauty-project-continuation-4g1tc2
```

**Dia 3 - Você volta pro CODEX:**
```powershell
cd seu-projeto
git fetch origin && git pull origin claude/beauty-project-continuation-4g1tc2

# Vê todas as mudanças que fez no Claude! ✅
# LoginModal agora tem dark mode

# Adiciona mais features...
git add .
git commit -m "feat: adicionar validação no LoginModal"
git push origin claude/beauty-project-continuation-4g1tc2
```

**Resultado:** Tudo sincronizado, nada perdido, código sempre central no GitHub! 🎉

---

## 📱 Versão Resumida (Copiar/Colar)

### **Codex:**
```powershell
git fetch origin && git pull origin claude/beauty-project-continuation-4g1tc2
# [programe aqui]
git add . && git commit -m "feat: descrição" && git push origin claude/beauty-project-continuation-4g1tc2
```

### **Claude:**
```bash
git fetch origin && git pull origin claude/beauty-project-continuation-4g1tc2
# [programe aqui]
git add . && git commit -m "feat: descrição" && git push origin claude/beauty-project-continuation-4g1tc2
```

---

## 🆘 Se Tiver Conflito

Se aparecer "conflito de merge":

```bash
# Ver arquivos com conflito
git status

# Editar arquivo conflituoso
# Procure por: <<<<<<, =======, >>>>>>
# Escolha qual versão manter
# Remova as marcas

# Confirmar resolução
git add .
git commit -m "Merge: resolver conflitos"
git push origin claude/beauty-project-continuation-4g1tc2
```

---

## 📊 Checklist Antes de Programar

- [ ] Executei `git fetch origin`
- [ ] Executei `git pull origin claude/beauty-project-continuation-4g1tc2`
- [ ] Verifiquei que tenho as mudanças mais recentes
- [ ] Fiz minhas mudanças
- [ ] Testei se funcionou
- [ ] Executei `git add .`
- [ ] Executei `git commit -m "..."`
- [ ] Executei `git push origin claude/beauty-project-continuation-4g1tc2`

---

## 🚀 TL;DR (Muito Longo, Não Li)

```
SEMPRE:
1. git fetch && git pull
2. [programa]
3. git add . && git commit && git push

FIM!
```

---

## 📞 Dúvidas?

Consulte:
- `/docs/guides/SINCRONIZAR_CODEX_CLAUDE.md` - Guia visual
- `/CLAUDE.md` - Contexto técnico
- `bash scripts/sync-codex-claude.sh` - Script interativo

---

**Data:** 31/10/2026  
**Versão:** 1.0.0  
**Próxima review:** Quando tiver dúvida no fluxo

*Um repositório. Dois ambientes. Sem perder nada.*
