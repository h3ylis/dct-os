from flask import Blueprint, jsonify, request

from dct_os.db import get_db, register_supplier

bp = Blueprint("purchase_orders", __name__)


@bp.route("/projects/<int:project_id>/purchase-orders", methods=["GET"])
def list_purchase_orders(project_id):
    db = get_db()
    rows = db.execute(
        """SELECT po.*,
                  COALESCE(SUM(dl.amount), 0) AS spent,
                  po.value - COALESCE(SUM(dl.amount), 0) AS remaining
           FROM purchase_orders po
           LEFT JOIN docket_headers dh ON dh.purchase_order_id = po.id
           LEFT JOIN docket_lines dl ON dl.docket_id = dh.id
           WHERE po.project_id = ?
           GROUP BY po.id
           ORDER BY po.number""",
        (project_id,),
    ).fetchall()
    return jsonify([dict(r) for r in rows])


@bp.route("/purchase-orders/<int:po_id>", methods=["GET"])
def get_purchase_order(po_id):
    db = get_db()
    row = db.execute(
        """SELECT po.*,
                  COALESCE(SUM(dl.amount), 0) AS spent,
                  po.value - COALESCE(SUM(dl.amount), 0) AS remaining
           FROM purchase_orders po
           LEFT JOIN docket_headers dh ON dh.purchase_order_id = po.id
           LEFT JOIN docket_lines dl ON dl.docket_id = dh.id
           WHERE po.id = ?
           GROUP BY po.id""",
        (po_id,),
    ).fetchone()
    if row is None:
        return jsonify({"error": "Purchase order not found"}), 404
    return jsonify(dict(row))


@bp.route("/projects/<int:project_id>/purchase-orders", methods=["POST"])
def create_purchase_order(project_id):
    db = get_db()
    data = request.get_json()
    if not data or not data.get("number"):
        return jsonify({"error": "number is required"}), 400
    cur = db.execute(
        """INSERT INTO purchase_orders
           (project_id, number, supplier_name, value, raised_date, is_active, notes)
           VALUES (?, ?, ?, ?, ?, ?, ?)""",
        (
            project_id,
            data["number"],
            register_supplier(db, data.get("supplier_name")),
            data.get("value", 0),
            data.get("raised_date"),
            data.get("is_active", 1),
            data.get("notes"),
        ),
    )
    db.commit()
    row = db.execute("SELECT * FROM purchase_orders WHERE id = ?", (cur.lastrowid,)).fetchone()
    return jsonify(dict(row)), 201


@bp.route("/purchase-orders/<int:po_id>", methods=["PUT"])
def update_purchase_order(po_id):
    db = get_db()
    data = request.get_json()
    if not data:
        return jsonify({"error": "No data provided"}), 400
    existing = db.execute("SELECT * FROM purchase_orders WHERE id = ?", (po_id,)).fetchone()
    if existing is None:
        return jsonify({"error": "Purchase order not found"}), 404

    fields = ["number", "supplier_name", "value", "raised_date", "is_active", "notes"]
    updates = {f: data[f] for f in fields if f in data}
    if not updates:
        return jsonify({"error": "No valid fields to update"}), 400
    if "supplier_name" in updates:
        updates["supplier_name"] = register_supplier(db, updates["supplier_name"])

    set_clause = ", ".join(f"{k} = ?" for k in updates)
    set_clause += ", updated_at = datetime('now')"
    values = list(updates.values())
    values.append(po_id)

    db.execute(f"UPDATE purchase_orders SET {set_clause} WHERE id = ?", values)
    db.commit()
    row = db.execute("SELECT * FROM purchase_orders WHERE id = ?", (po_id,)).fetchone()
    return jsonify(dict(row))


@bp.route("/purchase-orders/<int:po_id>", methods=["DELETE"])
def delete_purchase_order(po_id):
    db = get_db()
    existing = db.execute("SELECT * FROM purchase_orders WHERE id = ?", (po_id,)).fetchone()
    if existing is None:
        return jsonify({"error": "Purchase order not found"}), 404
    db.execute("DELETE FROM purchase_orders WHERE id = ?", (po_id,))
    db.commit()
    return jsonify({"deleted": po_id})


@bp.route("/purchase-orders/<int:po_id>/work-orders", methods=["GET"])
def list_po_work_orders(po_id):
    db = get_db()
    rows = db.execute(
        """SELECT wo.* FROM work_orders wo
           JOIN po_assignments pa ON pa.work_order_id = wo.id
           WHERE pa.purchase_order_id = ?
           ORDER BY wo.number""",
        (po_id,),
    ).fetchall()
    return jsonify([dict(r) for r in rows])


@bp.route("/purchase-orders/<int:po_id>/work-orders", methods=["POST"])
def add_po_work_order(po_id):
    db = get_db()
    data = request.get_json()
    if not data or not data.get("work_order_id"):
        return jsonify({"error": "work_order_id is required"}), 400
    try:
        db.execute(
            "INSERT INTO po_assignments (purchase_order_id, work_order_id) VALUES (?, ?)",
            (po_id, data["work_order_id"]),
        )
        db.commit()
    except db.IntegrityError:
        return jsonify({"error": "Already linked"}), 409
    return jsonify({"purchase_order_id": po_id, "work_order_id": data["work_order_id"]}), 201


@bp.route("/purchase-orders/<int:po_id>/work-orders/<int:wo_id>", methods=["DELETE"])
def remove_po_work_order(po_id, wo_id):
    db = get_db()
    db.execute(
        "DELETE FROM po_assignments WHERE purchase_order_id = ? AND work_order_id = ?",
        (po_id, wo_id),
    )
    db.commit()
    return jsonify({"deleted": True})
