# Script simples para configurar credenciais
Write-Host ""
Write-Host "Configure WhatsApp - LEV Coworking Beauty" -ForegroundColor Cyan
Write-Host ""

# Ler credenciais
$token = Read-Host "Cole o ACCESS_TOKEN"
$secret = Read-Host "Cole o APP_SECRET"

Write-Host ""
Write-Host "Atualizando .env.local..." -ForegroundColor Yellow

# Ler arquivo
$content = Get-Content ".env.local" -Raw

# Atualizar valores
$content = $content -replace 'WHATSAPP_ACCESS_TOKEN=seu_access_token_aqui', "WHATSAPP_ACCESS_TOKEN=$token"
$content = $content -replace 'WHATSAPP_APP_SECRET=seu_app_secret_aqui', "WHATSAPP_APP_SECRET=$secret"

# Salvar
Set-Content -Path ".env.local" -Value $content -Encoding UTF8

Write-Host "Pronto! Credenciais configuradas." -ForegroundColor Green
Write-Host ""
Get-Content ".env.local"
