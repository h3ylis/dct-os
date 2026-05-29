from flask import Blueprint, jsonify, request

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
        """INSERT INTO resources (description, unit, supplier_name, standard_rate, category)
           VALUES (?, ?, ?, ?, ?)""",
        (
            data["description"],
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

    fields = ["description", "unit", "supplier_name", "standard_rate", "category"]
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
