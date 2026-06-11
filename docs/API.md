# DCT-OS REST API Reference

All endpoints are prefixed with `/api` and exchange JSON unless noted. The server runs at `http://localhost:5000` by default (`DCT_HOST` / `DCT_PORT` to change). There is no authentication — DCT-OS binds to localhost and is designed for single-user or trusted-network use.

A quick taste:

```bash
# List active projects
curl http://localhost:5000/api/projects?status=Active

# Create a docket with two lines
curl -X POST http://localhost:5000/api/projects/1/dockets \
  -H "Content-Type: application/json" \
  -d '{"date": "2026-06-11", "supplier_name": "Example Plant Hire",
       "docket_number": "EPH-1042", "lines": [
         {"resource_id": 3, "qty": 8},
         {"description": "Site cleanup labour", "qty": 4, "unit": "hr", "rate": 65}
       ]}'
```

## Projects

| Method | Path | Description |
|---|---|---|
| GET | `/api/projects` | List projects. Optional `?status=Active` filter. |
| POST | `/api/projects` | Create a project. Requires `name`; optional `code`, `client`, `start_date`, `end_date`, `status`. |
| GET | `/api/projects/<id>` | Get one project. |
| PUT | `/api/projects/<id>` | Update any project fields. |
| DELETE | `/api/projects/<id>` | Delete a project and all its child data (cascades). |
| GET | `/api/projects/<id>/summary` | Docket count, total spend, supplier count. |
| GET | `/api/projects/<id>/cost-report` | Per-cost-code budget vs actual vs variance. |
| GET | `/api/projects/<id>/suppliers` | Distinct supplier names used in this project. |

## Cost Codes

| Method | Path | Description |
|---|---|---|
| GET | `/api/projects/<id>/cost-codes` | List cost codes for a project. |
| POST | `/api/projects/<id>/cost-codes` | Create. Requires `code`; optional `description`, `budget_amount`. |
| GET | `/api/cost-codes/<id>` | Get one. |
| PUT | `/api/cost-codes/<id>` | Update. |
| DELETE | `/api/cost-codes/<id>` | Delete. |

## Work Orders

| Method | Path | Description |
|---|---|---|
| GET | `/api/projects/<id>/work-orders` | List work orders for a project. |
| POST | `/api/projects/<id>/work-orders` | Create. Requires `number`; optional `description`, `status`. |
| GET | `/api/work-orders/<id>` | Get one. |
| PUT | `/api/work-orders/<id>` | Update. |
| DELETE | `/api/work-orders/<id>` | Delete. |
| GET | `/api/work-orders/<id>/cost-codes` | Cost codes valid for this WO (the WO–CC matrix). |
| POST | `/api/work-orders/<id>/cost-codes` | Assign a cost code to this WO. Body: `{"cost_code_id": N}`. |
| DELETE | `/api/work-orders/<id>/cost-codes/<cc_id>` | Remove a cost code assignment. |

## Purchase Orders

| Method | Path | Description |
|---|---|---|
| GET | `/api/projects/<id>/purchase-orders` | List POs with live drawdown (committed value vs docket spend). |
| POST | `/api/projects/<id>/purchase-orders` | Create. Requires `number`; optional `supplier_name`, `value`, `description`, `status`. |
| GET | `/api/purchase-orders/<id>` | Get one. |
| PUT | `/api/purchase-orders/<id>` | Update. |
| DELETE | `/api/purchase-orders/<id>` | Delete. |
| GET | `/api/purchase-orders/<id>/work-orders` | Work orders linked to this PO. |
| POST | `/api/purchase-orders/<id>/work-orders` | Link a work order. Body: `{"work_order_id": N}`. |
| DELETE | `/api/purchase-orders/<id>/work-orders/<wo_id>` | Unlink. |

## Resources

| Method | Path | Description |
|---|---|---|
| GET | `/api/resources` | List all resources. Optional `?category=` filter. |
| POST | `/api/resources` | Create. Requires `description` and `unit`; optional `supplier_name`, `standard_rate`, `category`. |
| GET | `/api/resources/<id>` | Get one. |
| PUT | `/api/resources/<id>` | Update. |
| DELETE | `/api/resources/<id>` | Delete. |
| GET | `/api/resources/categories` | Distinct category names. |
| GET | `/api/resources/export-csv` | Export the resources table as CSV. |
| GET | `/api/resources/export-xlsx` | Export the resources table as a formatted Excel workbook. |
| POST | `/api/resources/import-csv` | Import resources from CSV (multipart `file` or JSON `csv_text`). Headers: Description, Unit, Supplier, Standard Rate, Category. Duplicates (description + supplier) are skipped. |

## Dockets

Dockets are header + lines: the header carries date, supplier, docket number, and optional PO; each line carries an optional work order, cost code, and resource, plus description, qty, unit, rate, and amount.

| Method | Path | Description |
|---|---|---|
| GET | `/api/projects/<id>/dockets` | List docket headers with nested `lines`, `total_amount`, `line_count`. |
| POST | `/api/projects/<id>/dockets` | Create. Body: header fields + `lines: [...]`. Line amounts auto-calculate from `qty * rate`. |
| GET | `/api/dockets/<id>` | Get one header with lines. |
| PUT | `/api/dockets/<id>` | Update header fields; if `lines` is provided, lines are replaced. |
| DELETE | `/api/dockets/<id>` | Delete header and lines. |
| GET | `/api/projects/<id>/dockets/by-supplier` | Dockets filtered by `?supplier=` (used by the report picker). |
| POST | `/api/projects/<id>/dockets/claim` | Tag dockets with a claim reference. Body: `{"docket_ids": [...], "claim_ref": "INV-001"}`. |
| POST | `/api/projects/<id>/dockets/unclaim` | Remove claim tags. Body: `{"docket_ids": [...]}`. |
| GET | `/api/projects/<id>/dockets/export-csv` | Export all dockets as CSV (one row per line item). |
| POST | `/api/projects/<id>/dockets/import-csv` | Import dockets from CSV (multipart upload). |
| GET | `/api/projects/<id>/check-duplicate` | Check `?docket_number=&supplier=` for an existing docket. |
| POST | `/api/projects/<id>/check-hashes` | Check SHA-256 source-file fingerprints against existing dockets. Body: `{"hashes": [...]}`. |

## Reports

| Method | Path | Description |
|---|---|---|
| GET | `/api/projects/<id>/docket-summary` | Supplier summary. Params: `supplier` (required), then either `date_from`/`date_to` or `docket_ids`. Rows are split by rate and include `line_ids` for the rate-review flow. |
| GET | `/api/projects/<id>/docket-summary/csv` | Same report as CSV download. |
| GET | `/api/projects/<id>/docket-summary/xlsx` | Same report as a formatted Excel workbook. |
| GET | `/api/projects/<id>/dockets/export-xlsx` | All dockets as a formatted Excel workbook (one row per line). |
| POST | `/api/projects/<id>/rerate` | Rate review: re-rate docket lines. Body: `{"line_ids": [...], "new_rate": N, "resource_id": N\|null, "update_standard": bool, "add_resource": {...}\|null}`. Returns previous values for undo. |

## Database Management

| Method | Path | Description |
|---|---|---|
| GET | `/api/database` | Current database path, lock status, and recent databases list. |
| POST | `/api/database/switch` | Switch to another database file. Body: `{"path": "..."}`. Runs migrations, manages lock files, records in recents. |
| POST | `/api/database/create` | Create a new empty database. Body: `{"directory": "...", "filename": "site.db"}`. |
| GET | `/api/browse` | Filesystem browser: folders and `.db` files at `?path=`. Returns shortcuts and (Windows) drive letters. |

## Meta

| Method | Path | Description |
|---|---|---|
| GET | `/api/version` | Installed version, plus `update_available` when PyPI has a newer release. |
| GET | `/api/backup` | Download a consistent snapshot of the current database (timestamped filename). |

## Errors

Errors return JSON with an `error` key and an appropriate status code:

```json
{ "error": "Docket not found" }
```

`400` bad request (missing/invalid fields), `404` not found, `409` conflict (e.g. creating a database that already exists).
