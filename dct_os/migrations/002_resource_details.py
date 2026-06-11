"""Add a details column to resources.

Item (the existing description column) is the short name — "Excavator 14T".
Details is the long description — "Cat 314, rubber tracked, long arm" —
which helps match docket and invoice wording that never quite agrees.
"""

VERSION = 2
DESCRIPTION = "Resource details column (Item + Description split)"


def migrate(db):
    cols = {r[1] for r in db.execute("PRAGMA table_info(resources)").fetchall()}
    if "details" not in cols:
        db.execute("ALTER TABLE resources ADD COLUMN details TEXT")
