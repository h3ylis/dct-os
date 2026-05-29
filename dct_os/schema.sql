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

CREATE TABLE IF NOT EXISTS work_orders (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id  INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    number      TEXT    NOT NULL,
    description TEXT,
    status      TEXT    NOT NULL DEFAULT 'Active',
    created_at  TEXT    NOT NULL DEFAULT (datetime('now')),
    updated_at  TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS purchase_orders (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id      INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    number          TEXT    NOT NULL,
    supplier_name   TEXT,
    value           REAL    NOT NULL DEFAULT 0,
    raised_date     TEXT,
    is_active       INTEGER NOT NULL DEFAULT 1,
    notes           TEXT,
    created_at      TEXT    NOT NULL DEFAULT (datetime('now')),
    updated_at      TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS wo_cost_codes (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    work_order_id   INTEGER NOT NULL REFERENCES work_orders(id) ON DELETE CASCADE,
    cost_code_id    INTEGER NOT NULL REFERENCES cost_codes(id) ON DELETE CASCADE,
    UNIQUE(work_order_id, cost_code_id)
);

CREATE TABLE IF NOT EXISTS po_assignments (
    id                  INTEGER PRIMARY KEY AUTOINCREMENT,
    purchase_order_id   INTEGER NOT NULL REFERENCES purchase_orders(id) ON DELETE CASCADE,
    work_order_id       INTEGER NOT NULL REFERENCES work_orders(id) ON DELETE CASCADE,
    UNIQUE(purchase_order_id, work_order_id)
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
    id                  INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id          INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    work_order_id       INTEGER REFERENCES work_orders(id),
    cost_code_id        INTEGER REFERENCES cost_codes(id),
    purchase_order_id   INTEGER REFERENCES purchase_orders(id),
    resource_id         INTEGER REFERENCES resources(id),
    supplier_name       TEXT,
    date                TEXT    NOT NULL,
    docket_number       TEXT,
    description         TEXT,
    qty                 REAL    NOT NULL DEFAULT 0,
    unit                TEXT,
    rate                REAL    NOT NULL DEFAULT 0,
    amount              REAL    NOT NULL DEFAULT 0,
    notes               TEXT,
    created_at          TEXT    NOT NULL DEFAULT (datetime('now')),
    updated_at          TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_cost_codes_project ON cost_codes(project_id);
CREATE INDEX IF NOT EXISTS idx_work_orders_project ON work_orders(project_id);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_project ON purchase_orders(project_id);
CREATE INDEX IF NOT EXISTS idx_dockets_project ON dockets(project_id);
CREATE INDEX IF NOT EXISTS idx_dockets_cost_code ON dockets(cost_code_id);
CREATE INDEX IF NOT EXISTS idx_dockets_work_order ON dockets(work_order_id);
CREATE INDEX IF NOT EXISTS idx_dockets_purchase_order ON dockets(purchase_order_id);
CREATE INDEX IF NOT EXISTS idx_dockets_date ON dockets(date);
