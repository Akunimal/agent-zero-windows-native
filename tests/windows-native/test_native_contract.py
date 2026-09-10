import asyncio
import os
import subprocess
import sys
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]


def test_native_runtime_executes_development_helpers_locally(tmp_path):
    user_dir = tmp_path / "Agent Zero User Data"
    env = os.environ.copy()
    env.update(
        {
            "A0_NATIVE_WINDOWS": "1",
            "A0_BASE_DIR": str(ROOT),
            "A0_USER_DIR": str(user_dir),
        }
    )
    code = """
import asyncio
import os
from helpers import files, runtime
assert runtime.is_native_windows()
async def main():
    assert await runtime.call_development_function(lambda: 'local-ok') == 'local-ok'
asyncio.run(main())
path = files.get_abs_path('usr/workdir')
assert str(path).startswith(os.environ['A0_USER_DIR'])
assert files.is_in_dir(os.environ['A0_BASE_DIR'], os.environ['A0_USER_DIR']) is False
print(path)
"""
    result = subprocess.run(
        [sys.executable, "-c", code],
        cwd=ROOT,
        env=env,
        capture_output=True,
        text=True,
        check=True,
    )
    assert str(user_dir) in result.stdout


def test_windows_native_contract_has_no_private_runtime_material():
    ignored_roots = {".git", ".a0-build", ".a0-dev-data", "artifacts", "node_modules"}
    public_files = [
        p
        for p in ROOT.rglob("*")
        if p.is_file()
        and not any(part in ignored_roots for part in p.relative_to(ROOT).parts)
    ]
    forbidden = ("opencode2api", "tor.exe", "free-code-deepseek-harness")
    matches = [str(path) for path in public_files if any(token.lower() in path.name.lower() for token in forbidden)]
    assert matches == []


def test_native_code_execution_uses_powershell_safe_quoting():
    source = (ROOT / "plugins" / "_code_execution" / "tools" / "code_execution_tool.py").read_text(encoding="utf-8")
    assert "shell=True" not in source
    assert "windowsHide" not in source  # process hiding belongs to Electron spawn
    assert "text.replace(\"'\", \"''\")" in source
    assert "runtime.is_native_windows()" in source
