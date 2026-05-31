import os
import sqlite3
from pathlib import Path

from flask import g, current_app

SCHEMA_PATH = Path(__file__).parent / "schema.sql"
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


def init_db():
    db = get_db()
    db.executescript(SCHEMA_PATH.read_text())


def seed_db():
    db = get_db()
    row = db.execute("SELECT COUNT(*) FROM projects").fetchone()
    if row[0] == 0:
        db.executescript(SEED_PATH.read_text())


def init_app(app):
    app.teardown_appcontext(close_db)
    with app.app_context():
        init_db()
        if not os.environ.get("DCT_NO_SEED", "").lower() in ("1", "true", "yes"):
            seed_db()
