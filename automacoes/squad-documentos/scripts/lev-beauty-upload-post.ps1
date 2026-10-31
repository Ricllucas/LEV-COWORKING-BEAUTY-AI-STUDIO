param(
  [string]$QueueCsv = "",
  [switch]$OpenOnly
)

$ErrorActionPreference = 'Stop'

$root = 'C:\Users\ricll\Documents\Squads100'
$defaultQueue = Join-Path $root 'scripts\lev-beauty-upload-post-queue.csv'
$uploadUrl = 'https://app.upload-post.com/manage-users'

if ([string]::IsNullOrWhiteSpace($QueueCsv)) {
  $QueueCsv = $defaultQueue
}

if (-not (Test-Path $QueueCsv)) {
  @(
    'date,platform,media_path,caption,account,link,status',
    '2026-08-13,instagram,C:\caminho\para\arquivo\post-1.jpg,Seu cuidado merece um espaço pensado para você.,LEV Beauty,https://instagram.com/levcoworkingbeauty,pending',
    '2026-08-14,instagram,C:\caminho\para\arquivo\post-2.jpg,Quando você se sente bem, a confiança aparece.,LEV Beauty,https://instagram.com/levcoworkingbeauty,pending',
    '2026-08-15,instagram,C:\caminho\para\arquivo\carrossel-1.zip,Seu momento merece uma produção impecável.,LEV Beauty,https://instagram.com/levcoworkingbeauty,pending'
  ) | Set-Content -Path $QueueCsv -Encoding UTF8
}

Write-Host "" 
Write-Host "════════════════════════════════════════════════════════════" -ForegroundColor DarkGray
Write-Host "  LEV BEAUTY — AUTOMACAO UPLOAD-POST" -ForegroundColor White -BackgroundColor DarkBlue
Write-Host "════════════════════════════════════════════════════════════" -ForegroundColor DarkGray
Write-Host ""
Write-Host "Fila pronta: $QueueCsv" -ForegroundColor Cyan
Write-Host "Site alvo: $uploadUrl" -ForegroundColor Cyan
Write-Host ""

if (-not $OpenOnly) {
  Write-Host "▶ Passo 1: Faça login no Upload-Post manualmente no navegador." -ForegroundColor Yellow
  Write-Host "▶ Passo 2: No painel, importe ou crie a fila de posts." -ForegroundColor Yellow
  Write-Host "▶ Passo 3: Use os arquivos criativos da pasta de conteúdo da LEV." -ForegroundColor Yellow
  Write-Host "▶ Passo 4: Publique com legenda, link e conta correta." -ForegroundColor Yellow
  Write-Host ""
}

Write-Host "▶ Abrindo Upload-Post em: $uploadUrl" -ForegroundColor Green
Start-Process $uploadUrl

Write-Host ""
Write-Host "✔ A fila de posts foi gerada para importacao. Ajuste os caminhos reais dos arquivos antes de publicar." -ForegroundColor Green
Write-Host "✔ Estrutura pronta para posts em imagem premium e carrossel da LEV Beauty." -ForegroundColor Green
Write-Host ""
Write-Host "Dica: para automatizar de verdade, conecte o Upload-Post com uma API/fluxo do n8n e use esta fila como input." -ForegroundColor Cyan
