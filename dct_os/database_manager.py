"""Database manager — lock files, config persistence, file browsing."""

import atexit
import json
import os
import platform
import socket
from datetime import datetime, timezone
from pathlib import Path


# ---------------------------------------------------------------------------
# Config (recent databases, last opened)
# ---------------------------------------------------------------------------

def _get_config_dir():
    """Return the DCT-OS config directory (cross-platform)."""
    system = platform.system()
    if system == "Windows":
        base = Path(os.environ.get("LOCALAPPDATA", Path.home() / "AppData" / "Local"))
    elif system == "Darwin":
        base = Path.home() / "Library" / "Application Support"
    else:
        # Linux / other: XDG_CONFIG_HOME or ~/.config
        base = Path(os.environ.get("XDG_CONFIG_HOME", Path.home() / ".config"))
    d = base / "DCT-OS"
    d.mkdir(parents=True, exist_ok=True)
    return d


def get_config_path():
    return _get_config_dir() / "config.json"


def load_config():
    path = get_config_path()
    if path.exists():
        try:
            return json.loads(path.read_text(encoding="utf-8"))
        except Exception:
            pass
    return {"recent_databases": [], "last_database": None}


def save_config(config):
    path = get_config_path()
    path.write_text(json.dumps(config, indent=2), encoding="utf-8")


def add_recent(db_path, name=None):
    """Add a database path to the recent list and set it as last used."""
    config = load_config()
    db_path = str(Path(db_path).resolve())
    if name is None:
        name = Path(db_path).parent.name + "/" + Path(db_path).name

    # Remove existing entry for this path
    config["recent_databases"] = [
        r for r in config["recent_databases"] if r.get("path") != db_path
    ]

    # Add to front
    config["recent_databases"].insert(0, {
        "path": db_path,
        "name": name,
        "last_opened": datetime.now(timezone.utc).isoformat(),
    })

    # Keep max 10
    config["recent_databases"] = config["recent_databases"][:10]
    config["last_database"] = db_path
    save_config(config)


# ---------------------------------------------------------------------------
# Lock file
# ---------------------------------------------------------------------------

_current_lock_path = None


def _lock_path(db_path):
    return Path(str(db_path) + ".lock")


def _get_username():
    try:
        return os.getlogin()
    except Exception:
        return os.environ.get("USERNAME", os.environ.get("USER", "unknown"))


def acquire_lock(db_path):
    """Write a lock file next to the database."""
    global _current_lock_path
    lock = _lock_path(db_path)
    lock_data = {
        "user": _get_username(),
        "hostname": socket.gethostname(),
        "pid": os.getpid(),
        "since": datetime.now(timezone.utc).isoformat(),
    }
    try:
        lock.write_text(json.dumps(lock_data), encoding="utf-8")
        _current_lock_path = lock
    except Exception:
        pass  # Can't write lock (read-only location, etc.)


def release_lock(db_path=None):
    """Remove our lock file if we own it."""
    global _current_lock_path
    if db_path:
        lock = _lock_path(db_path)
    elif _current_lock_path:
        lock = _current_lock_path
    else:
        return

    try:
        if lock.exists():
            data = json.loads(lock.read_text(encoding="utf-8"))
            if (data.get("pid") == os.getpid()
                    and data.get("hostname") == socket.gethostname()):
                lock.unlink()
    except Exception:
        pass

    if _current_lock_path and str(_current_lock_path) == str(lock):
        _current_lock_path = None


def check_lock(db_path):
    """Check if someone else has this database locked.

    Returns lock info dict if locked by another process, None otherwise.
    Cleans up stale locks from dead processes on the same machine.
    """
    lock = _lock_path(db_path)
    if not lock.exists():
        return None

    try:
        data = json.loads(lock.read_text(encoding="utf-8"))
    except Exception:
        return None

    # It's our own lock
    if (data.get("pid") == os.getpid()
            and data.get("hostname") == socket.gethostname()):
        return None

    # Stale lock detection: same machine, dead process
    if data.get("hostname") == socket.gethostname():
        pid = data.get("pid")
        if pid:
            try:
                os.kill(pid, 0)  # Signal 0 = check if alive
            except ProcessLookupError:
                # Process is dead — clean up stale lock
                try:
                    lock.unlink()
                except Exception:
                    pass
                return None
            except (PermissionError, OSError):
                pass  # Process exists but can't signal

    return data


def _cleanup_lock():
    release_lock()


atexit.register(_cleanup_lock)


# ---------------------------------------------------------------------------
# File browser
# ---------------------------------------------------------------------------

def browse_directory(path=None):
    """List directory contents: folders and .db files only."""
    if path is None:
        path = str(Path.home())

    path = Path(path)
    if not path.is_dir():
        return {"error": "Not a directory", "path": str(path)}

    items = []
    try:
        for entry in sorted(
            path.iterdir(),
            key=lambda e: (not e.is_dir(), e.name.lower()),
        ):
            # Skip hidden files/dirs and system folders
            if entry.name.startswith(".") or entry.name.startswith("$"):
                continue

            if entry.is_dir():
                items.append({
                    "name": entry.name,
                    "path": str(entry),
                    "type": "directory",
                })
            elif entry.suffix.lower() == ".db":
                try:
                    size = entry.stat().st_size
                except Exception:
                    size = 0
                items.append({
                    "name": entry.name,
                    "path": str(entry),
                    "type": "file",
                    "size": size,
                })
    except PermissionError:
        return {"error": "Permission denied", "path": str(path)}
    except Exception as e:
        return {"error": str(e), "path": str(path)}

    parent = str(path.parent) if path.parent != path else None

    # Windows drive list
    drives = None
    if platform.system() == "Windows":
        import string
        drives = []
        for letter in string.ascii_uppercase:
            drive = f"{letter}:\\"
            try:
                if Path(drive).exists():
                    drives.append(drive)
            except Exception:
                pass

    # Quick-access locations
    shortcuts = []
    home = Path.home()
    for name, p in [
        ("Desktop", home / "Desktop"),
        ("Documents", home / "Documents"),
        ("OneDrive", home / "OneDrive"),
        ("Downloads", home / "Downloads"),
    ]:
        if p.is_dir():
            shortcuts.append({"name": name, "path": str(p)})

    # Also check for OneDrive variants (business accounts)
    for d in home.iterdir():
        try:
            if d.is_dir() and d.name.startswith("OneDrive -"):
                shortcuts.append({"name": d.name, "path": str(d)})
        except Exception:
            pass

    return {
        "path": str(path),
        "parent": parent,
        "drives": drives,
        "shortcuts": shortcuts,
        "items": items,
    }
