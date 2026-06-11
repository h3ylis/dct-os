import csv
import io

from flask import Blueprint, Response, jsonify, request

from dct_os.db import get_db

bp = Blueprint("resources", __name__)


@bp.route("/resources", methods=["GET"])
def list_resources():
    db = get_db()
    category = request.args.get("category")
    if category:
        rows = db.execute(
            "SELECT * FROM resources WHERE category = ? ORDER BY description",
            (category,),
        ).fetchall()
    else:
        rows = db.execute(
            "SELECT * FROM resources ORDER BY category, description"
        ).fetchall()
    return jsonify([dict(r) for r in rows])


@bp.route("/resources/<int:resource_id>", methods=["GET"])
def get_resource(resource_id):
    db = get_db()
    row = db.execute("SELECT * FROM resources WHERE id = ?", (resource_id,)).fetchone()
    if row is None:
        return jsonify({"error": "Resource not found"}), 404
    return jsonify(dict(row))


@bp.route("/resources", methods=["POST"])
def create_resource():
    db = get_db()
    data = request.get_json()
    if not data or not data.get("description") or not data.get("unit"):
        return jsonify({"error": "description and unit are required"}), 400
    cur = db.execute(
        """INSERT INTO resources (description, details, unit, supplier_name, standard_rate, category)
           VALUES (?, ?, ?, ?, ?, ?)""",
        (
            data["description"],
            data.get("details"),
            data["unit"],
            data.get("supplier_name"),
            data.get("standard_rate", 0),
            data.get("category"),
        ),
    )
    db.commit()
    row = db.execute("SELECT * FROM resources WHERE id = ?", (cur.lastrowid,)).fetchone()
    return jsonify(dict(row)), 201


@bp.route("/resources/<int:resource_id>", methods=["PUT"])
def update_resource(resource_id):
    db = get_db()
    data = request.get_json()
    if not data:
        return jsonify({"error": "No data provided"}), 400
    existing = db.execute(
        "SELECT * FROM resources WHERE id = ?", (resource_id,)
    ).fetchone()
    if existing is None:
        return jsonify({"error": "Resource not found"}), 404

    fields = ["description", "details", "unit", "supplier_name", "standard_rate", "category"]
    updates = {f: data[f] for f in fields if f in data}
    if not updates:
        return jsonify({"error": "No valid fields to update"}), 400

    set_clause = ", ".join(f"{k} = ?" for k in updates)
    set_clause += ", updated_at = datetime('now')"
    values = list(updates.values())
    values.append(resource_id)

    db.execute(f"UPDATE resources SET {set_clause} WHERE id = ?", values)
    db.commit()
    row = db.execute("SELECT * FROM resources WHERE id = ?", (resource_id,)).fetchone()
    return jsonify(dict(row))


@bp.route("/resources/<int:resource_id>", methods=["DELETE"])
def delete_resource(resource_id):
    db = get_db()
    existing = db.execute(
        "SELECT * FROM resources WHERE id = ?", (resource_id,)
    ).fetchone()
    if existing is None:
        return jsonify({"error": "Resource not found"}), 404
    db.execute("DELETE FROM resources WHERE id = ?", (resource_id,))
    db.commit()
    return jsonify({"deleted": resource_id})


@bp.route("/resources/categories", methods=["GET"])
def list_categories():
    db = get_db()
    rows = db.execute(
        "SELECT DISTINCT category FROM resources WHERE category IS NOT NULL ORDER BY category"
    ).fetchall()
    return jsonify([r["category"] for r in rows])


# ---------------------------------------------------------------------------
# Import / export
# ---------------------------------------------------------------------------

def _all_resources(db):
    return db.execute(
        "SELECT description, details, unit, supplier_name, standard_rate, category "
        "FROM resources ORDER BY category, description"
    ).fetchall()


@bp.route("/resources/export-csv", methods=["GET"])
def export_resources_csv():
    """Export the resources table as CSV."""
    db = get_db()
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["Item", "Description", "Unit", "Supplier", "Standard Rate", "Category"])
    for r in _all_resources(db):
        writer.writerow([
            r["description"], r["details"] or "", r["unit"], r["supplier_name"] or "",
            round(r["standard_rate"] or 0, 2), r["category"] or "",
        ])
    return Response(
        output.getvalue(),
        mimetype="text/csv",
        headers={"Content-Disposition": 'attachment; filename="resources.csv"'},
    )


@bp.route("/resources/export-xlsx", methods=["GET"])
def export_resources_xlsx():
    """Export the resources table as a formatted Excel workbook."""
    from dct_os.api.dockets import _xlsx_finish, _xlsx_workbook

    db = get_db()
    wb, ws = _xlsx_workbook(
        "Resources",
        ["Item", "Description", "Unit", "Supplier", "Standard Rate", "Category"],
        currency_cols=[5],
    )
    for r in _all_resources(db):
        ws.append([
            r["description"], r["details"] or "", r["unit"], r["supplier_name"] or "",
            round(r["standard_rate"] or 0, 2), r["category"] or "",
        ])
    return _xlsx_finish(wb, ws, [28, 34, 8, 24, 14, 16], "resources.xlsx")


@bp.route("/resources/import-csv", methods=["POST"])
def import_resources_csv():
    """Import resources from CSV. Skips rows that already exist.

    Expected headers (case-insensitive, flexible): Description, Unit,
    Supplier, Standard Rate, Category. Description and Unit are required.
    A row is a duplicate when description + supplier match an existing
    resource (case-insensitive).
    """
    db = get_db()

    if "file" in request.files:
        text = request.files["file"].read().decode("utf-8-sig")
    else:
        data = request.get_json(silent=True)
        if not data or not data.get("csv_text"):
            return jsonify({"error": "CSV file or csv_text required"}), 400
        text = data["csv_text"]

    reader = csv.DictReader(io.StringIO(text))
    if not reader.fieldnames:
        return jsonify({"error": "CSV has no header row"}), 400

    # Map flexible header names to fields
    def norm(h):
        return (h or "").strip().lower().replace("_", " ")

    normed = {norm(h): h for h in reader.fieldnames}
    has_item = "item" in normed

    header_map = {}
    for n, h in normed.items():
        if n == "item":
            header_map["description"] = h
        elif n == "description":
            # With an Item column present, Description is the detail field;
            # without one (legacy exports), Description is the item name.
            header_map["details" if has_item else "description"] = h
        elif n in ("details", "notes"):
            header_map["details"] = h
        elif n == "unit":
            header_map["unit"] = h
        elif n in ("supplier", "supplier name"):
            header_map["supplier_name"] = h
        elif n in ("standard rate", "rate"):
            header_map["standard_rate"] = h
        elif n == "category":
            header_map["category"] = h

    if "description" not in header_map or "unit" not in header_map:
        return jsonify({"error": "CSV must have Item (or Description) and Unit columns"}), 400

    existing = {
        ((r["description"] or "").strip().lower(),
         (r["supplier_name"] or "").strip().lower())
        for r in db.execute(
            "SELECT description, supplier_name FROM resources"
        ).fetchall()
    }

    created = 0
    skipped = 0
    rows_read = 0
    for row in reader:
        rows_read += 1
        desc = (row.get(header_map["description"]) or "").strip()
        unit = (row.get(header_map["unit"]) or "").strip()
        if not desc or not unit:
            skipped += 1
            continue
        supplier = (row.get(header_map.get("supplier_name", ""), "") or "").strip() or None
        key = (desc.lower(), (supplier or "").lower())
        if key in existing:
            skipped += 1
            continue
        try:
            rate = float(row.get(header_map.get("standard_rate", ""), 0) or 0)
        except ValueError:
            rate = 0
        category = (row.get(header_map.get("category", ""), "") or "").strip() or None
        details = (row.get(header_map.get("details", ""), "") or "").strip() or None
        db.execute(
            """INSERT INTO resources (description, details, unit, supplier_name, standard_rate, category)
               VALUES (?, ?, ?, ?, ?, ?)""",
            (desc, details, unit, supplier, rate, category),
        )
        existing.add(key)
        created += 1

    db.commit()
    return jsonify({"created": created, "skipped": skipped, "rows_read": rows_read})
