param(
  [string]$QueueCsv = "$PSScriptRoot\lev-beauty-upload-post-queue.csv",
  [string]$ManifestPath = "$PSScriptRoot\..\pipeline\data\upload-post-queue.json",
  [switch]$SkipQueueSync,
  [switch]$DryRun
)

$ErrorActionPreference = 'Stop'
$apiUrl = 'https://api.upload-post.com/api/upload_photos'
$apiKey = [Environment]::GetEnvironmentVariable('UPLOAD_POST_API_KEY', 'User')
$profile = [Environment]::GetEnvironmentVariable('UPLOAD_POST_PROFILE', 'User')
if ([string]::IsNullOrWhiteSpace($profile)) { $profile = 'lev-beauty' }

if (-not (Test-Path -LiteralPath $QueueCsv)) {
  throw "Fila nao encontrada: $QueueCsv"
}

if (-not $SkipQueueSync) {
  $syncScript = Join-Path $PSScriptRoot 'lev-beauty-sync-generated-queue.ps1'
  & $syncScript -ManifestPath $ManifestPath -QueueCsv $QueueCsv
}

if (-not $DryRun -and [string]::IsNullOrWhiteSpace($apiKey)) {
  throw 'Defina UPLOAD_POST_API_KEY nas variaveis de ambiente do usuario antes de publicar.'
}

function New-MultipartContent {
  param(
    [object]$Row,
    [string]$ProfileName
  )

  $multipart = New-Object System.Net.Http.MultipartFormDataContent
  $fields = @{
    user = $ProfileName
    'platform[]' = 'instagram'
    title = [string]$Row.caption
    async_upload = 'true'
  }

  $mode = ([string]$Row.publish_mode).Trim().ToLowerInvariant()
  if ($mode -eq 'schedule' -and -not [string]::IsNullOrWhiteSpace([string]$Row.scheduled_date)) {
    $fields.scheduled_date = [string]$Row.scheduled_date
    if (-not [string]::IsNullOrWhiteSpace([string]$Row.timezone)) {
      $fields.timezone = [string]$Row.timezone
    }
  } elseif ($mode -ne 'publish') {
    $fields.add_to_queue = 'true'
  }

  foreach ($field in $fields.GetEnumerator()) {
    $multipart.Add((New-Object System.Net.Http.StringContent($field.Value)), $field.Key)
  }

  $mediaPaths = ([string]$Row.media_path).Split(';') |
    ForEach-Object { $_.Trim() } |
    Where-Object { $_ -ne '' }
  if ($mediaPaths.Count -eq 0) {
    $multipart.Dispose()
    throw "media_path vazio para a linha $($Row.date)"
  }

  foreach ($mediaPath in $mediaPaths) {
    $resolvedPath = [Environment]::ExpandEnvironmentVariables($mediaPath)
    if (-not [System.IO.Path]::IsPathRooted($resolvedPath)) {
      $resolvedPath = Join-Path (Split-Path -Parent $QueueCsv) $resolvedPath
    }
    if (-not (Test-Path -LiteralPath $resolvedPath -PathType Leaf)) {
      $multipart.Dispose()
      throw "Arquivo de midia nao encontrado: $resolvedPath"
    }

    $stream = [System.IO.File]::OpenRead($resolvedPath)
    $fileContent = New-Object System.Net.Http.StreamContent($stream)
    $fileContent.Headers.ContentType = New-Object System.Net.Http.Headers.MediaTypeHeaderValue('application/octet-stream')
    $multipart.Add($fileContent, 'photos[]', [System.IO.Path]::GetFileName($resolvedPath))
  }

  return $multipart
}

$rows = @(Import-Csv -LiteralPath $QueueCsv)
[string[]]$resultColumns = @('request_id', 'job_id', 'published_url', 'last_error', 'updated_at')
foreach ($row in $rows) {
  foreach ($column in $resultColumns) {
    if (-not $row.PSObject.Properties[$column]) {
      $row | Add-Member -NotePropertyName $column -NotePropertyValue ''
    }
  }
}
[void][System.Reflection.Assembly]::LoadWithPartialName('System.Net.Http')
$client = New-Object System.Net.Http.HttpClient
if (-not [string]::IsNullOrWhiteSpace($apiKey)) {
  $client.DefaultRequestHeaders.Add('Authorization', "Apikey $apiKey")
}

$processed = 0
$successful = 0
$failed = 0

try {
  foreach ($row in $rows) {
    $status = ([string]$row.status).Trim().ToLowerInvariant()
    if ($status -notin @('pending', 'retry')) { continue }
    $processed++

    try {
      if ($DryRun) {
        $row.status = 'dry-run'
        $row.last_error = ''
        Write-Host "DRY-RUN | $($row.date) | $($row.media_path)" -ForegroundColor Yellow
        continue
      }

      $content = New-MultipartContent -Row $row -ProfileName $profile
      try {
        $response = $client.PostAsync($apiUrl, $content).GetAwaiter().GetResult()
        $body = $response.Content.ReadAsStringAsync().GetAwaiter().GetResult()
      } finally {
        $content.Dispose()
      }

      $result = $body | ConvertFrom-Json
      if (-not $response.IsSuccessStatusCode -or $result.success -ne $true) {
        $errorMessage = [string]$result.message
        if ([string]::IsNullOrWhiteSpace($errorMessage)) { $errorMessage = [string]$result.error }
        if ([string]::IsNullOrWhiteSpace($errorMessage)) { $errorMessage = "HTTP $([int]$response.StatusCode)" }
        throw $errorMessage
      }

      $row.status = if (([string]$row.publish_mode).Trim().ToLowerInvariant() -eq 'schedule') { 'scheduled' } else { 'posted' }
      $row.request_id = [string]$result.request_id
      $row.job_id = [string]$result.job_id
      $row.published_url = [string]$result.results.instagram.url
      $row.last_error = ''
      $row.updated_at = (Get-Date).ToUniversalTime().ToString('o')
      $successful++
      Write-Host "OK | $($row.date) | $($row.status) | $($row.request_id)$($row.job_id)" -ForegroundColor Green
    } catch {
      $row.status = 'failed'
      $row.last_error = $_.Exception.Message
      $row.updated_at = (Get-Date).ToUniversalTime().ToString('o')
      $failed++
      Write-Host "ERRO | $($row.date) | $($row.last_error)" -ForegroundColor Red
    }
  }
} finally {
  $client.Dispose()
}

$rows | Export-Csv -LiteralPath $QueueCsv -NoTypeInformation -Encoding UTF8
Write-Host "Processados: $processed | Sucesso: $successful | Falhas: $failed" -ForegroundColor Cyan
if ($failed -gt 0) { exit 1 }
