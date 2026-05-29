CREATE TABLE IF NOT EXISTS projects (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    name        TEXT    NOT NULL,
    code        TEXT,
    client      TEXT,
    start_date  TEXT,
    end_date    TEXT,
    status      TEXT    NOT NULL DEFAULT 'Active',
    created_at  TEXT    NOT NULL DEFAULT (datetime('now')),
    updated_at  TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS cost_codes (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id      INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    code            TEXT    NOT NULL,
    description     TEXT,
    budget_amount   REAL    DEFAULT 0,
    parent_id       INTEGER REFERENCES cost_codes(id),
    created_at      TEXT    NOT NULL DEFAULT (datetime('now')),
    updated_at      TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS resources (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    description     TEXT    NOT NULL,
    unit            TEXT    NOT NULL,
    supplier_name   TEXT,
    standard_rate   REAL    NOT NULL DEFAULT 0,
    category        TEXT,
    created_at      TEXT    NOT NULL DEFAULT (datetime('now')),
    updated_at      TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS dockets (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id      INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    cost_code_id    INTEGER REFERENCES cost_codes(id),
    resource_id     INTEGER REFERENCES resources(id),
    supplier_name   TEXT,
    date            TEXT    NOT NULL,
    docket_number   TEXT,
    description     TEXT,
    qty             REAL    NOT NULL DEFAULT 0,
    unit            TEXT,
    rate            REAL    NOT NULL DEFAULT 0,
    amount          REAL    NOT NULL DEFAULT 0,
    wo_number       TEXT,
    po_number       TEXT,
    notes           TEXT,
    created_at      TEXT    NOT NULL DEFAULT (datetime('now')),
    updated_at      TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_cost_codes_project ON cost_codes(project_id);
CREATE INDEX IF NOT EXISTS idx_dockets_project ON dockets(project_id);
CREATE INDEX IF NOT EXISTS idx_dockets_cost_code ON dockets(cost_code_id);
CREATE INDEX IF NOT EXISTS idx_dockets_date ON dockets(date);
