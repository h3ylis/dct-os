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
            docket_number, notes)
           VALUES (?, ?, ?, ?, ?, ?)""",
        (
            project_id,
            data.get("purchase_order_id"),
            data.get("supplier_name"),
            data["date"],
            data.get("docket_number"),
            data.get("notes"),
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
        "docket_number", "notes",
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


@bp.route("/projects/<int:project_id>/docket-summary", methods=["GET"])
def docket_summary(project_id):
    """Docket summary grouped by category/resource for a supplier + date range."""
    db = get_db()
    supplier = request.args.get("supplier")
    if not supplier:
        return jsonify({"error": "supplier parameter is required"}), 400

    date_from = request.args.get("date_from")
    date_to = request.args.get("date_to")

    params = [project_id, supplier]
    where = "dh.project_id = ? AND dh.supplier_name = ?"
    if date_from:
        where += " AND dh.date >= ?"
        params.append(date_from)
    if date_to:
        where += " AND dh.date <= ?"
        params.append(date_to)

    rows = db.execute(
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

    # Build grouped structure
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
        "supplier": supplier,
        "date_from": date_from,
        "date_to": date_to,
        "groups": list(groups.values()),
        "grand_total": grand_total,
    })


@bp.route("/projects/<int:project_id>/docket-summary/csv", methods=["GET"])
def docket_summary_csv(project_id):
    """Export docket summary as CSV."""
    db = get_db()
    supplier = request.args.get("supplier")
    if not supplier:
        return jsonify({"error": "supplier parameter is required"}), 400

    date_from = request.args.get("date_from")
    date_to = request.args.get("date_to")

    params = [project_id, supplier]
    where = "dh.project_id = ? AND dh.supplier_name = ?"
    if date_from:
        where += " AND dh.date >= ?"
        params.append(date_from)
    if date_to:
        where += " AND dh.date <= ?"
        params.append(date_to)

    rows = db.execute(
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

    filename = f"docket_summary_{supplier.replace(' ', '_')}.csv"
    return Response(
        output.getvalue(),
        mimetype="text/csv",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )
