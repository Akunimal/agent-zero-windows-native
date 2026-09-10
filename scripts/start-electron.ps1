param(
    [string]$Python = ""
)

$ErrorActionPreference = "Stop"
$RepoRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
$pythonPath = $Python
if (-not $pythonPath) {
    $pythonPath = Join-Path $RepoRoot ".venv\Scripts\python.exe"
}
if (-not (Test-Path $pythonPath)) {
    throw "Python 3.12 development environment not found. Run: uv venv --python 3.12 .venv"
}
$env:A0_PYTHON_EXECUTABLE = $pythonPath
$env:A0_NATIVE_WINDOWS = "1"
Push-Location (Join-Path $RepoRoot "electron")
try {
    & npm run dev
    exit $LASTEXITCODE
}
finally {
    Pop-Location
}
