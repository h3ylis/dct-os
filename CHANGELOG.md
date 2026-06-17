# Changelog

All notable changes to DCT-OS will be documented in this file.

## [1.0.2] - 2026-06-17

### Fixed

- **Folder-browse auto-advance works again.** When entering dockets from a
  folder of scans, saving one now correctly advances to the next pending scan
  instead of stopping. A regression in 1.0.1 read the dialog's success message
  *after* the dialog had already been torn down, which threw and — swallowed by
  the save handler's error path — silently skipped both the auto-advance and
  the green "Saved" toast on every dialog save (saves still persisted; you just
  didn't see the confirmation or get moved to the next scan). The message is now
  captured before the dialog closes.

## [1.0.1] - 2026-06-14

### Fixed

- **No more duplicate dockets from an impatient double-click.** Saving any
  dialog (docket, cost code, work order, purchase order, resource) is now
  guarded against a second submit while the first is in flight, and the Save
  button disables itself while saving. One entry screen saves exactly once,
  even on a slow connection.
- **Clearer validation.** A docket line that has a resource or description
  but no quantity is now blocked with a "Line N needs a quantity" message
  (instead of silently saving a zero-value line), and blank lines are
  dropped. The dialog stays open and the Save button re-enables so you can
  fix it and try again.
- **Docket export honours your selection.** Export to CSV/Excel from the
  Dockets screen now exports only the dockets currently shown by your column
  filters, not the whole project. With no filter active it still exports
  everything.

## [1.0.0] - 2026-06-12

### Added

- **Rate review — the rate feedback loop.** Pricing knowledge enters DCT-OS
  where it enters real life: at invoice review. Rates in the Docket Summary
  Report are now editable in place. If the invoice agrees, do nothing. Type
  a higher rate and the dockets in the report re-value and the resource's
  standard rate updates (with Undo). Type a lower rate and choose: one-off
  for this claim, or update the standard rate too. Type a rate on a
  free-text line and DCT-OS offers to add it to your resources — pre-filled
  and one click.
- **Quantities-only docket entry.** The rate column is gone from the docket
  entry form — site paperwork doesn't carry prices, so you don't type any.
  Lines are valued automatically at the resource's standard rate as an
  estimate until invoice review confirms them.
- **Backups.** A Backup button in the database dialog downloads a
  timestamped snapshot of the current database. DCT-OS also keeps automatic
  rotating backups (last 7) in a `backups/` folder next to your database.
- **Excel export.** Dockets and the Docket Summary Report now export as
  formatted `.xlsx` workbooks alongside CSV.
- **Resources import/export.** Bring your existing rates list straight in:
  the Resources tab imports CSV (flexible headers, duplicates skipped) and
  exports CSV or Excel.
- **Item + Description on resources.** A resource now has an Item (what it
  is — "Excavator 14T") and an optional Description (the detail — "Cat 314,
  rubber tracked, long arm") to help match the wording on dockets and
  invoices that never quite agrees. Existing databases migrate
  automatically; old CSV exports still import.

### Changed

- Summary report rows are now split by exact rate (no more averaged rates)
  so each row can be reviewed against the invoice independently.
- GitHub Actions workflows updated to current action versions.

## [0.3.0] - 2026-06-11

### Added

- **Database picker**: open any DCT-OS database from the UI — click the
  database indicator in the header to switch. Includes a file browser with
  quick-access shortcuts (Desktop, Documents, OneDrive, drives), a recent
  databases list, and a "+ New Database" option. Works with shared `.db`
  files on network drives, SharePoint, or OneDrive.
- **Multi-user awareness**: a lock file (`.db.lock`) next to each open
  database records who has it open. The header indicator shows an amber dot
  when someone else is in the file, and a warning banner explains the
  concurrent-write limitation. Stale locks from crashed processes are
  cleaned up automatically.
- **New databases start empty**: databases created via the picker contain
  the schema only — no demo data. (Demo data still loads on a fresh
  first install.)
- **Cross-platform config**: settings now stored in the proper per-OS
  location — `%LOCALAPPDATA%\DCT-OS\` on Windows,
  `~/Library/Application Support/DCT-OS/` on macOS, `~/.config/DCT-OS/`
  on Linux.
- **Optional remote log reporting** (`dct_os/log_webhook.py`): set
  `DCT_OS_LOG_URL` to have DCT-OS report startup, a periodic liveness
  heartbeat, unhandled request errors (with traceback), and upgrade results
  to a log collector **you run yourself**. Completely inert by default —
  no env var, no network calls, and there is no built-in destination.
  Optional `DCT_OS_LOG_KEY` (sent as `X-ABLog-Key`), `DCT_OS_LOG_APP`,
  `DCT_OS_LOG_INTERVAL`. Wire format documented in the module docstring.
- **API reference**: all REST endpoints documented in `docs/API.md`.

### Fixed

- README no longer claims Excel export or single-binary distribution
  (CSV export and `pip install` are what exist today).

## [0.2.0] - 2026-06-08

### Added

- **Cost code budget tracking**: budget vs actual vs variance per cost code
  with burn-rate bars in the grid and budget/actual/remaining/burn stats.
- **`dct-os upgrade` command**: checks PyPI for a newer version, upgrades
  via pip, and logs anonymous usage statistics locally
  (`logs/upgrades.jsonl`).
- **Update banner**: in-app notification when a newer version is on PyPI,
  with the upgrade command shown.
- **Schema migrations**: versioned migration framework — existing databases
  upgrade in place; user data is preserved across upgrades.

### Changed

- **Seed data trimmed to a single project** (Warrawong Road Rehabilitation)
  for a cleaner first-run experience.

## [0.1.0] - 2026-05-31

Initial public release.

### Core Features

- **Project management**: Create, edit, archive, and filter projects with client, code, and date tracking
- **Three-axis cost model**: Work Orders (client scope), Cost Codes (internal budget), Purchase Orders (financial commitment)
- **WO-CC matrix**: Restrict which cost codes are valid for each work order
- **PO drawdown**: Track committed spend against purchase order values in real time

### Docket Entry

- **Header + lines model**: Each docket has a header (date, supplier, docket number, PO) with multiple line items (WO, CC, resource, qty, rate)
- **Copy docket**: One-click duplication of a previous docket with today's date for recurring plant/labour
- **PDF/image viewer**: Side-by-side document viewer with folder browse, file dropdown, and prev/next navigation
- **Source fingerprinting**: SHA-256 hash of source documents stored per docket for duplicate detection
- **Duplicate warning**: Amber banner when a loaded file's fingerprint matches an existing docket
- **Resource auto-fill**: Select a resource to auto-populate description, unit, and rate
- **Cascading dropdowns**: WO selection filters available cost codes per line

### Docket Summary Report

- **Supplier-based reporting**: Generate summaries by supplier with date range or specific docket selection
- **Category grouping**: Toggle between categorised view (grouped by resource category with subtotals) and flat resource list
- **CSV export**: One-click export of summary data
- **Claim tagging**: Mark dockets as claimed with a reference string (e.g. invoice number) for tracking
- **Hide claimed filter**: Filter out already-claimed dockets from the picker

### Grid & Navigation

- **AG-Grid integration**: Sortable, filterable, resizable columns across all entity types
- **Continuous scroll**: No pagination on docket grid
- **Claimed status**: Visual indicator (green tint) for claimed dockets in the grid
- **Sidebar project list**: Searchable with Active/All filter and quick-edit pencil button

### Technical

- **Flask + SQLite**: Zero-dependency backend, single-file database
- **Cache busting**: Timestamp-based URL versioning prevents stale browser assets after updates
- **REST API**: Standard JSON endpoints for all operations
- **38 automated tests**: Full API test coverage including CRUD, summary, claims, hash checks, and duplicate detection
- **Demo seed data**: Fictional "Riverbend Shire Council" dataset with 4 projects, 106 dockets, 25 resources
