#!/bin/bash

##############################################################################
# SINCRONIZAR CODEX + CLAUDE - LEV Coworking Beauty
#
# Este script sincroniza mudanças entre ambientes Codex e Claude
# SEM PERDER nenhum commit ou alteração de qualquer lado
#
# USO: bash scripts/sync-codex-claude.sh
##############################################################################

set -e  # Exit on error

echo "🔄 SINCRONIZADOR CODEX + CLAUDE"
echo "=================================="
echo ""

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Função para imprimir com cor
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[✓]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[!]${NC} $1"
}

print_error() {
    echo -e "${RED}[✗]${NC} $1"
}

##############################################################################
# STEP 1: Verificar status atual
##############################################################################

print_status "STEP 1: Verificando status atual..."

CURRENT_BRANCH=$(git branch --show-current)
CURRENT_COMMIT=$(git rev-parse --short HEAD)

echo "  Branch atual: $CURRENT_BRANCH"
echo "  Commit atual: $CURRENT_COMMIT"
echo ""

# Verificar se há mudanças não commitadas
if [[ $(git status --porcelain) ]]; then
    print_warning "Há mudanças não commitadas!"
    echo ""
    echo "Mudanças pendentes:"
    git status --short
    echo ""
    read -p "Deseja continuar? (s/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Ss]$ ]]; then
        print_error "Operação cancelada"
        exit 1
    fi
fi

print_success "Status verificado"
echo ""

##############################################################################
# STEP 2: Fetch de todas as branches remotas
##############################################################################

print_status "STEP 2: Buscando atualizações do repositório remoto..."

git fetch origin --all --tags
print_success "Fetch concluído"
echo ""

##############################################################################
# STEP 3: Mostrar resumo de commits
##############################################################################

print_status "STEP 3: Analisando histórico de commits..."

echo "📊 RESUMO:"
echo ""
echo "Branch atual: $CURRENT_BRANCH"
echo "Commits desta branch:"
git log --oneline -10
echo ""

echo "Commits em main (remoto):"
git log origin/main --oneline -5
echo ""

##############################################################################
# STEP 4: Verificar commits faltantes
##############################################################################

print_status "STEP 4: Verificando commits que faltam sincronizar..."

echo ""
echo "Commits em main que NÃO estão na branch atual:"
if git log HEAD..origin/main --oneline 2>/dev/null | grep -q .; then
    git log HEAD..origin/main --oneline
    MAIN_COMMITS=$(git log HEAD..origin/main --oneline | wc -l)
    print_warning "Há $MAIN_COMMITS commits em main que não estão aqui"
else
    print_success "Nenhum commit pendente de main"
fi

echo ""
echo "Commits na branch atual que NÃO estão em main:"
if git log origin/main..HEAD --oneline 2>/dev/null | grep -q .; then
    git log origin/main..HEAD --oneline
    BRANCH_COMMITS=$(git log origin/main..HEAD --oneline | wc -l)
    print_success "Há $BRANCH_COMMITS commits nesta branch"
else
    print_success "Nenhum commit único nesta branch"
fi

echo ""

##############################################################################
# STEP 5: Oferecer opções de sincronização
##############################################################################

print_status "STEP 5: Opções de sincronização disponíveis"
echo ""
echo "Escolha uma opção:"
echo "1) Sincronizar (merge main → branch atual) - RECOMENDADO"
echo "2) Apenas visualizar diferenças (sem fazer mudanças)"
echo "3) Criar backup antes de sincronizar"
echo "4) Cancelar"
echo ""

read -p "Escolha (1-4): " option

case $option in
    1)
        print_status "Sincronizando (merge)..."
        echo ""

        # Fazer merge de main
        if git merge origin/main --no-edit; then
            print_success "Merge realizado com sucesso!"
            echo ""
            echo "Próximos passos:"
            echo "  1. Revisar as mudanças: git log --oneline -10"
            echo "  2. Testar a app: npm run dev"
            echo "  3. Rodar testes: npm run test && npm run e2e"
            echo "  4. Push dos commits: git push origin $CURRENT_BRANCH"
        else
            print_error "Houve um conflito durante o merge"
            echo ""
            echo "Para resolver:"
            echo "  1. Abra os arquivos com conflito (marcados com <<<<<<)"
            echo "  2. Escolha qual versão manter"
            echo "  3. Faça commit: git add . && git commit -m 'Resolve merge conflicts'"
            echo "  4. Ou cancele: git merge --abort"
            exit 1
        fi
        ;;
    2)
        print_status "Visualizando diferenças..."
        echo ""
        echo "Diferenças entre origin/main e HEAD:"
        git diff --stat origin/main..HEAD
        echo ""
        git diff origin/main..HEAD --no-color | head -100
        ;;
    3)
        print_status "Criando backup..."
        BACKUP_BRANCH="backup/$(date +%Y%m%d-%H%M%S)-$CURRENT_BRANCH"
        git branch $BACKUP_BRANCH
        print_success "Backup criado: $BACKUP_BRANCH"
        echo ""
        echo "Agora sincronizando..."
        if git merge origin/main --no-edit; then
            print_success "Merge realizado com sucesso!"
            echo "Backup mantido em: $BACKUP_BRANCH"
        else
            print_error "Houve um conflito. Seu backup está seguro em: $BACKUP_BRANCH"
            exit 1
        fi
        ;;
    4)
        print_status "Cancelando operação"
        exit 0
        ;;
    *)
        print_error "Opção inválida"
        exit 1
        ;;
esac

##############################################################################
# STEP 6: Resumo final
##############################################################################

echo ""
print_status "STEP 6: Resumo da sincronização"
echo ""
echo "Status final:"
git log --oneline -5
echo ""
print_success "Sincronização concluída!"

##############################################################################
# STEP 7: Próximos passos
##############################################################################

echo ""
echo "📋 PRÓXIMOS PASSOS:"
echo ""
echo "1️⃣  Testar a aplicação:"
echo "    npm install  # Se houver novos pacotes"
echo "    npm run dev  # Rodar localmente"
echo ""
echo "2️⃣  Rodar testes:"
echo "    npm run lint"
echo "    npm run test"
echo "    npm run e2e"
echo ""
echo "3️⃣  Fazer push (se tudo estiver ok):"
echo "    git push origin $CURRENT_BRANCH"
echo ""
echo "4️⃣  Verificar status:"
echo "    git status"
echo ""

##############################################################################
# Fim do script
##############################################################################

print_success "Script finalizado!"
