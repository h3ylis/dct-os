# Changelog

All notable changes to DCT-OS will be documented in this file.

## [1.2.6] - 2026-07-02

### Changed

- **The database now lives in a per-user folder.** DCT-OS keeps its database in
  your per-user application folder (e.g. `%LOCALAPPDATA%\DCT-OS` on Windows)
  rather than the folder it happens to be launched from — so it can't end up in a
  synced (OneDrive) or protected location where writes are silently blocked. An
  existing database in the launch folder is picked up automatically and kept.

### Added

- **A clear message when the database can't be saved.** If antivirus or ransomware
  protection (e.g. Bitdefender, Windows Controlled Folder Access) or a read-only
  folder is blocking DCT-OS, startup now says so — and how to fix it (allow-list
  DCT-OS, or set `DCT_DATA_DIR` to a writable folder) — instead of failing silently
  the first time you try to create a project.
- **A first-run summary** on launch showing where your data is stored and the
  address to open DCT-OS.

## [1.2.5] - 2026-06-23

### Changed

- **Reporting: one unified view.** The Reports screen no longer has a "By Docket #"
  vs "Date Range" mode toggle. You always see the supplier's dockets, filtered by
  **Status** (Unclaimed · Claimed · All) and an optional date range — so you can
  always see and verify which dockets have been claimed, not just read a date
  summary. Pick the dockets (or Select All) and Mark Claimed; the grouped cost
  summary and export work exactly as before.
- **Claims never overwrite.** Marking dockets claimed only ever sets a reference on
  dockets that are currently unclaimed — already-claimed dockets keep their original
  reference. To change a claim, Unclaim it first.

## [1.2.4] - 2026-06-23

### Fixed

- **Claiming now works in the Reports "Date Range" view.** The claim section only
  appeared in "By Docket #" mode. In Date Range mode it now shows and marks the
  supplier's dockets in the selected range as claimed — and it skips any that are
  already claimed, so existing claim references are never overwritten.
- **Clearer empty docket picker.** When every docket for a supplier is already
  claimed, the picker now reads "No unclaimed dockets. Untick 'Hide claimed' to
  show claimed ones" instead of the misleading "No dockets for this supplier".

## [1.2.3] - 2026-06-23

### Changed

- **Reports filter tidied up.** On the Reports screen, "By Docket #" is now the
  default way to scope a report, and the From/To date fields appear only when you
  pick "Date Range" — so the bar opens uncluttered. The mode buttons were also
  resized to match the height of the supplier and date fields, and the layout
  reordered so the date fields sit right beside the "Date Range" button that
  reveals them.

## [1.2.2] - 2026-06-21

### Changed

- **Totals moved into the grids.** The summary numbers that used to sit in a bar
  above the Dockets and Cost Codes grids are now a **total row pinned to the
  bottom of each grid** (Dockets, Cost Codes, Purchase Orders) — like a
  spreadsheet's footer total — and it totals whatever rows are *currently shown*,
  so filtering a column or drilling in from the Dashboard updates it live. The
  Dashboard stays the home for the whole-project headline; the grid total answers
  "what's *this view* worth?". The Resources grid has no total (you can't
  meaningfully sum unit rates).
- **Consistent dashboard bars.** The PO drawdown bars now use the same
  green / amber / red health bands as the cost-code burn-down (green under 80%
  drawn, amber to 100%, red overdrawn) instead of a separate steel-blue scheme.
- **Richer sample project.** The bundled Warrawong Road sample is now a realistic
  mid-flight job — a proper spend-over-time curve, a mix of healthy / amber /
  over cost codes, and some claimed work — so the dashboard shows the app at its
  best the first time you open it.

## [1.2.1] - 2026-06-20

### Added

- **Projects open themselves.** When you launch DCT-OS, a single project is now
  selected automatically; if you have several, the last one you worked on
  reopens — no more picking your project every time.

### Changed

- **Whole dollars, no cents.** Amounts and totals (dashboard, stat bars, cost
  code budgets/actuals, PO drawdown, supplier and claim figures, report
  subtotals and grand totals) now display as whole dollars — civil construction
  doesn't track cost to the cent. Unit **rates** still show their cents (a line
  marking rate is $1.80/m, not $2), as do the editable rate cells.
- **Calmer tooltips.** Hover hints now wait for a deliberate hover before
  appearing, so they no longer flash as the pointer passes over on its way to a
  button.
- **Unassigning a scan keeps the docket.** Detaching a scanned file from a docket
  now removes only the file link — the docket number, supplier, and lines stay
  put (a scan can be wrongly assigned to an otherwise-correct docket). To discard
  the whole docket, use Delete.

### Fixed

- **Dashboard filters now replace instead of stacking.** Clicking a dashboard
  item (a cost code, work order, supplier, …) filters the Dockets list to it.
  Previously, clicking a *different* item left the first filter silently active,
  so the list showed a confusing intersection of both; now each click replaces
  the previous filter. The active filter shows as a compact amber pill — a
  funnel mark, the value, and an inline ✕ to clear — and it tidies up after
  itself: clearing that column's filter by hand drops the pill too, and
  switching projects clears any leftover filter.

## [1.2.0] - 2026-06-20

### Added

- **Scans stay with their dockets.** When you enter a docket from a scanned
  file, DCT-OS now remembers where that scan lives on disk and shows it again
  whenever you reopen the docket to edit it (served by a new `/scans/<id>`
  route). The file stays exactly where it is — nothing is copied into the
  database or a hidden store, so there's no bloat and no second copy to keep in
  sync.
- **Folder browse, reworked.** Click **Choose folder…** and DCT-OS opens a
  native folder picker, lists the scans inside, and remembers exactly where each
  one lives on disk — so reopening a docket shows its original scan, verified by
  fingerprint, with no file copies and nothing typed. Each scan stays tied to the
  one docket it was entered against (the last scan no longer follows you onto
  every new docket); entered scans drop off the list; and an **Unassign scan**
  button detaches a scan and returns it to the queue. On a headless/hosted box
  with no desktop, it falls back to typing the folder path.
- **Dashboard — the whole project at a glance.** A new **Dashboard** pill in
  the header opens a live overview of the whole project, built entirely from
  that project's own data:
  - **Headline tiles** — total budget, total spent, remaining, dockets entered,
    and suppliers (they count up as the board loads).
  - **Spend over time** — a cumulative weekly burn-up line with a dashed
    total-budget reference line, so the spend curve reads against the budget
    ceiling at a glance.
  - **Cost by work order** — a donut of spend grouped by work order, with a
    legend of each work order and its dollars.
  - **Cost-code burn-down** — every cost code's budget-vs-actual bar, green
    under 80%, amber to 100%, red over budget. The bars "flood" in as they load.
  - **PO drawdown** — per active purchase order, a drawn-vs-committed bar that
    turns amber past 90% drawn and red if overdrawn.
  - **Top suppliers by spend** — the five biggest suppliers as scaled bars.
  - **Claimed vs to-claim** — a split bar showing how much of the spend has
    been claimed versus what's still outstanding (the cash-flow view).
- **Drill-down everywhere on the dashboard.** Click any bar, slice, or supplier
  to jump straight to its dockets (the dockets list filters to it, with a
  removable chip showing what's applied). Click a tile to open the screen that
  owns it — budget/spent/remaining open Cost Codes, dockets opens Dockets,
  suppliers opens Reports.
- **Packaged Windows installer.** A double-click `DCT-OS-Setup.exe` (built with
  PyInstaller + Inno Setup) installs DCT-OS with no command line and no Python
  required: it bundles everything, runs `dct-os install` for auto-start on
  login, and opens the app in your browser. Build recipe in `installer/`.

### Changed

- `dct-os install` is now packaging-aware (works from the bundled `.exe`),
  creates its startup entry without flashing a console window, and starts
  silently on login (`--no-browser`) — the browser only opens when you launch
  DCT-OS yourself.
- In the packaged build, `dct-os upgrade` points to the installer download
  instead of attempting a pip upgrade it cannot perform.
- **Reports build themselves.** Pick a supplier and the report appears
  immediately — no more "Generate" button. Narrowing the date range, switching
  to By-Docket mode, or picking individual dockets re-runs the report live as
  you go, so you shape the result by filtering it down rather than re-generating
  it each time.
- **Consistent export.** The Reports CSV/Excel export now lives under a
  **Data ▾** menu, matching the Dockets and Resources screens, instead of two
  loose buttons in the filter bar.

### Fixed

- **No phone-home, for real.** Removed an undocumented network call in
  `dct-os upgrade` that POSTed local usage counts (projects, dockets,
  resources, work orders, cost codes, purchase orders) to a remote endpoint.
  This contradicted the README's "no phone-home" promise and the changelog's
  own description of upgrade stats as logged *locally*. Upgrade still writes
  the same anonymous counts to `logs/upgrades.jsonl` on your machine, and the
  opt-in self-hosted log reporting (`DCT_OS_LOG_URL`) is unchanged.
- Rolled up the 1.0.1 hotfixes: the docket save button is guarded against
  double-submit (a fast double-click can no longer create a duplicate docket),
  docket line quantities are validated before save, and the docket CSV/Excel
  exports honour the current selection (`docket_ids`) so you can export just
  the filtered view instead of the whole project every time.
- The Reports export menu no longer appears when a filter returns no dockets —
  there's nothing to export from an empty report.

## [1.0.2] - 2026-06-17

### Fixed

- **Folder-browse auto-advance works again.** Saving a docket while browsing a
  folder of scans now correctly advances to the next pending scan. A regression
  in 1.0.1 read the dialog's success message *after* the dialog had been torn
  down, which threw and — swallowed by the save handler's error path — silently
  skipped both the auto-advance and the green "Saved" toast on every dialog
  save. Saves still persisted; you just didn't see the confirmation or get
  moved to the next scan. The message is now captured before the dialog closes.

## [1.0.1] - 2026-06-16

### Fixed

- **No more duplicate dockets from an impatient double-click.** Saving any
  dialog is guarded against a second submit while the first is still in flight,
  and the Save button disables itself while saving — one entry screen saves
  exactly once, even on a slow connection.
- **Clearer validation.** A docket line with a resource or description but no
  quantity is now blocked with a clear message instead of silently saving a
  zero-value line; the dialog stays open so you can fix it.
- **Docket export honours your selection.** Exporting to CSV/Excel from the
  Dockets screen now exports only the dockets shown by your column filters, not
  the whole project.

## [1.0.0] - 2026-06-13

First full release. Everything below is in addition to the 0.x line.

### Added — costing

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
- **Item + Description on resources.** A resource now has an Item (what it
  is — "Excavator 14T") and an optional Description (the detail — "Cat 314,
  rubber tracked, long arm") to help match the wording on dockets and
  invoices that never quite agrees. The line Description auto-fills from the
  selected resource. Existing databases migrate automatically.
- **Suppliers source of truth.** A behind-the-scenes suppliers reference
  table keeps names consistent everywhere — type a different-case variant
  and it resolves to the canonical spelling, new names are remembered. No
  management screen; supplier stays plain text on the entry forms.

### Added — faster entry

- **Quick-add a resource from a docket line** — pick "+ New item…" in the
  resource dropdown and add it without leaving the docket.
- **Supplier autocomplete** — inline type-ahead across docket, PO, and
  resource forms; Tab or → accepts, new names type straight through.
- **PO filtering** — the Purchase Order list narrows to the chosen
  supplier's active POs and auto-selects when there's exactly one.
- **Work Order + Cost Code carry-down** — a new line copies them from the
  line above; Enter in the last line's Qty/Unit adds the next line.
- **Keyboard shortcuts** — Alt+Shift+D / P / W / C / R to create a Docket,
  Purchase Order, Work Order, Cost Code, or Resource.

### Added — data & safety

- **Backups.** A Backup button in the database dialog downloads a
  timestamped snapshot. DCT-OS also keeps automatic rotating backups
  (last 7) in a `backups/` folder next to your database.
- **Excel export.** Dockets, the Docket Summary Report, and the Resources
  list export as formatted `.xlsx` workbooks alongside CSV.
- **Resources import.** Bring an existing rates list in from CSV (flexible
  headers, duplicates skipped).
- **API reference** at `docs/API.md`; a `SECURITY.md` policy; and a
  Contributor License Agreement gated automatically on pull requests.

### Changed

- **Cleaner header and toolbars.** Navigation tabs sit beside the brand;
  per-screen stats and the primary "+ Add" action share one row, with
  occasional actions (import/export) tucked into a "Data" menu.
- Summary report rows are split by exact rate (no more averaging) so each
  can be reviewed against the invoice independently.
- Opening a dialog focuses its first field; GitHub Actions updated to
  current versions (Node 24).

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
