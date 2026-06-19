"""Add source_filepath column to docket_headers.

Stores the filesystem path to the original scan so Flask can serve it
back when editing an existing docket (the file stays in place — no copy,
no blob storage).
"""

VERSION = 4
DESCRIPTION = "Add source_filepath to docket_headers"


def migrate(db):
    cols = [r[1] for r in db.execute("PRAGMA table_info(docket_headers)").fetchall()]
    if "source_filepath" not in cols:
        db.execute("ALTER TABLE docket_headers ADD COLUMN source_filepath TEXT")
