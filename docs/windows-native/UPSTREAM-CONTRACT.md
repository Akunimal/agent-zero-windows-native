# Upstream compatibility contract

The fork is intended to follow Agent Zero `upstream/main` without carrying a large divergent rewrite.

## Stable integration points

The native layer is limited to these areas:

1. `helpers/runtime.py`: explicit `A0_NATIVE_WINDOWS` mode and local execution of development helpers.
2. `helpers/files.py`: `A0_BASE_DIR` for read-only application resources and `A0_USER_DIR` for writable user state.
3. `helpers/settings.py`: native defaults for workdir, RFC/Docker auto-connect, and self-update flags.
4. `plugins/_code_execution/tools/code_execution_tool.py`: Windows quoting, local PowerShell selection, and native Python/Node execution.
5. `electron/`, `windows-native/`, `scripts/`, and `docs/windows-native/`: fork-owned files.

If upstream changes one of the first four files, `scripts/update-upstream.ps1` must stop for review rather than silently overwriting the native contract.

## Update procedure

```powershell
git status --short
.\scripts\update-upstream.ps1
.\scripts\test-windows-native.ps1
```

The updater fetches `upstream/main`, creates a dated sync branch, performs a non-destructive merge, prints conflicts, and runs the contract tests. It does not force-reset, delete local data, or publish a release automatically.

## Release rule

Build a new installer/portable artifact only after:

- native contract tests pass;
- the backend starts with no console window;
- `/api/health` is reachable only through loopback;
- PowerShell, Python, and Node smoke tests pass;
- the bundled Python interpreter is used when system Python is absent;
- the public tree contains no private gateway, Tor, endpoint, or credential material.
