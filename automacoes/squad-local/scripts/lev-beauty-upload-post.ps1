param(
  [string]$QueueCsv = "",
  [switch]$OpenOnly
)

$ErrorActionPreference = 'Stop'

$root = 'C:\Users\ricll\.squads100'
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
Write-Host "  LEV BEAUTY — UPLOAD-POST PREP" -ForegroundColor White -BackgroundColor DarkBlue
Write-Host "════════════════════════════════════════════════════════════" -ForegroundColor DarkGray
Write-Host ""
Write-Host "Fila: $QueueCsv" -ForegroundColor Cyan
Write-Host "Portal: $uploadUrl" -ForegroundColor Cyan
Write-Host ""

if (-not $OpenOnly) {
  Write-Host "▶ 1) Acesse o Upload-Post e faça login com o e-mail de gestão da conta." -ForegroundColor Yellow
  Write-Host "▶ 2) Importe a fila do CSV ou use os arquivos de criativo para agendar as postagens." -ForegroundColor Yellow
  Write-Host "▶ 3) Publique com a legenda, link e conta da LEV Beauty configurados." -ForegroundColor Yellow
  Write-Host ""
}

Write-Host "▶ Abrindo página do Upload-Post..." -ForegroundColor Green
Start-Process $uploadUrl

Write-Host ""
Write-Host "✔ Fila gerada para importação. Ajuste os caminhos dos arquivos antes da publicação real." -ForegroundColor Green
Write-Host "✔ Este ponto de entrada prepara o workflow e a conta da LEV para publicação com o Upload-Post." -ForegroundColor Green
Write-Host ""
Write-Host "Dica: se a plataforma expuser API privada ou webhook, conecte esse fluxo ao n8n para automação completa." -ForegroundColor Cyan
