$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$port = if ($env:PORT) { [int]$env:PORT } else { 3000 }
$hostAddress = if ($env:HOST) { $env:HOST } else { "127.0.0.1" }
$url = "http://${hostAddress}:${port}"
$env:PORT = [string]$port
$env:HOST = $hostAddress

$server = Start-Process -FilePath "node" `
    -ArgumentList @((Join-Path $root "app\server.js")) `
    -WorkingDirectory $root `
    -NoNewWindow `
    -PassThru

try {
    $ready = $false
    for ($attempt = 0; $attempt -lt 40; $attempt++) {
        if ($server.HasExited) {
            throw "AFE backend exited before becoming ready."
        }
        try {
            $health = Invoke-RestMethod -Uri "$url/api/health" -TimeoutSec 1
            if ($health.status -eq "ok") {
                $ready = $true
                break
            }
        } catch {
            Start-Sleep -Milliseconds 250
        }
    }
    if (-not $ready) {
        throw "AFE backend did not become ready at $url."
    }

    Write-Host "Opening AFE Builder at $url"
    Start-Process $url
    Write-Host "AFE Builder is running. Press Ctrl+C to stop."
    Wait-Process -Id $server.Id
} finally {
    $runningServer = Get-Process -Id $server.Id -ErrorAction SilentlyContinue
    if ($runningServer) {
        Stop-Process -Id $server.Id
    }
}
