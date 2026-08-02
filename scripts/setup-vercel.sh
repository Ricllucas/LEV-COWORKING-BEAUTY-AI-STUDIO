#!/bin/bash

# Script de Setup Automático no Vercel
# Uso: bash scripts/setup-vercel.sh

echo "🚀 LEV Coworking Beauty - Setup Automático Vercel"
echo "=================================================="
echo ""

# Verificar se Vercel CLI está instalado
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI não encontrado"
    echo "Instale com: npm install -g vercel"
    exit 1
fi

echo "✅ Vercel CLI encontrado"
echo ""

# Verificar se está logado
echo "Verificando login no Vercel..."
if vercel whoami > /dev/null 2>&1; then
    echo "✅ Já logado no Vercel"
else
    echo "⚠️  Você precisa se logar no Vercel"
    vercel login
fi

echo ""
echo "📝 Agora você vai adicionar as variáveis de ambiente"
echo "=================================================="
echo ""

# Ler as credenciais
read -p "Access Token (EAAG...): " ACCESS_TOKEN
read -p "Phone Number ID (numeros): " PHONE_NUMBER_ID
read -p "App Secret: " APP_SECRET
read -p "Verify Token: " VERIFY_TOKEN

echo ""
echo "⏳ Configurando variáveis no Vercel..."
echo ""

# Adicionar variáveis
vercel env add WHATSAPP_ACCESS_TOKEN "$ACCESS_TOKEN" production staging development
vercel env add WHATSAPP_PHONE_NUMBER_ID "$PHONE_NUMBER_ID" production staging development
vercel env add WHATSAPP_APP_SECRET "$APP_SECRET" production staging development
vercel env add WHATSAPP_VERIFY_TOKEN "$VERIFY_TOKEN" production staging development

echo ""
echo "✅ Variáveis adicionadas com sucesso!"
echo ""

echo "📋 Verificando configuração..."
vercel env list

echo ""
echo "🔄 Redeployando para aplicar mudanças..."
vercel --prod

echo ""
echo "✅ Setup completo!"
echo ""
echo "Próximos passos:"
echo "1. Verificar se deployment foi bem-sucedido"
echo "2. Rodar validação: npx tsx scripts/validate-whatsapp.ts"
echo "3. Testar agendamento no app"
echo ""
