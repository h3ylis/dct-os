import importlib
import os
import pkgutil
import sqlite3
import threading
from pathlib import Path

from flask import g, current_app

from dct_os import __version__

SEED_PATH = Path(__file__).parent / "seed.sql"


def get_db():
    if "db" not in g:
        g.db = sqlite3.connect(
            current_app.config["DATABASE"],
            detect_types=sqlite3.PARSE_DECLTYPES,
        )
        g.db.row_factory = sqlite3.Row
        g.db.execute("PRAGMA journal_mode=WAL")
        g.db.execute("PRAGMA foreign_keys=ON")
    return g.db


def close_db(e=None):
    db = g.pop("db", None)
    if db is not None:
        db.close()


# ---------------------------------------------------------------------------
# Schema migrations
# ---------------------------------------------------------------------------

def _ensure_schema_version_table(db):
    """Create the schema_version table if it doesn't exist."""
    db.execute("""
        CREATE TABLE IF NOT EXISTS schema_version (
            version     INTEGER PRIMARY KEY,
            description TEXT,
            applied_at  TEXT NOT NULL DEFAULT (datetime('now'))
        )
    """)
    db.commit()


def _get_current_version(db):
    """Return the highest applied migration version, or 0 if none."""
    row = db.execute(
        "SELECT COALESCE(MAX(version), 0) FROM schema_version"
    ).fetchone()
    return row[0]


def _detect_pre_migration_db(db):
    """Check if this is a v0.1.0 database created before migrations existed.

    If the projects table exists but schema_version doesn't, this is an
    existing install that needs to be stamped as version 1 (initial schema
    already applied via the old schema.sql mechanism).
    """
    tables = {
        r[0] for r in db.execute(
            "SELECT name FROM sqlite_master WHERE type='table'"
        ).fetchall()
    }
    if "projects" in tables and "schema_version" not in tables:
        return True
    return False


def _load_migrations():
    """Discover and load all migration modules, sorted by version."""
    import dct_os.migrations as migrations_pkg

    modules = []
    for importer, modname, ispkg in pkgutil.iter_modules(
        migrations_pkg.__path__, migrations_pkg.__name__ + "."
    ):
        if ispkg:
            continue
        mod = importlib.import_module(modname)
        if hasattr(mod, "VERSION") and hasattr(mod, "migrate"):
            modules.append(mod)

    modules.sort(key=lambda m: m.VERSION)
    return modules


def run_migrations(db):
    """Run any pending schema migrations."""
    pre_migration = _detect_pre_migration_db(db)
    _ensure_schema_version_table(db)

    if pre_migration:
        # Stamp as version 1 without running migration 001 (schema already exists)
        db.execute(
            "INSERT OR IGNORE INTO schema_version (version, description) "
            "VALUES (?, ?)",
            (1, "Initial schema (v0.1.0) - stamped from pre-migration DB"),
        )
        db.commit()

    current = _get_current_version(db)
    migrations = _load_migrations()
    applied = 0

    for mod in migrations:
        if mod.VERSION <= current:
            continue
        desc = getattr(mod, "DESCRIPTION", f"Migration {mod.VERSION}")
        try:
            mod.migrate(db)
            db.execute(
                "INSERT INTO schema_version (version, description) VALUES (?, ?)",
                (mod.VERSION, desc),
            )
            db.commit()
            applied += 1
        except Exception as e:
            db.rollback()
            raise RuntimeError(
                f"Migration {mod.VERSION} ({desc}) failed: {e}"
            ) from e

    return current, _get_current_version(db), applied


def seed_db():
    """Load seed data if the database is empty."""
    db = get_db()
    row = db.execute("SELECT COUNT(*) FROM projects").fetchone()
    if row[0] == 0:
        db.executescript(SEED_PATH.read_text())


# ---------------------------------------------------------------------------
# Version check (non-blocking, cached)
# ---------------------------------------------------------------------------

_version_cache = {"latest": None, "checked": False}


def check_for_updates():
    """Check PyPI for a newer version. Non-blocking, runs in a thread."""
    def _check():
        try:
            import urllib.request
            import json

            url = "https://pypi.org/pypi/dct-os/json"
            req = urllib.request.Request(url, headers={"User-Agent": "DCT-OS/%s" % __version__})
            with urllib.request.urlopen(req, timeout=5) as resp:
                data = json.loads(resp.read().decode())
                latest = data.get("info", {}).get("version", "")
                if latest:
                    _version_cache["latest"] = latest
        except Exception:
            pass  # network errors are fine — version check is best-effort
        finally:
            _version_cache["checked"] = True

    thread = threading.Thread(target=_check, daemon=True)
    thread.start()


def get_update_info():
    """Return update info if a newer version is available."""
    if not _version_cache["checked"]:
        return None
    latest = _version_cache.get("latest")
    if not latest:
        return None
    # Simple version comparison (works for semver without pre-release)
    try:
        current_parts = [int(x) for x in __version__.split(".")]
        latest_parts = [int(x) for x in latest.split(".")]
        if latest_parts > current_parts:
            return {"current": __version__, "latest": latest}
    except (ValueError, AttributeError):
        pass
    return None


# ---------------------------------------------------------------------------
# App init
# ---------------------------------------------------------------------------

def init_app(app):
    app.teardown_appcontext(close_db)
    with app.app_context():
        db = get_db()
        current, final, applied = run_migrations(db)
        if applied > 0:
            app.logger.info(
                "Schema migrated from v%d to v%d (%d migration(s) applied)",
                current, final, applied,
            )

        if not os.environ.get("DCT_NO_SEED", "").lower() in ("1", "true", "yes"):
            seed_db()

        # Non-blocking version check (skip in testing)
        if not app.config.get("TESTING"):
            check_for_updates()
