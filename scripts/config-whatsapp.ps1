# Script para Configurar WhatsApp no Vercel (Windows)
# Execute: powershell -ExecutionPolicy Bypass -File scripts/config-whatsapp.ps1

Write-Host ""
Write-Host "🚀 LEV Coworking Beauty - Configuração WhatsApp" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

# Cores
$success = "Green"
$warning = "Yellow"
$error_color = "Red"
$info = "Cyan"

# Função para pedir input seguro
function Read-SecureInput {
    param([string]$prompt)
    Write-Host $prompt -ForegroundColor $info -NoNewline
    Read-Host
}

# Verificar se .env.local existe
if (-not (Test-Path ".env.local")) {
    Write-Host "❌ Arquivo .env.local não encontrado!" -ForegroundColor $error_color
    Write-Host "Execute primeiro: npm install" -ForegroundColor $warning
    exit 1
}

Write-Host "✅ Arquivo .env.local encontrado" -ForegroundColor $success
Write-Host ""

# Ler as credenciais que você vai fornecer
Write-Host "📝 Digite as 2 credenciais:" -ForegroundColor $info
Write-Host ""

$accessToken = Read-SecureInput "➤ ACCESS_TOKEN (EAAG...): "
$appSecret = Read-SecureInput "➤ APP_SECRET (~32 chars): "

Write-Host ""

# Validações rápidas
$errors = @()

if ($accessToken.Length -lt 50) {
    $errors += "⚠️  Access Token parece muito curto (menos de 50 caracteres)"
}

if ($accessToken -notlike "EAAG*") {
    $errors += "⚠️  Access Token não começa com EAAG"
}

if ($appSecret.Length -lt 20) {
    $errors += "⚠️  App Secret muito curto"
}

if ($errors.Count -gt 0) {
    Write-Host "⚠️  AVISOS:" -ForegroundColor $warning
    foreach ($error in $errors) {
        Write-Host "   $error" -ForegroundColor $warning
    }
    Write-Host ""
    $confirm = Read-Host "Continuar mesmo assim? (S/N)"
    if ($confirm -ne "S" -and $confirm -ne "s") {
        Write-Host "Cancelado." -ForegroundColor $warning
        exit 0
    }
}

Write-Host ""
Write-Host "⏳ Atualizando .env.local..." -ForegroundColor $warning

# Ler arquivo atual
$envContent = Get-Content ".env.local" -Raw

# Atualizar os valores
$envContent = $envContent -replace 'WHATSAPP_ACCESS_TOKEN=.*', "WHATSAPP_ACCESS_TOKEN=$accessToken"
$envContent = $envContent -replace 'WHATSAPP_APP_SECRET=.*', "WHATSAPP_APP_SECRET=$appSecret"

# Salvar
Set-Content -Path ".env.local" -Value $envContent -Encoding UTF8

Write-Host "✅ .env.local atualizado!" -ForegroundColor $success
Write-Host ""

# Mostrar resumo
Write-Host "📋 Resumo da Configuração:" -ForegroundColor $info
Write-Host "   PHONE_NUMBER_ID: 1946099376099741" -ForegroundColor $success
Write-Host "   ACCESS_TOKEN: $($accessToken.Substring(0, 20))..." -ForegroundColor $success
Write-Host "   APP_SECRET: $($appSecret.Substring(0, 15))..." -ForegroundColor $success
Write-Host "   VERIFY_TOKEN: Lev_Coworking_..." -ForegroundColor $success
Write-Host ""

# Próximos passos
Write-Host "📌 Próximos passos:" -ForegroundColor $info
Write-Host "   1. Vercel CLI: npm install -g vercel" -ForegroundColor $warning
Write-Host "   2. Login: vercel login" -ForegroundColor $warning
Write-Host "   3. Setup: powershell -ExecutionPolicy Bypass -File scripts/setup-vercel.ps1" -ForegroundColor $warning
Write-Host "   4. Validar: npx tsx scripts/validate-whatsapp.ts" -ForegroundColor $warning
Write-Host ""

Write-Host "✅ Credenciais configuradas localmente!" -ForegroundColor $success
Write-Host ""
