param([string]$Ref = "main")

$ErrorActionPreference = "Stop"
Set-StrictMode -Version Latest
$RepoRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
Push-Location $RepoRoot
try {
    $status = git status --porcelain
    if ($status) {
        throw "Working tree is not clean. Commit or stash changes before syncing upstream."
    }
    git remote get-url upstream *> $null
    if ($LASTEXITCODE -ne 0) {
        git remote add upstream https://github.com/agent0ai/agent-zero.git
    }
    git fetch --no-tags upstream $Ref
    $branch = "sync/upstream-$((Get-Date).ToUniversalTime().ToString('yyyyMMdd-HHmmss'))"
    git switch -c $branch
    git merge --no-ff --no-edit "upstream/$Ref"
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Merge stopped. Resolve conflicts, then run the native contract tests." -ForegroundColor Yellow
        exit 2
    }
    & (Join-Path $PSScriptRoot "test-windows-native.ps1")
    if ($LASTEXITCODE -ne 0) { throw "Native contract tests failed after upstream merge" }
    Write-Host "Upstream sync branch created: $branch"
}
finally {
    Pop-Location
}
