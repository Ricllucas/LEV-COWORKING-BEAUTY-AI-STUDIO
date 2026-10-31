param(
  [string]$ManifestPath = "$PSScriptRoot\..\pipeline\data\upload-post-queue.json",
  [string]$QueueCsv = "$PSScriptRoot\lev-beauty-upload-post-queue.csv"
)

$ErrorActionPreference = 'Stop'

if (-not (Test-Path -LiteralPath $ManifestPath)) {
  throw "Manifesto de criativos ainda nao foi gerado: $ManifestPath"
}

$manifest = Get-Content -LiteralPath $ManifestPath -Raw -Encoding UTF8 | ConvertFrom-Json
$items = @($manifest.posts)
if ($items.Count -eq 0) {
  throw "O manifesto nao possui posts para publicar: $ManifestPath"
}

$queue = foreach ($item in $items) {
  $mediaPaths = @($item.media_paths)
  if ($mediaPaths.Count -eq 0 -and $item.media_path) { $mediaPaths = @([string]$item.media_path) }
  if ($mediaPaths.Count -eq 0) { throw "Post sem media_paths no manifesto: $($item.content_id)" }

  $resolvedPaths = foreach ($mediaPath in $mediaPaths) {
    $expanded = [Environment]::ExpandEnvironmentVariables([string]$mediaPath)
    if (-not [System.IO.Path]::IsPathRooted($expanded)) {
      $expanded = Join-Path (Split-Path -Parent $ManifestPath) $expanded
    }
    if (-not (Test-Path -LiteralPath $expanded -PathType Leaf)) {
      throw "Criativo gerado nao encontrado: $expanded"
    }
    (Resolve-Path -LiteralPath $expanded).Path
  }

  [pscustomobject]@{
    date = [string]$item.date
    platform = 'instagram'
    media_path = ($resolvedPaths -join ';')
    caption = [string]$item.caption
    account = [string]$item.account
    link = [string]$item.link
    status = 'pending'
    request_id = ''
    job_id = ''
    published_url = ''
    last_error = ''
    updated_at = ''
  }
}

$queue | Export-Csv -LiteralPath $QueueCsv -NoTypeInformation -Encoding UTF8
Write-Host "Fila sincronizada: $QueueCsv" -ForegroundColor Green
Write-Host "Posts encontrados: $($items.Count)" -ForegroundColor Cyan
