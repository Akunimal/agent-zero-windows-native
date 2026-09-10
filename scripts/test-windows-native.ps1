$ErrorActionPreference = "Stop"
Set-StrictMode -Version Latest
$RepoRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
$Python = if (Test-Path (Join-Path $RepoRoot ".venv\Scripts\python.exe")) {
    Join-Path $RepoRoot ".venv\Scripts\python.exe"
} elseif (Test-Path (Join-Path $RepoRoot ".a0-build\venv\Scripts\python.exe")) {
    Join-Path $RepoRoot ".a0-build\venv\Scripts\python.exe"
} else {
    "python"
}
Push-Location $RepoRoot
try {
    if (-not (Get-Command uv -ErrorAction SilentlyContinue)) {
        throw "uv is required to provision pytest for contract tests"
    }
    & uv pip install --python $Python pytest
    if ($LASTEXITCODE -ne 0) { throw "Could not install pytest for contract tests" }
    & $Python -m pytest tests/windows-native -q
    if ($LASTEXITCODE -ne 0) { throw "Python native contract tests failed" }
    node --check electron/main.cjs
    node --check electron/preload.cjs
    node --check windows-native/node_eval.cjs
    if ($LASTEXITCODE -ne 0) { throw "Node native contract syntax check failed" }
    Push-Location electron
    try {
        npm test
        if ($LASTEXITCODE -ne 0) { throw "Electron contract tests failed" }
    }
    finally {
        Pop-Location
    }
    Write-Host "Windows native contract tests passed."
}
finally {
    Pop-Location
}
