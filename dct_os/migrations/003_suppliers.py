"""Suppliers reference table — a quiet source of truth for supplier names.

Supplier is still plain text on dockets, POs, and resources (no foreign keys,
no CRM screen — that stays the commercial edition). This table just keeps a
canonical, de-duplicated list of the names in use, so:
  - autocomplete and entry steer everyone to one spelling (data integrity), and
  - the list is a clean thing to carry across when upgrading to the paid tier.

Backfilled from every supplier name already used across the three tables.
"""

VERSION = 3
DESCRIPTION = "Suppliers reference table (canonical name list)"


def migrate(db):
    db.executescript("""
        CREATE TABLE IF NOT EXISTS suppliers (
            id          INTEGER PRIMARY KEY AUTOINCREMENT,
            name        TEXT    NOT NULL,
            created_at  TEXT    NOT NULL DEFAULT (datetime('now'))
        );
        CREATE UNIQUE INDEX IF NOT EXISTS idx_suppliers_name
            ON suppliers(name COLLATE NOCASE);
    """)

    rows = db.execute("""
        SELECT DISTINCT name FROM (
            SELECT supplier_name AS name FROM purchase_orders
                WHERE supplier_name IS NOT NULL AND TRIM(supplier_name) <> ''
            UNION
            SELECT supplier_name FROM docket_headers
                WHERE supplier_name IS NOT NULL AND TRIM(supplier_name) <> ''
            UNION
            SELECT supplier_name FROM resources
                WHERE supplier_name IS NOT NULL AND TRIM(supplier_name) <> ''
        ) ORDER BY name
    """).fetchall()
    for r in rows:
        db.execute("INSERT OR IGNORE INTO suppliers (name) VALUES (?)", (r[0].strip(),))
