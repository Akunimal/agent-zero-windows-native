param(
    [string]$PythonVersion = $(if ($env:A0_PYTHON_VERSION) { $env:A0_PYTHON_VERSION } else { "3.12.13" }),
    [string]$NodeVersion = $(if ($env:A0_NODE_VERSION) { $env:A0_NODE_VERSION } else { "22.14.0" })
)

$ErrorActionPreference = "Stop"
Set-StrictMode -Version Latest

$RepoRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
$BuildRoot = Join-Path $RepoRoot ".a0-build"
$StageRoot = Join-Path $BuildRoot "staging"
$PythonStage = Join-Path $StageRoot "python"
$NodeStage = Join-Path $StageRoot "node"
$ChromiumStage = Join-Path $StageRoot "chromium"
$BackendStage = Join-Path $StageRoot "backend"
$VenvRoot = Join-Path $BuildRoot "venv"
$VenvPython = Join-Path $VenvRoot "Scripts\python.exe"

function Invoke-Robocopy {
    param([string]$Source, [string]$Destination, [string[]]$Arguments = @())
    & robocopy.exe $Source $Destination @Arguments | Out-Host
    if ($LASTEXITCODE -gt 7) {
        throw "robocopy failed with exit code ${LASTEXITCODE}: $Source -> $Destination"
    }
}

function Ensure-Tool {
    param([string]$Name)
    if (-not (Get-Command $Name -ErrorAction SilentlyContinue)) {
        throw "Required build tool not found: $Name"
    }
}

Ensure-Tool "uv"
Ensure-Tool "npm"

Write-Host "[A0] Preparing clean staging at $StageRoot"
if (Test-Path $StageRoot) {
    $resolvedStage = (Resolve-Path $StageRoot).Path
    if (-not $resolvedStage.StartsWith($BuildRoot, [StringComparison]::OrdinalIgnoreCase)) {
        throw "Refusing to remove staging outside $BuildRoot"
    }
    Remove-Item -LiteralPath $StageRoot -Recurse -Force
}
New-Item -ItemType Directory -Force -Path $PythonStage, $NodeStage, $ChromiumStage, $BackendStage | Out-Null

Write-Host "[A0] Ensuring standalone CPython $PythonVersion"
& uv python install $PythonVersion
if ($LASTEXITCODE -ne 0) { throw "uv python install failed" }
$UvPythonDir = (& uv python dir).Trim()
$PythonHome = Join-Path $UvPythonDir "cpython-$PythonVersion-windows-x86_64-none"
if (-not (Test-Path (Join-Path $PythonHome "python.exe"))) {
    throw "Standalone Python home was not found: $PythonHome"
}
Invoke-Robocopy $PythonHome $PythonStage @("/E", "/NFL", "/NDL", "/NJH", "/NJS", "/NP", "/XD", "__pycache__")

Write-Host "[A0] Installing Python wheels into the bundled interpreter"
& uv venv --python $PythonVersion --clear $VenvRoot
if ($LASTEXITCODE -ne 0) { throw "uv venv failed" }
& uv pip install --python $VenvPython -r (Join-Path $RepoRoot "requirements.txt")
if ($LASTEXITCODE -ne 0) { throw "Python dependency installation failed" }
& uv pip install --python $VenvPython --target (Join-Path $PythonStage "Lib\site-packages") -r (Join-Path $RepoRoot "requirements.txt")
if ($LASTEXITCODE -ne 0) { throw "Bundled Python wheel installation failed" }

Write-Host "[A0] Downloading pinned Chrome for Testing for Patchright"
$chromiumVersion = "149.0.7827.55"
$chromiumUrl = "https://cdn.playwright.dev/builds/cft/$chromiumVersion/win64/chrome-win64.zip"
$chromiumZip = Join-Path $BuildRoot "chrome-win64-$chromiumVersion.zip"
if (-not (Test-Path $chromiumZip)) {
    Invoke-WebRequest -Uri $chromiumUrl -OutFile $chromiumZip
}
$chromiumHash = (Get-FileHash -LiteralPath $chromiumZip -Algorithm SHA256).Hash.ToUpperInvariant()
$expectedChromiumHash = "EBC0C2B75E2EA98151A7F18FF47037BFCBAB44A8660E79B9FFA6520F9B7607AB"
if ($chromiumHash -ne $expectedChromiumHash) {
    throw "Chromium checksum mismatch: expected $expectedChromiumHash, got $chromiumHash"
}
$chromiumExtract = Join-Path $BuildRoot "chromium-extract"
if (Test-Path $chromiumExtract) { Remove-Item -LiteralPath $chromiumExtract -Recurse -Force }
Expand-Archive -LiteralPath $chromiumZip -DestinationPath $chromiumExtract
$chromiumSource = Join-Path $chromiumExtract "chrome-win64"
if (-not (Test-Path (Join-Path $chromiumSource "chrome.exe"))) {
    throw "Pinned Chromium archive did not contain chrome-win64/chrome.exe"
}
Invoke-Robocopy $chromiumSource (Join-Path $ChromiumStage "chrome-win64") @(
    "/E", "/NFL", "/NDL", "/NJH", "/NJS", "/NP"
)

Write-Host "[A0] Staging the public Agent Zero backend"
Invoke-Robocopy $RepoRoot $BackendStage @(
    "/E", "/NFL", "/NDL", "/NJH", "/NJS", "/NP",
    "/XD", ".git", ".a0-build", "artifacts", "node_modules", ".a0-dev-data", "usr", "tmp", "logs", "memory", "electron", "tests",
    "/XF", "*.pyc", "*.pyo", ".env"
)
New-Item -ItemType Directory -Force -Path (Join-Path $BackendStage "usr") | Out-Null

Write-Host "[A0] Downloading verified portable Node.js $NodeVersion"
$nodeZip = Join-Path $BuildRoot "node-v$NodeVersion-win-x64.zip"
$nodeExtract = Join-Path $BuildRoot "node-extract"
$nodeUrl = "https://nodejs.org/dist/v$NodeVersion/node-v$NodeVersion-win-x64.zip"
$checksumsUrl = "https://nodejs.org/dist/v$NodeVersion/SHASUMS256.txt"
if (-not (Test-Path $nodeZip)) { Invoke-WebRequest -Uri $nodeUrl -OutFile $nodeZip }
$checksumsFile = Join-Path $BuildRoot "SHASUMS256-node-v$NodeVersion.txt"
if (-not (Test-Path $checksumsFile)) {
    Invoke-WebRequest -UseBasicParsing -Uri $checksumsUrl -OutFile $checksumsFile
}
$checksums = Get-Content -LiteralPath $checksumsFile -Raw
$checksumLine = ($checksums -split "`r?`n" | Where-Object { $_ -match "node-v$([regex]::Escape($NodeVersion))-win-x64\.zip" } | Select-Object -First 1)
if (-not $checksumLine) { throw "Node checksum was not published for $NodeVersion" }
$expectedHash = ($checksumLine -split "\s+")[0].ToUpperInvariant()
$actualHash = (Get-FileHash -LiteralPath $nodeZip -Algorithm SHA256).Hash.ToUpperInvariant()
if ($actualHash -ne $expectedHash) { throw "Node checksum mismatch: expected $expectedHash, got $actualHash" }
if (Test-Path $nodeExtract) { Remove-Item -LiteralPath $nodeExtract -Recurse -Force }
Expand-Archive -LiteralPath $nodeZip -DestinationPath $nodeExtract
$nodeSource = Join-Path $nodeExtract "node-v$NodeVersion-win-x64"
Invoke-Robocopy $nodeSource $NodeStage @("/E", "/NFL", "/NDL", "/NJH", "/NJS", "/NP")

Write-Host "[A0] Installing Electron dependencies"
Push-Location (Join-Path $RepoRoot "electron")
try {
    if (Test-Path "package-lock.json") {
        & npm ci
    } else {
        & npm install
    }
    if ($LASTEXITCODE -ne 0) { throw "npm dependency installation failed" }
    & npm exec -- electron-builder --win nsis portable --config electron-builder.yml
    if ($LASTEXITCODE -ne 0) { throw "electron-builder failed" }
}
finally {
    Pop-Location
}

Write-Host "[A0] Build complete. Public artifacts are under $RepoRoot\artifacts\electron"
