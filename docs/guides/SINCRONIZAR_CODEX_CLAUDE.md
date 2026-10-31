# 🔄 Sincronizar Codex + Claude

**Guia para sincronizar trabalho entre Codex e Claude sem perder nada**

---

## 📋 O Problema

Você está trabalhando em **dois ambientes**:
- 💻 **Codex** - IDE web (código que você escreve lá)
- 🤖 **Claude** - Claude Code (mudanças que fiz aqui)

**Risco:** Perder commits ou alterações que foram feitas em um ambiente e não incorporadas no outro.

---

## ✅ A Solução

Um **script seguro** que:
1. ✅ Busca TODAS as mudanças do repositório remoto
2. ✅ Compara o que tem em cada ambiente
3. ✅ Faz merge seguro (com backup opcional)
4. ✅ Avisa sobre conflitos
5. ✅ Não deleta nada

---

## 🚀 Como Usar

### **Opção 1: Rodar o script automaticamente (RECOMENDADO)**

```bash
bash scripts/sync-codex-claude.sh
```

O script vai:
1. Verificar status atual
2. Buscar atualizações do GitHub
3. Mostrar o que precisa sincronizar
4. Dar opções de ação
5. Executar a sincronização

---

### **Opção 2: Sincronização manual (Passo a passo)**

#### **Passo 1: Buscar tudo do repositório**
```bash
git fetch origin --all --tags
```

#### **Passo 2: Ver o que está diferente**
```bash
# Ver commits em main que não estão aqui
git log HEAD..origin/main --oneline

# Ver commits aqui que não estão em main
git log origin/main..HEAD --oneline
```

#### **Passo 3: Sincronizar (merge)**
```bash
# Fazer merge de main para sua branch
git merge origin/main --no-edit
```

#### **Passo 4: Resolver conflitos (se houver)**
```bash
# Ver arquivos com conflito
git status

# Editar e resolver conflitos
# Depois:
git add .
git commit -m "Resolve merge conflicts"
```

#### **Passo 5: Testar tudo**
```bash
npm install  # Se teve novos pacotes
npm run dev  # Rodar app
npm run lint # Verificar tipos
npm run test # Testes
```

#### **Passo 6: Push para GitHub**
```bash
git push origin claude/beauty-project-continuation-4g1tc2
```

---

## 🛡️ Criar Backup Antes (Seguro)

Se quer ser extra seguro, crie um backup ANTES de sincronizar:

```bash
# Criar branch de backup com data/hora
git branch backup/$(date +%Y%m%d-%H%M%S)-seu-backup

# Agora sincronizar com segurança
git merge origin/main --no-edit

# Se algo der errado, volta:
git reset --hard backup/2026-10-31-172200-seu-backup
```

---

## 🔄 Fluxo de Sincronização (Visual)

```
┌─────────────────────────────────────────┐
│ 1. Você trabalha em CODEX                │
│    (escreve código, faz commits)         │
└────────────────┬────────────────────────┘
                 │
                 ▼
        ┌─────────────────┐
        │ git push origin │ (do Codex)
        └────────┬────────┘
                 │
                 ▼
        ┌──────────────────────────┐
        │   GitHub Repository      │
        │   (main + outras branches)│
        └────────┬─────────────────┘
                 │
                 ▼
        ┌─────────────────┐
        │ git fetch origin│ (do Claude)
        └────────┬────────┘
                 │
                 ▼
┌──────────────────────────────────────┐
│ 2. Claude vê commits de Codex aqui    │
│    bash scripts/sync-codex-claude.sh  │
└──────────────────────────────────────┘
                 │
                 ▼
        ┌──────────────────┐
        │ git merge main   │
        └────────┬─────────┘
                 │
                 ▼
┌──────────────────────────────────────┐
│ 3. Claude tem TUDO sincronizado       │
│    + os commits que você fez aqui     │
└──────────────────────────────────────┘
```

---

## ⚠️ E Se Tiver Conflito?

Conflitos acontecem quando **o mesmo arquivo foi mudado** em dois lugares diferentes.

### **Exemplo:**
```
Codex mudou: src/App.tsx linha 10
Claude mudou: src/App.tsx linha 10

Resultado: CONFLITO
```

### **Como resolver:**

```bash
# 1. Ver quais arquivos têm conflito
git status

# 2. Abrir arquivo conflituoso
# Vai parecer assim:
<<<<<<< HEAD
  código do Claude
=======
  código do Codex
>>>>>>> origin/main

# 3. Escolher qual versão manter:
# Opção A: Manter Claude
# Opção B: Manter Codex
# Opção C: Combinar os dois

# 4. Remover as marcas de conflito
# E deixar só o código que quer

# 5. Confirmar resolução
git add .
git commit -m "Resolve merge conflicts between Codex and Claude"
```

---

## 📊 Opções do Script

Quando rodar `bash scripts/sync-codex-claude.sh`, vai aparecer menu:

```
Escolha uma opção:
1) Sincronizar (merge main → branch) - RECOMENDADO
2) Apenas visualizar diferenças (sem fazer mudanças)
3) Criar backup antes de sincronizar
4) Cancelar
```

**Recomendado:** Use **opção 1** se confia que não há conflitos  
**Seguro:** Use **opção 3** se quer um backup antes

---

## ✅ Checklist de Sincronização

- [ ] Você commitou todas as mudanças no Codex (`git status` limpo)
- [ ] Você fez `git push origin` no Codex
- [ ] Você está na branch correta aqui (`claude/beauty-project-continuation-4g1tc2`)
- [ ] Você rodou `bash scripts/sync-codex-claude.sh`
- [ ] Sem conflitos (ou resolveu todos)
- [ ] Rodou testes: `npm run test && npm run e2e`
- [ ] Fez push aqui: `git push origin seu-branch`

---

## 🔗 Fluxo Ideal

### **De agora em diante:**

**No Codex (seu ambiente principal):**
```bash
# Faça mudanças
git add .
git commit -m "feat: descrição"
git push origin main
```

**No Claude:**
```bash
# Sincronize
bash scripts/sync-codex-claude.sh

# Ou manualmente
git fetch origin
git merge origin/main
git push origin seu-branch
```

**No GitHub:**
```
Tudo sincronizado = main sempre atualizado ✅
```

---

## 🆘 Problemas Comuns

### **"Erro: conflito não pode ser resolvido"**
```bash
# Cancelar o merge
git merge --abort

# Tentar de novo
git fetch origin
git merge origin/main
```

### **"Perdi um commit!"**
```bash
# Ver histórico de tudo
git reflog

# Recuperar branch pelo reflog
git checkout -b recovered @{n}
```

### **"Script não tem permissão de execução"**
```bash
# Dar permissão
chmod +x scripts/sync-codex-claude.sh

# Rodar
bash scripts/sync-codex-claude.sh
```

---

## 📞 Quando Usar

| Situação | O Que Fazer |
|----------|------------|
| **Trabalhei no Codex** | Push → Claude → sincronize |
| **Fiz mudanças no Claude** | Commit → Push → Codex faz fetch |
| **Quero ter certeza que não perde nada** | `sync-codex-claude.sh` opção 3 |
| **Vou fazer deploy** | Sincronize antes |
| **Voltei do notebook para celular** | Sincronize tudo |

---

## 🎯 Resumo

**O script faz tudo para você:**
- ✅ Busca commits de Codex
- ✅ Compara com Claude
- ✅ Faz merge seguro
- ✅ Cria backup (opcional)
- ✅ Avisa sobre conflitos

**Comando único:**
```bash
bash scripts/sync-codex-claude.sh
```

**Só isso! 🚀**

---

**Última atualização:** 31/10/2026  
**Versão:** 1.0.0

*Para sincronizar trabalho entre ambientes sem perder nada*
