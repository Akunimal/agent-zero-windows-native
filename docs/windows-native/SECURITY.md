# Native Windows security model

## No sandbox

The Windows distribution deliberately runs Agent Zero directly on the host. Docker isolation is not present. A prompt can cause code or PowerShell commands to run with the permissions of the Windows account that launched the app. The Electron renderer remains sandboxed, but that does not sandbox the Python backend or its execution tools.

Use a dedicated standard Windows account, a VM, or the upstream Docker distribution for untrusted work. Do not run the portable binary elevated. Keep endpoint credentials in the private runtime environment and never add them to `usr/`, the public repository, build logs, or crash reports.

## Hardening contracts

- Backend binds to `127.0.0.1` on a random port.
- Electron uses `contextIsolation`, `sandbox`, `nodeIntegration: false`, and denies arbitrary renderer-created windows.
- Child processes use argument arrays, `shell: false`, `windowsHide: true`, and a process-tree cleanup fallback.
- Python user data is outside the installed backend resources and is not checked into Git.
- Native mode is opt-in through `A0_NATIVE_WINDOWS=1`; Docker/upstream behavior remains the default outside the Electron launcher.
- The UI shows a persistent red warning banner on every native run.
