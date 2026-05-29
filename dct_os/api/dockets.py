from flask import Blueprint, jsonify, request

from dct_os.db import get_db

bp = Blueprint("dockets", __name__)


@bp.route("/projects/<int:project_id>/dockets", methods=["GET"])
def list_dockets(project_id):
    db = get_db()
    rows = db.execute(
        """SELECT d.*,
                  cc.code AS cost_code,
                  r.description AS resource_description,
                  wo.number AS wo_number,
                  wo.description AS wo_description,
                  po.number AS po_number,
                  po.supplier_name AS po_supplier
           FROM dockets d
           LEFT JOIN cost_codes cc ON d.cost_code_id = cc.id
           LEFT JOIN resources r ON d.resource_id = r.id
           LEFT JOIN work_orders wo ON d.work_order_id = wo.id
           LEFT JOIN purchase_orders po ON d.purchase_order_id = po.id
           WHERE d.project_id = ?
           ORDER BY d.date DESC, d.id DESC""",
        (project_id,),
    ).fetchall()
    return jsonify([dict(r) for r in rows])


@bp.route("/dockets/<int:docket_id>", methods=["GET"])
def get_docket(docket_id):
    db = get_db()
    row = db.execute(
        """SELECT d.*,
                  cc.code AS cost_code,
                  r.description AS resource_description,
                  wo.number AS wo_number,
                  po.number AS po_number
           FROM dockets d
           LEFT JOIN cost_codes cc ON d.cost_code_id = cc.id
           LEFT JOIN resources r ON d.resource_id = r.id
           LEFT JOIN work_orders wo ON d.work_order_id = wo.id
           LEFT JOIN purchase_orders po ON d.purchase_order_id = po.id
           WHERE d.id = ?""",
        (docket_id,),
    ).fetchone()
    if row is None:
        return jsonify({"error": "Docket not found"}), 404
    return jsonify(dict(row))


@bp.route("/projects/<int:project_id>/dockets", methods=["POST"])
def create_docket(project_id):
    db = get_db()
    data = request.get_json()
    if not data or not data.get("date"):
        return jsonify({"error": "date is required"}), 400

    qty = data.get("qty", 0)
    rate = data.get("rate", 0)
    amount = data.get("amount") or qty * rate

    cur = db.execute(
        """INSERT INTO dockets
           (project_id, work_order_id, cost_code_id, purchase_order_id,
            resource_id, supplier_name, date, docket_number, description,
            qty, unit, rate, amount, notes)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
        (
            project_id,
            data.get("work_order_id"),
            data.get("cost_code_id"),
            data.get("purchase_order_id"),
            data.get("resource_id"),
            data.get("supplier_name"),
            data["date"],
            data.get("docket_number"),
            data.get("description"),
            qty,
            data.get("unit"),
            rate,
            amount,
            data.get("notes"),
        ),
    )
    db.commit()
    row = db.execute("SELECT * FROM dockets WHERE id = ?", (cur.lastrowid,)).fetchone()
    return jsonify(dict(row)), 201


@bp.route("/dockets/<int:docket_id>", methods=["PUT"])
def update_docket(docket_id):
    db = get_db()
    data = request.get_json()
    if not data:
        return jsonify({"error": "No data provided"}), 400
    existing = db.execute("SELECT * FROM dockets WHERE id = ?", (docket_id,)).fetchone()
    if existing is None:
        return jsonify({"error": "Docket not found"}), 404

    fields = [
        "work_order_id", "cost_code_id", "purchase_order_id",
        "resource_id", "supplier_name", "date",
        "docket_number", "description", "qty", "unit", "rate", "amount",
        "notes",
    ]
    updates = {f: data[f] for f in fields if f in data}

    if "qty" in updates or "rate" in updates:
        qty = updates.get("qty", existing["qty"])
        rate = updates.get("rate", existing["rate"])
        if "amount" not in updates:
            updates["amount"] = qty * rate

    if not updates:
        return jsonify({"error": "No valid fields to update"}), 400

    set_clause = ", ".join(f"{k} = ?" for k in updates)
    set_clause += ", updated_at = datetime('now')"
    values = list(updates.values())
    values.append(docket_id)

    db.execute(f"UPDATE dockets SET {set_clause} WHERE id = ?", values)
    db.commit()
    row = db.execute("SELECT * FROM dockets WHERE id = ?", (docket_id,)).fetchone()
    return jsonify(dict(row))


@bp.route("/dockets/<int:docket_id>", methods=["DELETE"])
def delete_docket(docket_id):
    db = get_db()
    existing = db.execute("SELECT * FROM dockets WHERE id = ?", (docket_id,)).fetchone()
    if existing is None:
        return jsonify({"error": "Docket not found"}), 404
    db.execute("DELETE FROM dockets WHERE id = ?", (docket_id,))
    db.commit()
    return jsonify({"deleted": docket_id})


@bp.route("/projects/<int:project_id>/summary", methods=["GET"])
def project_summary(project_id):
    db = get_db()
    summary = db.execute(
        """SELECT
               COUNT(*) AS total_dockets,
               COALESCE(SUM(amount), 0) AS total_spend,
               COUNT(DISTINCT supplier_name) AS supplier_count,
               COUNT(DISTINCT date) AS active_days
           FROM dockets
           WHERE project_id = ?""",
        (project_id,),
    ).fetchone()
    return jsonify(dict(summary))


@bp.route("/projects/<int:project_id>/cost-report", methods=["GET"])
def cost_report(project_id):
    db = get_db()
    rows = db.execute(
        """SELECT cc.code, cc.description, cc.budget_amount,
                  COALESCE(SUM(d.amount), 0) AS actual_spend,
                  cc.budget_amount - COALESCE(SUM(d.amount), 0) AS variance
           FROM cost_codes cc
           LEFT JOIN dockets d ON d.cost_code_id = cc.id AND d.project_id = cc.project_id
           WHERE cc.project_id = ?
           GROUP BY cc.id
           ORDER BY cc.code""",
        (project_id,),
    ).fetchall()
    return jsonify([dict(r) for r in rows])
