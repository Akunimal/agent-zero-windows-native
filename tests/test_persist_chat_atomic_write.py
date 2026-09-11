from __future__ import annotations


def test_atomic_chat_write_is_windows_safe(tmp_path) -> None:
    from helpers import persist_chat

    target = tmp_path / "chat" / "chat.json"

    persist_chat._write_atomic(str(target), '{"message":"windows-safe"}')

    assert target.read_text(encoding="utf-8") == '{"message":"windows-safe"}'
    assert list(target.parent.glob("*.tmp")) == []
