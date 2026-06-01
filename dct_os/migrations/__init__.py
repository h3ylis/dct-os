# Schema migrations for DCT-OS
#
# Each migration file is a Python module with:
#   VERSION = <int>        -- sequential version number
#   DESCRIPTION = <str>    -- human-readable description
#   def migrate(db):       -- receives a sqlite3 connection, runs DDL/DML
#
# Migrations run in order. Each one runs inside a transaction.
# The schema_version table tracks which migrations have been applied.
# Migrations must be idempotent where possible (use IF NOT EXISTS, etc.).
