from flask import Blueprint, jsonify, request

from dct_os.db import get_db

bp = Blueprint("cost_codes", __name__)


@bp.route("/projects/<int:project_id>/cost-codes", methods=["GET"])
def list_cost_codes(project_id):
    db = get_db()
    rows = db.execute(
        "SELECT * FROM cost_codes WHERE project_id = ? ORDER BY code",
        (project_id,),
    ).fetchall()
    return jsonify([dict(r) for r in rows])


@bp.route("/cost-codes/<int:cc_id>", methods=["GET"])
def get_cost_code(cc_id):
    db = get_db()
    row = db.execute("SELECT * FROM cost_codes WHERE id = ?", (cc_id,)).fetchone()
    if row is None:
        return jsonify({"error": "Cost code not found"}), 404
    return jsonify(dict(row))


@bp.route("/projects/<int:project_id>/cost-codes", methods=["POST"])
def create_cost_code(project_id):
    db = get_db()
    data = request.get_json()
    if not data or not data.get("code"):
        return jsonify({"error": "code is required"}), 400
    cur = db.execute(
        """INSERT INTO cost_codes (project_id, code, description, budget_amount, parent_id)
           VALUES (?, ?, ?, ?, ?)""",
        (
            project_id,
            data["code"],
            data.get("description"),
            data.get("budget_amount", 0),
            data.get("parent_id"),
        ),
    )
    db.commit()
    row = db.execute("SELECT * FROM cost_codes WHERE id = ?", (cur.lastrowid,)).fetchone()
    return jsonify(dict(row)), 201


@bp.route("/cost-codes/<int:cc_id>", methods=["PUT"])
def update_cost_code(cc_id):
    db = get_db()
    data = request.get_json()
    if not data:
        return jsonify({"error": "No data provided"}), 400
    existing = db.execute("SELECT * FROM cost_codes WHERE id = ?", (cc_id,)).fetchone()
    if existing is None:
        return jsonify({"error": "Cost code not found"}), 404

    fields = ["code", "description", "budget_amount", "parent_id"]
    updates = {f: data[f] for f in fields if f in data}
    if not updates:
        return jsonify({"error": "No valid fields to update"}), 400

    set_clause = ", ".join(f"{k} = ?" for k in updates)
    set_clause += ", updated_at = datetime('now')"
    values = list(updates.values())
    values.append(cc_id)

    db.execute(f"UPDATE cost_codes SET {set_clause} WHERE id = ?", values)
    db.commit()
    row = db.execute("SELECT * FROM cost_codes WHERE id = ?", (cc_id,)).fetchone()
    return jsonify(dict(row))


@bp.route("/cost-codes/<int:cc_id>", methods=["DELETE"])
def delete_cost_code(cc_id):
    db = get_db()
    existing = db.execute("SELECT * FROM cost_codes WHERE id = ?", (cc_id,)).fetchone()
    if existing is None:
        return jsonify({"error": "Cost code not found"}), 404
    db.execute("DELETE FROM cost_codes WHERE id = ?", (cc_id,))
    db.commit()
    return jsonify({"deleted": cc_id})
