from flask import Blueprint, jsonify, request

from dct_os.db import get_db

bp = Blueprint("work_orders", __name__)


@bp.route("/projects/<int:project_id>/work-orders", methods=["GET"])
def list_work_orders(project_id):
    db = get_db()
    rows = db.execute(
        "SELECT * FROM work_orders WHERE project_id = ? ORDER BY number",
        (project_id,),
    ).fetchall()
    return jsonify([dict(r) for r in rows])


@bp.route("/work-orders/<int:wo_id>", methods=["GET"])
def get_work_order(wo_id):
    db = get_db()
    row = db.execute("SELECT * FROM work_orders WHERE id = ?", (wo_id,)).fetchone()
    if row is None:
        return jsonify({"error": "Work order not found"}), 404
    return jsonify(dict(row))


@bp.route("/projects/<int:project_id>/work-orders", methods=["POST"])
def create_work_order(project_id):
    db = get_db()
    data = request.get_json()
    if not data or not data.get("number"):
        return jsonify({"error": "number is required"}), 400
    cur = db.execute(
        """INSERT INTO work_orders (project_id, number, description, status)
           VALUES (?, ?, ?, ?)""",
        (
            project_id,
            data["number"],
            data.get("description"),
            data.get("status", "Active"),
        ),
    )
    db.commit()
    row = db.execute("SELECT * FROM work_orders WHERE id = ?", (cur.lastrowid,)).fetchone()
    return jsonify(dict(row)), 201


@bp.route("/work-orders/<int:wo_id>", methods=["PUT"])
def update_work_order(wo_id):
    db = get_db()
    data = request.get_json()
    if not data:
        return jsonify({"error": "No data provided"}), 400
    existing = db.execute("SELECT * FROM work_orders WHERE id = ?", (wo_id,)).fetchone()
    if existing is None:
        return jsonify({"error": "Work order not found"}), 404

    fields = ["number", "description", "status"]
    updates = {f: data[f] for f in fields if f in data}
    if not updates:
        return jsonify({"error": "No valid fields to update"}), 400

    set_clause = ", ".join(f"{k} = ?" for k in updates)
    set_clause += ", updated_at = datetime('now')"
    values = list(updates.values())
    values.append(wo_id)

    db.execute(f"UPDATE work_orders SET {set_clause} WHERE id = ?", values)
    db.commit()
    row = db.execute("SELECT * FROM work_orders WHERE id = ?", (wo_id,)).fetchone()
    return jsonify(dict(row))


@bp.route("/work-orders/<int:wo_id>", methods=["DELETE"])
def delete_work_order(wo_id):
    db = get_db()
    existing = db.execute("SELECT * FROM work_orders WHERE id = ?", (wo_id,)).fetchone()
    if existing is None:
        return jsonify({"error": "Work order not found"}), 404
    db.execute("DELETE FROM work_orders WHERE id = ?", (wo_id,))
    db.commit()
    return jsonify({"deleted": wo_id})


@bp.route("/work-orders/<int:wo_id>/cost-codes", methods=["GET"])
def list_wo_cost_codes(wo_id):
    db = get_db()
    rows = db.execute(
        """SELECT cc.* FROM cost_codes cc
           JOIN wo_cost_codes wcc ON wcc.cost_code_id = cc.id
           WHERE wcc.work_order_id = ?
           ORDER BY cc.code""",
        (wo_id,),
    ).fetchall()
    return jsonify([dict(r) for r in rows])


@bp.route("/work-orders/<int:wo_id>/cost-codes", methods=["POST"])
def add_wo_cost_code(wo_id):
    db = get_db()
    data = request.get_json()
    if not data or not data.get("cost_code_id"):
        return jsonify({"error": "cost_code_id is required"}), 400
    try:
        db.execute(
            "INSERT INTO wo_cost_codes (work_order_id, cost_code_id) VALUES (?, ?)",
            (wo_id, data["cost_code_id"]),
        )
        db.commit()
    except db.IntegrityError:
        return jsonify({"error": "Already linked"}), 409
    return jsonify({"work_order_id": wo_id, "cost_code_id": data["cost_code_id"]}), 201


@bp.route("/work-orders/<int:wo_id>/cost-codes/<int:cc_id>", methods=["DELETE"])
def remove_wo_cost_code(wo_id, cc_id):
    db = get_db()
    db.execute(
        "DELETE FROM wo_cost_codes WHERE work_order_id = ? AND cost_code_id = ?",
        (wo_id, cc_id),
    )
    db.commit()
    return jsonify({"deleted": True})
