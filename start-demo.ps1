# Starts the local server and opens the app in Chrome.
#   .\start-demo.ps1            -> demo mode (fake data)
#   .\start-demo.ps1 -Mode prod -> prod mode (real Apps Script backend)
param([ValidateSet('demo', 'prod')][string]$Mode = 'demo', [int]$Port = 8080)
Set-Location $PSScriptRoot

$up = $false
try { $up = (Invoke-WebRequest "http://localhost:$Port/index.html" -UseBasicParsing -TimeoutSec 2).StatusCode -eq 200 } catch { }
if (-not $up) {
  Start-Process python -ArgumentList '-m', 'http.server', $Port -WorkingDirectory $PSScriptRoot -WindowStyle Minimized
  Start-Sleep 2
}

$chrome = @(
  "$env:ProgramFiles\Google\Chrome\Application\chrome.exe",
  "${env:ProgramFiles(x86)}\Google\Chrome\Application\chrome.exe",
  "$env:LOCALAPPDATA\Google\Chrome\Application\chrome.exe"
) | Where-Object { Test-Path $_ } | Select-Object -First 1
if (-not $chrome) { Write-Error 'Google Chrome not found.'; exit 1 }

$base = "http://localhost:$Port"
& $chrome --new-window "$base/index.html?mode=$Mode" "$base/ceremony.html?mode=$Mode" "$base/admin/index.html?mode=$Mode"
Write-Host "Opened in Chrome ($Mode mode). Admin passcode in demo mode: demo"
