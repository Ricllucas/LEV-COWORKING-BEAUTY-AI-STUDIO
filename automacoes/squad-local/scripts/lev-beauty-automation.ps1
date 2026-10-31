param(
  [string]$Squad = 'lev-instagram-automacao',
  [string]$OpensquadBaseUrl = 'http://127.0.0.1:3737',
  [string]$ManifestPath = "$PSScriptRoot\..\pipeline\data\upload-post-queue.json",
  [int]$PollSeconds = 20,
  [int]$MaxMinutes = 180,
  [switch]$SkipGeneration,
  [switch]$DryRun
)

$ErrorActionPreference = 'Stop'
$manifestFullPath = [System.IO.Path]::GetFullPath($ManifestPath)

Write-Host ''
Write-Host 'LEV BEAUTY - ESTEIRA CHATGPT + UPLOAD-POST' -ForegroundColor White -BackgroundColor DarkBlue
Write-Host "Squad: $Squad" -ForegroundColor Cyan
Write-Host ''

$runStartedAt = Get-Date
if (-not $SkipGeneration) {
  $runBody = @{ squad = $Squad } | ConvertTo-Json
  try {
    $run = Invoke-RestMethod -Method Post -Uri "$OpensquadBaseUrl/api/run" -ContentType 'application/json' -Body $runBody
  } catch {
    throw "Nao foi possivel iniciar a squad em $OpensquadBaseUrl. Verifique se o Opensquad esta ativo. Detalhe: $($_.Exception.Message)"
  }

  $runId = [string]$run.runId
  if ([string]::IsNullOrWhiteSpace($runId) -and $run.data) { $runId = [string]$run.data.runId }
  Write-Host "Run iniciado: $runId" -ForegroundColor Green
  Write-Host 'A esteira pode pausar em checkpoints humanos. Resolva-os no Opensquad para continuar.' -ForegroundColor Yellow

  $deadline = (Get-Date).AddMinutes($MaxMinutes)
  do {
    if (Test-Path -LiteralPath $manifestFullPath) {
      $manifestItem = Get-Item -LiteralPath $manifestFullPath
      if ($manifestItem.LastWriteTime -ge $runStartedAt) {
        Write-Host "Manifesto gerado: $manifestFullPath" -ForegroundColor Green
        break
      }
    }

    if ((Get-Date) -ge $deadline) {
      throw "Tempo limite aguardando o manifesto: $manifestFullPath"
    }
    Write-Host "Aguardando criativos e manifesto... proxima verificacao em $PollSeconds s" -ForegroundColor DarkYellow
    Start-Sleep -Seconds $PollSeconds
  } while ($true)
} elseif (-not (Test-Path -LiteralPath $manifestFullPath)) {
  throw "-SkipGeneration exige um manifesto existente: $manifestFullPath"
}

$publisher = Join-Path $PSScriptRoot 'lev-beauty-upload-post-api.ps1'
& $publisher -ManifestPath $manifestFullPath -DryRun:$DryRun
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Host ''
Write-Host 'Esteira LEV concluida.' -ForegroundColor Green
