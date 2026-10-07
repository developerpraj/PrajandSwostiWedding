# Tests invite-link revoke/expiry/new-code behaviour.
# Usage: .\tests\Run-Tests.ps1
# 1) Runs tests/link-control.test.html in headless Chrome against the demo mock API.
# 2) Static checks that apps-script/Code.gs, js/admin.js and the Guests CSV are wired up.
$ErrorActionPreference = 'Stop'
$root = Split-Path $PSScriptRoot -Parent
$failed = 0

function Check($name, [bool]$ok) {
	if ($ok) { Write-Host "PASS $name" -ForegroundColor Green }
	else { Write-Host "FAIL $name" -ForegroundColor Red; $script:failed++ }
}

# ---------- Browser tests (demo mock) ----------
$chrome = @(
	"$env:ProgramFiles\Google\Chrome\Application\chrome.exe",
	"${env:ProgramFiles(x86)}\Google\Chrome\Application\chrome.exe",
	"$env:LOCALAPPDATA\Google\Chrome\Application\chrome.exe"
) | Where-Object { Test-Path $_ } | Select-Object -First 1

if (-not $chrome) {
	Check 'Chrome found (needed for browser tests)' $false
} else {
	$page = 'file:///' + ((Join-Path $root 'tests\link-control.test.html') -replace '\\', '/')
	$profile = Join-Path $env:TEMP ('wedding-tests-' + [guid]::NewGuid())
	$dom = & $chrome --headless=new --disable-gpu --no-first-run --user-data-dir="$profile" --allow-file-access-from-files --virtual-time-budget=5000 --dump-dom $page 2>$null | Out-String
	Remove-Item $profile -Recurse -Force -ErrorAction SilentlyContinue
	$m = [regex]::Match($dom, '<pre id="out">([\s\S]*?)</pre>')
	if (-not $m.Success) {
		Check 'browser test page produced output' $false
	} else {
		$text = [System.Net.WebUtility]::HtmlDecode($m.Groups[1].Value)
		foreach ($line in $text -split "`n") {
			if ($line -match '^(PASS|FAIL) (.*)$') { Check $Matches[2] ($Matches[1] -eq 'PASS') }
		}
		Check 'browser tests finished' ($text -match 'RESULT OK')
	}
}

# ---------- Static wiring checks ----------
$gs = (Get-ChildItem (Join-Path $root 'apps-script') -Filter *.gs | ForEach-Object { Get-Content $_.FullName -Raw }) -join "`n"
$admin = Get-Content (Join-Path $root 'js\admin.js') -Raw
$csv = Get-Content (Join-Path $root 'drive-backup\Wedding\Sheets\Guests.csv') -TotalCount 1

Check 'Code.gs: Guests schema has LinkRevoked + LinkExpires' ($gs -match "'InviteCode', 'LinkRevoked', 'LinkExpires'")
Check 'Code.gs: linkGuard_ defined' ($gs -match 'function linkGuard_\(g\)')
Check 'Code.gs: admin.linkControl registered' ($gs -match "'admin\.linkControl': adminLinkControl_")
Check 'Code.gs: guest actions are guarded' ($gs -match 'if \(data\.guestId\) linkGuard_\(tryGuest_\(data\.guestId\)\)')
Check 'Code.gs: invite code lookup is guarded' ($gs -match "Invitation code not found'\); \}\s*linkGuard_\(g\)")
Check 'Code.gs: sign-in is guarded' ($gs -match "linkGuard_\(g\);\s*log_\('signIn:'")
Check 'Code.gs: helpers cannot use linkControl' ($gs -notmatch 'admin\\\.\(login\|me[^\n]*linkControl')
Check 'admin.js: revoke/new code/expiry buttons' (($admin -match 'data-hh="revoke"') -and ($admin -match 'data-hh="newcode"') -and ($admin -match 'data-hh="expire"'))
Check 'admin.js: calls admin.linkControl' ($admin -match "call\('admin\.linkControl'")
Check 'Guests.csv: has new columns' ($csv -match 'InviteCode,LinkRevoked,LinkExpires')
Check 'apps-script: live publisher + health check defined' (($gs -match 'function publishLive_\(') -and ($gs -match 'function healthCheck\('))
Check 'apps-script: public writes are locked' ($gs -match 'PUBLIC_WRITE_ACTIONS\.indexOf\(action\) >= 0 \? withLock_')
Check 'admin.js: memory book export' ($admin -match "admin\.memoryBook")

Write-Host ''
if ($failed) { Write-Host "$failed test(s) FAILED" -ForegroundColor Red; exit 1 }
Write-Host 'All tests passed' -ForegroundColor Green
exit 0
