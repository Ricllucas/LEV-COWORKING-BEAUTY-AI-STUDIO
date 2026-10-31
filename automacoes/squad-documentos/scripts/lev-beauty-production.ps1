param(
  [string]$Squad = 'lev-instagram-automacao',
  [switch]$StartN8n,
  [switch]$OpenDashboard,
  [switch]$OpenUploadPost,
  [switch]$AutoAnswerSafe,
  [string]$AnswerText = 'Aprovar pauta completa',
  [int]$PollSeconds = 20,
  [int]$HumanCheckpointGraceMinutes = 45
)

$ErrorActionPreference = 'Stop'

$projectRoot = 'C:\Users\ricll\.squads100'
$verboRoot = 'C:\Users\ricll\Documents\Squads100'
$workRoot = $verboRoot

Write-Host ""
Write-Host "════════════════════════════════════════════════════════════" -ForegroundColor DarkGray
Write-Host "  LEV BEAUTY — PRODUCAO PREMIUM DE CONTEUDO" -ForegroundColor White -BackgroundColor DarkBlue
Write-Host "════════════════════════════════════════════════════════════" -ForegroundColor DarkGray
Write-Host ""
Write-Host "Squad ativa: $Squad" -ForegroundColor Cyan
Write-Host "Formato principal: imagem premium + carrossel elegante" -ForegroundColor Green
Write-Host "Objetivo: engajamento, curtidas, comentarios e leads" -ForegroundColor Green
Write-Host ""

if ($StartN8n) {
  $n8nScript = Join-Path $workRoot 'n8n\start-n8n.ps1'
  if (Test-Path $n8nScript) {
    Write-Host "▶ Iniciando n8n..." -ForegroundColor Yellow
    & $n8nScript
  } else {
    Write-Host "❌ Arquivo do n8n nao encontrado: $n8nScript" -ForegroundColor Red
    exit 1
  }
}

if ($OpenDashboard) {
  $dashboardScript = Join-Path $projectRoot 'dashboard-static\generate.js'
  if (Test-Path $projectRoot) {
    Write-Host "▶ Iniciando dashboard local..." -ForegroundColor Yellow
    Set-Location $projectRoot
    npm run dashboard
  }
}

if ($OpenUploadPost) {
  $uploadScript = Join-Path $workRoot 'scripts\lev-beauty-upload-post.ps1'
  if (Test-Path $uploadScript) {
    Write-Host "▶ Abrindo ponto de publicação do Upload-Post..." -ForegroundColor Yellow
    & $uploadScript -OpenOnly
  }
}

Write-Host ""
Write-Host "▶ Fluxo de producao LEV Beauty pronto para execucao." -ForegroundColor Green
Write-Host "▶ Proximo passo: gerar criativos, validar fila e publicar via Upload-Post." -ForegroundColor Green
Write-Host "▶ Portal do Upload-Post: https://app.upload-post.com/manage-users" -ForegroundColor Cyan
Write-Host ""
