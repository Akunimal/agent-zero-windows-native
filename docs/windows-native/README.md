# Agent Zero Windows Electron distribution

This is the Windows-native layer of the fork. It does not replace the upstream Docker workflow; it adds an explicit native runtime for users who want an installer or portable executable.

## Runtime layout

```text
Electron window (sandboxed renderer)
        |
        +-- hidden python.exe run_ui.py --host=127.0.0.1 --port=<random loopback>
        |       |
        |       +-- embedded Python 3.12 + Python wheels
        |       +-- embedded Playwright Chromium
        |       +-- embedded Node.js for Node execution
        |       +-- native PowerShell/Windows execution
        |
        +-- user data in %APPDATA%/Agent Zero Windows/usr
```

The backend is never started through a shell command string. Electron uses `spawn()` with `shell: false`, `windowsHide: true`, an ephemeral loopback port, a single-instance lock, and a process-tree cleanup path on exit. The renderer has `contextIsolation`, `nodeIntegration: false`, `sandbox: true`, and does not receive arbitrary filesystem APIs.

## Development

Requirements: Git, Node.js 22+, `uv`, and Windows PowerShell. The development launcher uses `.venv` if present and otherwise searches for `python.exe`. The production artifacts do not rely on a system Python installation.

```powershell
cd public/agent-zero-electron/electron
npm install
cd ..
uv venv --python 3.12 .venv
uv pip install --python .venv/Scripts/python.exe -r requirements.txt
cd electron
npm run dev
```

The first native run creates local development data in `.a0-dev-data/usr`. Configure a model through the Agent Zero UI or through environment variables in a private launcher. Do not commit endpoint or credential settings to this repository.

## Windows build

The build script provisions a standalone CPython runtime, installs all pinned Python requirements into it, installs Chromium for Playwright, downloads a pinned portable Node.js runtime, stages the backend, and invokes `electron-builder` for both NSIS installer and portable targets:

```powershell
cd public/agent-zero-electron/electron
npm install
npm run build:windows
```

Artifacts are written to `artifacts/electron/`. The staging directory is `.a0-build/` and is ignored by Git. Build-time downloads are verified where the upstream vendor publishes checksums; the exact versions are recorded in the build log and `docs/windows-native/UPSTREAM-CONTRACT.md`.

The portable target is a one-file self-extractor. Because the bundled runtime
contains the full Python dependency set and Chromium, its first launch can
take several minutes while roughly 3 GB of files are expanded into the local
temporary directory. This is expected; the NSIS installer is the better choice
for regular use, while portable is useful when the installation directory must
remain movable.

## Updates from upstream

Keep the fork's native changes in the documented touch points. Use `scripts/update-upstream.ps1` to fetch and merge `upstream/main`; it stops on conflicts, runs the native contract tests, and never force-resets a working tree. Do not copy the private runtime into this repository.

## Private OpenCode runtime

The private launcher can set `A0_SET_chat_model_api_base`, `A0_SET_chat_model_name`, and the provider environment in the process that starts the portable executable. The public app remains provider-neutral. The OpenCode Zen gateway, `opencode2api`, Tor fleet, round-robin policy, logs, and any credentials must stay outside this repository.
