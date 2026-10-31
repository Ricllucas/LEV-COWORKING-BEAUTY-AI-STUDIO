# Script de Setup Automático no Vercel (Windows)
# Executar: powershell -ExecutionPolicy Bypass -File scripts/setup-vercel.ps1

Write-Host "`n🚀 LEV Coworking Beauty - Setup Automático Vercel`n" -ForegroundColor Cyan
Write-Host "==================================================" -ForegroundColor Cyan
Write-Host ""

# Verificar se Vercel CLI está instalado
$vercelCheck = npm list -g vercel 2>$null
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Vercel CLI não encontrado" -ForegroundColor Red
    Write-Host "Instale com: npm install -g vercel" -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ Vercel CLI encontrado`n" -ForegroundColor Green

# Verificar se está logado
Write-Host "Verificando login no Vercel..." -ForegroundColor Yellow
$whoami = vercel whoami 2>$null
if ($whoami) {
    Write-Host "✅ Logado como: $whoami`n" -ForegroundColor Green
} else {
    Write-Host "⚠️  Você precisa se logar no Vercel" -ForegroundColor Yellow
    vercel login
}

Write-Host ""
Write-Host "📝 Agora você vai adicionar as variáveis de ambiente" -ForegroundColor Cyan
Write-Host "==================================================" -ForegroundColor Cyan
Write-Host ""

# Ler as credenciais
$AccessToken = Read-Host "Access Token (EAAG...)"
$PhoneNumberId = Read-Host "Phone Number ID (numeros)"
$AppSecret = Read-Host "App Secret"
$VerifyToken = Read-Host "Verify Token"

# Validação rápida
if ($AccessToken.Length -lt 50) {
    Write-Host "⚠️  Access Token parece muito curto. Verifique!" -ForegroundColor Yellow
}
if ($PhoneNumberId -notmatch '^\d{10,}$') {
    Write-Host "⚠️  Phone Number ID deve ser numerico. Verifique!" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "⏳ Configurando variáveis no Vercel..." -ForegroundColor Yellow
Write-Host ""

# Adicionar variáveis (uma por uma para Windows)
Write-Host "Adicionando WHATSAPP_ACCESS_TOKEN..." -ForegroundColor Gray
vercel env add WHATSAPP_ACCESS_TOKEN $AccessToken production staging development

Write-Host "Adicionando WHATSAPP_PHONE_NUMBER_ID..." -ForegroundColor Gray
vercel env add WHATSAPP_PHONE_NUMBER_ID $PhoneNumberId production staging development

Write-Host "Adicionando WHATSAPP_APP_SECRET..." -ForegroundColor Gray
vercel env add WHATSAPP_APP_SECRET $AppSecret production staging development

Write-Host "Adicionando WHATSAPP_VERIFY_TOKEN..." -ForegroundColor Gray
vercel env add WHATSAPP_VERIFY_TOKEN $VerifyToken production staging development

Write-Host ""
Write-Host "✅ Variáveis adicionadas com sucesso!" -ForegroundColor Green
Write-Host ""

Write-Host "📋 Verificando configuração..." -ForegroundColor Yellow
vercel env list

Write-Host ""
Write-Host "🔄 Redeployando para aplicar mudanças..." -ForegroundColor Yellow
vercel --prod

Write-Host ""
Write-Host "✅ Setup completo!" -ForegroundColor Green
Write-Host ""
Write-Host "Próximos passos:" -ForegroundColor Cyan
Write-Host "1. Verificar se deployment foi bem-sucedido" -ForegroundColor Gray
Write-Host "2. Rodar validação: npx tsx scripts/validate-whatsapp.ts" -ForegroundColor Gray
Write-Host "3. Testar agendamento no app" -ForegroundColor Gray
Write-Host ""
