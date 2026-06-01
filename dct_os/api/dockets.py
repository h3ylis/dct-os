import csv
import io

from flask import Blueprint, Response, jsonify, request

from dct_os.db import get_db

bp = Blueprint("dockets", __name__)


def _build_docket(db, header_id):
    header = db.execute(
        """SELECT dh.*,
                  po.number AS po_number
           FROM docket_headers dh
           LEFT JOIN purchase_orders po ON dh.purchase_order_id = po.id
           WHERE dh.id = ?""",
        (header_id,),
    ).fetchone()
    if header is None:
        return None
    d = dict(header)
    lines = db.execute(
        """SELECT dl.*,
                  wo.number AS wo_number,
                  wo.description AS wo_description,
                  cc.code AS cost_code,
                  cc.description AS cc_description,
                  r.description AS resource_description
           FROM docket_lines dl
           LEFT JOIN work_orders wo ON dl.work_order_id = wo.id
           LEFT JOIN cost_codes cc ON dl.cost_code_id = cc.id
           LEFT JOIN resources r ON dl.resource_id = r.id
           WHERE dl.docket_id = ?
           ORDER BY dl.sort_order, dl.id""",
        (header_id,),
    ).fetchall()
    d["lines"] = [dict(ln) for ln in lines]
    d["line_count"] = len(d["lines"])
    d["total_amount"] = sum(ln["amount"] or 0 for ln in d["lines"])
    return d


@bp.route("/projects/<int:project_id>/dockets", methods=["GET"])
def list_dockets(project_id):
    db = get_db()
    headers = db.execute(
        """SELECT dh.*,
                  po.number AS po_number,
                  COUNT(dl.id) AS line_count,
                  COALESCE(SUM(dl.amount), 0) AS total_amount,
                  GROUP_CONCAT(DISTINCT wo.number) AS wo_numbers,
                  GROUP_CONCAT(DISTINCT cc.code) AS cost_codes
           FROM docket_headers dh
           LEFT JOIN purchase_orders po ON dh.purchase_order_id = po.id
           LEFT JOIN docket_lines dl ON dl.docket_id = dh.id
           LEFT JOIN work_orders wo ON dl.work_order_id = wo.id
           LEFT JOIN cost_codes cc ON dl.cost_code_id = cc.id
           WHERE dh.project_id = ?
           GROUP BY dh.id
           ORDER BY dh.date DESC, dh.id DESC""",
        (project_id,),
    ).fetchall()
    result = []
    for h in headers:
        d = dict(h)
        lines = db.execute(
            """SELECT dl.*,
                      wo.number AS wo_number,
                      cc.code AS cost_code,
                      r.description AS resource_description
               FROM docket_lines dl
               LEFT JOIN work_orders wo ON dl.work_order_id = wo.id
               LEFT JOIN cost_codes cc ON dl.cost_code_id = cc.id
               LEFT JOIN resources r ON dl.resource_id = r.id
               WHERE dl.docket_id = ?
               ORDER BY dl.sort_order, dl.id""",
            (d["id"],),
        ).fetchall()
        d["lines"] = [dict(ln) for ln in lines]
        result.append(d)
    return jsonify(result)


@bp.route("/dockets/<int:docket_id>", methods=["GET"])
def get_docket(docket_id):
    db = get_db()
    d = _build_docket(db, docket_id)
    if d is None:
        return jsonify({"error": "Docket not found"}), 404
    return jsonify(d)


@bp.route("/projects/<int:project_id>/dockets", methods=["POST"])
def create_docket(project_id):
    db = get_db()
    data = request.get_json()
    if not data or not data.get("date"):
        return jsonify({"error": "date is required"}), 400

    cur = db.execute(
        """INSERT INTO docket_headers
           (project_id, purchase_order_id, supplier_name, date,
            docket_number, notes, source_hash, source_filename)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)""",
        (
            project_id,
            data.get("purchase_order_id"),
            data.get("supplier_name"),
            data["date"],
            data.get("docket_number"),
            data.get("notes"),
            data.get("source_hash"),
            data.get("source_filename"),
        ),
    )
    header_id = cur.lastrowid

    for i, line in enumerate(data.get("lines", [])):
        qty = line.get("qty", 0)
        rate = line.get("rate", 0)
        amount = line.get("amount") or qty * rate
        db.execute(
            """INSERT INTO docket_lines
               (docket_id, work_order_id, cost_code_id, resource_id,
                description, qty, unit, rate, amount, sort_order)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
            (
                header_id,
                line.get("work_order_id"),
                line.get("cost_code_id"),
                line.get("resource_id"),
                line.get("description"),
                qty,
                line.get("unit"),
                rate,
                amount,
                line.get("sort_order", i),
            ),
        )
    db.commit()
    return jsonify(_build_docket(db, header_id)), 201


@bp.route("/dockets/<int:docket_id>", methods=["PUT"])
def update_docket(docket_id):
    db = get_db()
    data = request.get_json()
    if not data:
        return jsonify({"error": "No data provided"}), 400
    existing = db.execute(
        "SELECT * FROM docket_headers WHERE id = ?", (docket_id,)
    ).fetchone()
    if existing is None:
        return jsonify({"error": "Docket not found"}), 404

    header_fields = [
        "purchase_order_id", "supplier_name", "date",
        "docket_number", "notes", "source_hash", "source_filename",
    ]
    updates = {f: data[f] for f in header_fields if f in data}
    if updates:
        set_clause = ", ".join(f"{k} = ?" for k in updates)
        set_clause += ", updated_at = datetime('now')"
        values = list(updates.values())
        values.append(docket_id)
        db.execute(
            f"UPDATE docket_headers SET {set_clause} WHERE id = ?", values
        )

    if "lines" in data:
        db.execute("DELETE FROM docket_lines WHERE docket_id = ?", (docket_id,))
        for i, line in enumerate(data["lines"]):
            qty = line.get("qty", 0)
            rate = line.get("rate", 0)
            amount = line.get("amount") or qty * rate
            db.execute(
                """INSERT INTO docket_lines
                   (docket_id, work_order_id, cost_code_id, resource_id,
                    description, qty, unit, rate, amount, sort_order)
                   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
                (
                    docket_id,
                    line.get("work_order_id"),
                    line.get("cost_code_id"),
                    line.get("resource_id"),
                    line.get("description"),
                    qty,
                    line.get("unit"),
                    rate,
                    amount,
                    line.get("sort_order", i),
                ),
            )
    db.commit()
    return jsonify(_build_docket(db, docket_id))


@bp.route("/dockets/<int:docket_id>", methods=["DELETE"])
def delete_docket(docket_id):
    db = get_db()
    existing = db.execute(
        "SELECT * FROM docket_headers WHERE id = ?", (docket_id,)
    ).fetchone()
    if existing is None:
        return jsonify({"error": "Docket not found"}), 404
    db.execute("DELETE FROM docket_headers WHERE id = ?", (docket_id,))
    db.commit()
    return jsonify({"deleted": docket_id})


@bp.route("/projects/<int:project_id>/summary", methods=["GET"])
def project_summary(project_id):
    db = get_db()
    summary = db.execute(
        """SELECT
               COUNT(DISTINCT dh.id) AS total_dockets,
               COALESCE(SUM(dl.amount), 0) AS total_spend,
               COUNT(DISTINCT dh.supplier_name) AS supplier_count,
               COUNT(DISTINCT dh.date) AS active_days
           FROM docket_headers dh
           LEFT JOIN docket_lines dl ON dl.docket_id = dh.id
           WHERE dh.project_id = ?""",
        (project_id,),
    ).fetchone()
    return jsonify(dict(summary))


@bp.route("/projects/<int:project_id>/cost-report", methods=["GET"])
def cost_report(project_id):
    db = get_db()
    rows = db.execute(
        """SELECT cc.code, cc.description, cc.budget_amount,
                  COALESCE(SUM(dl.amount), 0) AS actual_spend,
                  cc.budget_amount - COALESCE(SUM(dl.amount), 0) AS variance
           FROM cost_codes cc
           LEFT JOIN docket_lines dl ON dl.cost_code_id = cc.id
           LEFT JOIN docket_headers dh ON dl.docket_id = dh.id
                AND dh.project_id = cc.project_id
           WHERE cc.project_id = ?
           GROUP BY cc.id
           ORDER BY cc.code""",
        (project_id,),
    ).fetchall()
    return jsonify([dict(r) for r in rows])


@bp.route("/projects/<int:project_id>/suppliers", methods=["GET"])
def list_project_suppliers(project_id):
    """Distinct supplier names from POs, docket headers, and resources."""
    db = get_db()
    rows = db.execute(
        """SELECT DISTINCT name FROM (
               SELECT supplier_name AS name
               FROM purchase_orders WHERE project_id = ? AND supplier_name IS NOT NULL
               UNION
               SELECT supplier_name AS name
               FROM docket_headers WHERE project_id = ? AND supplier_name IS NOT NULL
               UNION
               SELECT supplier_name AS name
               FROM resources WHERE supplier_name IS NOT NULL
           ) sub
           ORDER BY name COLLATE NOCASE""",
        (project_id, project_id),
    ).fetchall()
    return jsonify([r["name"] for r in rows])


def _build_summary_filter(project_id, args):
    """Build WHERE clause for summary queries (shared by JSON + CSV)."""
    supplier = args.get("supplier")
    if not supplier:
        return None, None, "supplier parameter is required"

    date_from = args.get("date_from")
    date_to = args.get("date_to")
    docket_ids_raw = args.get("docket_ids")

    params = [project_id, supplier]
    where = "dh.project_id = ? AND dh.supplier_name = ?"

    if docket_ids_raw:
        ids = [int(x) for x in docket_ids_raw.split(",") if x.strip().isdigit()]
        if ids:
            placeholders = ",".join("?" * len(ids))
            where += f" AND dh.id IN ({placeholders})"
            params.extend(ids)
    else:
        if date_from:
            where += " AND dh.date >= ?"
            params.append(date_from)
        if date_to:
            where += " AND dh.date <= ?"
            params.append(date_to)

    return where, params, None


def _run_summary_query(db, where, params):
    """Execute the summary GROUP BY query."""
    return db.execute(
        f"""SELECT
                COALESCE(r.category, 'Uncategorised') AS category,
                COALESCE(r.description, dl.description, 'Unknown') AS resource_desc,
                dl.unit,
                SUM(dl.qty) AS total_qty,
                CASE WHEN SUM(dl.qty) > 0
                     THEN SUM(dl.amount) / SUM(dl.qty)
                     ELSE 0 END AS avg_rate,
                SUM(dl.amount) AS subtotal,
                COUNT(DISTINCT dh.id) AS docket_count
            FROM docket_lines dl
            JOIN docket_headers dh ON dl.docket_id = dh.id
            LEFT JOIN resources r ON dl.resource_id = r.id
            WHERE {where}
            GROUP BY category, resource_desc, dl.unit
            ORDER BY category, resource_desc""",
        params,
    ).fetchall()


@bp.route("/projects/<int:project_id>/docket-summary", methods=["GET"])
def docket_summary(project_id):
    """Docket summary grouped by category/resource for a supplier."""
    db = get_db()
    where, params, err = _build_summary_filter(project_id, request.args)
    if err:
        return jsonify({"error": err}), 400

    rows = _run_summary_query(db, where, params)

    groups = {}
    grand_total = 0
    for r in rows:
        d = dict(r)
        cat = d["category"]
        if cat not in groups:
            groups[cat] = {"category": cat, "items": [], "category_total": 0}
        groups[cat]["items"].append(d)
        groups[cat]["category_total"] += d["subtotal"] or 0
        grand_total += d["subtotal"] or 0

    return jsonify({
        "supplier": request.args.get("supplier"),
        "date_from": request.args.get("date_from"),
        "date_to": request.args.get("date_to"),
        "docket_ids": request.args.get("docket_ids"),
        "groups": list(groups.values()),
        "grand_total": grand_total,
    })


@bp.route("/projects/<int:project_id>/docket-summary/csv", methods=["GET"])
def docket_summary_csv(project_id):
    """Export docket summary as CSV."""
    db = get_db()
    where, params, err = _build_summary_filter(project_id, request.args)
    if err:
        return jsonify({"error": err}), 400

    rows = _run_summary_query(db, where, params)

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow([
        "Category", "Resource", "Unit", "Total Qty",
        "Avg Rate", "Subtotal", "Docket Count",
    ])
    for r in rows:
        writer.writerow([
            r["category"], r["resource_desc"], r["unit"],
            r["total_qty"], round(r["avg_rate"], 2),
            round(r["subtotal"], 2), r["docket_count"],
        ])

    supplier = request.args.get("supplier", "unknown")
    filename = f"docket_summary_{supplier.replace(' ', '_')}.csv"
    return Response(
        output.getvalue(),
        mimetype="text/csv",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


@bp.route("/projects/<int:project_id>/dockets/by-supplier", methods=["GET"])
def list_dockets_by_supplier(project_id):
    """List docket headers for a specific supplier (for docket picker)."""
    db = get_db()
    supplier = request.args.get("supplier")
    if not supplier:
        return jsonify({"error": "supplier parameter is required"}), 400

    where = "dh.project_id = ? AND dh.supplier_name = ?"
    params = [project_id, supplier]

    if request.args.get("unclaimed") == "1":
        where += " AND (dh.claimed_reference IS NULL OR dh.claimed_reference = '')"

    rows = db.execute(
        f"""SELECT dh.id, dh.date, dh.docket_number,
                  dh.claimed_reference, dh.claimed_at,
                  COALESCE(SUM(dl.amount), 0) AS total_amount,
                  COUNT(dl.id) AS line_count
           FROM docket_headers dh
           LEFT JOIN docket_lines dl ON dl.docket_id = dh.id
           WHERE {where}
           GROUP BY dh.id
           ORDER BY dh.date DESC, dh.docket_number""",
        params,
    ).fetchall()
    return jsonify([dict(r) for r in rows])


@bp.route("/projects/<int:project_id>/dockets/claim", methods=["POST"])
def claim_dockets(project_id):
    """Mark selected dockets as claimed with a reference string."""
    db = get_db()
    data = request.get_json()
    if not data:
        return jsonify({"error": "No data provided"}), 400
    docket_ids = data.get("docket_ids", [])
    reference = data.get("reference", "").strip()
    if not docket_ids:
        return jsonify({"error": "docket_ids is required"}), 400
    if not reference:
        return jsonify({"error": "reference is required"}), 400

    placeholders = ",".join("?" * len(docket_ids))
    db.execute(
        f"""UPDATE docket_headers
            SET claimed_reference = ?, claimed_at = datetime('now'),
                updated_at = datetime('now')
            WHERE id IN ({placeholders}) AND project_id = ?""",
        [reference] + list(docket_ids) + [project_id],
    )
    db.commit()
    return jsonify({"claimed": len(docket_ids), "reference": reference})


@bp.route("/projects/<int:project_id>/dockets/unclaim", methods=["POST"])
def unclaim_dockets(project_id):
    """Clear claim reference from selected dockets."""
    db = get_db()
    data = request.get_json()
    if not data:
        return jsonify({"error": "No data provided"}), 400
    docket_ids = data.get("docket_ids", [])
    if not docket_ids:
        return jsonify({"error": "docket_ids is required"}), 400

    placeholders = ",".join("?" * len(docket_ids))
    db.execute(
        f"""UPDATE docket_headers
            SET claimed_reference = NULL, claimed_at = NULL,
                updated_at = datetime('now')
            WHERE id IN ({placeholders}) AND project_id = ?""",
        list(docket_ids) + [project_id],
    )
    db.commit()
    return jsonify({"unclaimed": len(docket_ids)})


@bp.route("/projects/<int:project_id>/check-hashes", methods=["POST"])
def check_hashes(project_id):
    """Check which source hashes already exist. Returns matched hashes."""
    db = get_db()
    data = request.get_json()
    if not data or not isinstance(data.get("hashes"), list):
        return jsonify({"error": "hashes array is required"}), 400

    hashes = data["hashes"]
    if not hashes:
        return jsonify({"existing": []})

    placeholders = ",".join("?" * len(hashes))
    rows = db.execute(
        f"""SELECT source_hash, id, docket_number, date
            FROM docket_headers
            WHERE project_id = ? AND source_hash IN ({placeholders})""",
        [project_id] + hashes,
    ).fetchall()

    return jsonify({
        "existing": [dict(r) for r in rows],
    })


@bp.route("/projects/<int:project_id>/dockets/export-csv", methods=["GET"])
def export_dockets_csv(project_id):
    """Export raw docket data as CSV (one row per line item)."""
    db = get_db()
    rows = db.execute(
        """SELECT dh.date, dh.docket_number, dh.supplier_name,
                  po.number AS po_number,
                  wo.number AS wo_number,
                  cc.code AS cost_code,
                  r.description AS resource_description,
                  dl.description, dl.qty, dl.unit, dl.rate, dl.amount,
                  dh.notes, dh.claimed_reference
           FROM docket_headers dh
           LEFT JOIN purchase_orders po ON dh.purchase_order_id = po.id
           JOIN docket_lines dl ON dl.docket_id = dh.id
           LEFT JOIN work_orders wo ON dl.work_order_id = wo.id
           LEFT JOIN cost_codes cc ON dl.cost_code_id = cc.id
           LEFT JOIN resources r ON dl.resource_id = r.id
           WHERE dh.project_id = ?
           ORDER BY dh.date, dh.docket_number, dl.sort_order""",
        (project_id,),
    ).fetchall()

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow([
        "Date", "Docket #", "Supplier", "PO #",
        "WO #", "Cost Code", "Resource", "Description",
        "Qty", "Unit", "Rate", "Amount", "Notes", "Claimed",
    ])
    for r in rows:
        writer.writerow([
            r["date"], r["docket_number"], r["supplier_name"],
            r["po_number"] or "", r["wo_number"] or "",
            r["cost_code"] or "", r["resource_description"] or "",
            r["description"] or "", r["qty"], r["unit"] or "",
            round(r["rate"] or 0, 2), round(r["amount"] or 0, 2),
            r["notes"] or "", r["claimed_reference"] or "",
        ])

    project = db.execute(
        "SELECT code FROM projects WHERE id = ?", (project_id,)
    ).fetchone()
    code = (project["code"] or "project").replace(" ", "_") if project else "project"
    filename = f"dockets_{code}.csv"
    return Response(
        output.getvalue(),
        mimetype="text/csv",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


@bp.route("/projects/<int:project_id>/dockets/import-csv", methods=["POST"])
def import_dockets_csv(project_id):
    """Import dockets from CSV. Matches WO/CC/Resource by code/number."""
    db = get_db()

    if "file" not in request.files:
        # Try JSON body with csv_text
        data = request.get_json()
        if not data or not data.get("csv_text"):
            return jsonify({"error": "CSV file or csv_text required"}), 400
        reader = csv.DictReader(io.StringIO(data["csv_text"]))
    else:
        f = request.files["file"]
        text = f.read().decode("utf-8-sig")
        reader = csv.DictReader(io.StringIO(text))

    # Build lookup maps for this project
    wos = {
        r["number"]: r["id"]
        for r in db.execute(
            "SELECT id, number FROM work_orders WHERE project_id = ?",
            (project_id,),
        ).fetchall()
    }
    ccs = {
        r["code"]: r["id"]
        for r in db.execute(
            "SELECT id, code FROM cost_codes WHERE project_id = ?",
            (project_id,),
        ).fetchall()
    }
    pos = {
        r["number"]: r["id"]
        for r in db.execute(
            "SELECT id, number FROM purchase_orders WHERE project_id = ?",
            (project_id,),
        ).fetchall()
    }
    resources = {
        r["description"].lower(): r["id"]
        for r in db.execute("SELECT id, description FROM resources").fetchall()
    }

    # Group CSV rows into docket headers
    groups = {}
    row_count = 0
    for row in reader:
        row_count += 1
        date = (row.get("Date") or "").strip()
        docket_num = (row.get("Docket #") or "").strip()
        supplier = (row.get("Supplier") or "").strip()
        if not date:
            continue

        key = (date, docket_num, supplier)
        if key not in groups:
            groups[key] = {
                "date": date,
                "docket_number": docket_num or None,
                "supplier_name": supplier or None,
                "po_number": (row.get("PO #") or "").strip() or None,
                "notes": (row.get("Notes") or "").strip() or None,
                "lines": [],
            }

        wo_num = (row.get("WO #") or "").strip()
        cc_code = (row.get("Cost Code") or "").strip()
        res_desc = (row.get("Resource") or "").strip()

        try:
            qty = float(row.get("Qty") or 0)
        except (ValueError, TypeError):
            qty = 0
        try:
            rate = float(row.get("Rate") or 0)
        except (ValueError, TypeError):
            rate = 0

        groups[key]["lines"].append({
            "work_order_id": wos.get(wo_num),
            "cost_code_id": ccs.get(cc_code),
            "resource_id": resources.get(res_desc.lower()) if res_desc else None,
            "description": (row.get("Description") or "").strip() or None,
            "qty": qty,
            "unit": (row.get("Unit") or "").strip() or None,
            "rate": rate,
        })

    # Insert dockets, skipping duplicates
    created = 0
    skipped = 0
    for key, grp in groups.items():
        date, docket_num, supplier = key
        if docket_num and supplier:
            dup = db.execute(
                """SELECT id FROM docket_headers
                   WHERE project_id = ? AND supplier_name = ?
                   AND docket_number = ? AND date = ?""",
                (project_id, supplier, docket_num, date),
            ).fetchone()
            if dup:
                skipped += 1
                continue

        po_id = pos.get(grp["po_number"]) if grp["po_number"] else None

        cur = db.execute(
            """INSERT INTO docket_headers
               (project_id, purchase_order_id, supplier_name, date,
                docket_number, notes)
               VALUES (?, ?, ?, ?, ?, ?)""",
            (project_id, po_id, grp["supplier_name"], grp["date"],
             grp["docket_number"], grp["notes"]),
        )
        header_id = cur.lastrowid

        for i, line in enumerate(grp["lines"]):
            amount = line["qty"] * line["rate"]
            db.execute(
                """INSERT INTO docket_lines
                   (docket_id, work_order_id, cost_code_id, resource_id,
                    description, qty, unit, rate, amount, sort_order)
                   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
                (header_id, line["work_order_id"], line["cost_code_id"],
                 line["resource_id"], line["description"],
                 line["qty"], line["unit"], line["rate"], amount, i),
            )
        created += 1

    db.commit()
    return jsonify({
        "created": created,
        "skipped": skipped,
        "rows_read": row_count,
    })


@bp.route("/projects/<int:project_id>/check-duplicate", methods=["GET"])
def check_duplicate(project_id):
    """Check if a docket with same supplier+number+date already exists."""
    db = get_db()
    supplier = request.args.get("supplier")
    docket_number = request.args.get("docket_number")
    date = request.args.get("date")
    exclude_id = request.args.get("exclude_id")

    if not supplier or not docket_number or not date:
        return jsonify({"duplicate": False})

    params = [project_id, supplier, docket_number, date]
    where = """project_id = ? AND supplier_name = ?
               AND docket_number = ? AND date = ?"""
    if exclude_id:
        where += " AND id != ?"
        params.append(int(exclude_id))

    row = db.execute(
        f"SELECT id FROM docket_headers WHERE {where} LIMIT 1",
        params,
    ).fetchone()

    return jsonify({
        "duplicate": row is not None,
        "existing_id": row["id"] if row else None,
    })
