# Changelog

All notable changes to DCT-OS will be documented in this file.

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
