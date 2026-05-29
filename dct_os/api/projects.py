from flask import Blueprint, jsonify, request

from dct_os.db import get_db

bp = Blueprint("projects", __name__)


@bp.route("/projects", methods=["GET"])
def list_projects():
    db = get_db()
    status = request.args.get("status", "Active")
    if status == "All":
        rows = db.execute(
            "SELECT * FROM projects ORDER BY name"
        ).fetchall()
    else:
        rows = db.execute(
            "SELECT * FROM projects WHERE status = ? ORDER BY name",
            (status,),
        ).fetchall()
    return jsonify([dict(r) for r in rows])


@bp.route("/projects/<int:project_id>", methods=["GET"])
def get_project(project_id):
    db = get_db()
    row = db.execute("SELECT * FROM projects WHERE id = ?", (project_id,)).fetchone()
    if row is None:
        return jsonify({"error": "Project not found"}), 404
    return jsonify(dict(row))


@bp.route("/projects", methods=["POST"])
def create_project():
    db = get_db()
    data = request.get_json()
    if not data or not data.get("name"):
        return jsonify({"error": "name is required"}), 400
    cur = db.execute(
        """INSERT INTO projects (name, code, client, start_date, end_date, status)
           VALUES (?, ?, ?, ?, ?, ?)""",
        (
            data["name"],
            data.get("code"),
            data.get("client"),
            data.get("start_date"),
            data.get("end_date"),
            data.get("status", "Active"),
        ),
    )
    db.commit()
    row = db.execute("SELECT * FROM projects WHERE id = ?", (cur.lastrowid,)).fetchone()
    return jsonify(dict(row)), 201


@bp.route("/projects/<int:project_id>", methods=["PUT"])
def update_project(project_id):
    db = get_db()
    data = request.get_json()
    if not data:
        return jsonify({"error": "No data provided"}), 400
    existing = db.execute("SELECT * FROM projects WHERE id = ?", (project_id,)).fetchone()
    if existing is None:
        return jsonify({"error": "Project not found"}), 404

    fields = ["name", "code", "client", "start_date", "end_date", "status"]
    updates = {f: data[f] for f in fields if f in data}
    if not updates:
        return jsonify({"error": "No valid fields to update"}), 400

    updates["updated_at"] = "datetime('now')"
    set_clause = ", ".join(f"{k} = ?" for k in updates if k != "updated_at")
    set_clause += ", updated_at = datetime('now')"
    values = [v for k, v in updates.items() if k != "updated_at"]
    values.append(project_id)

    db.execute(f"UPDATE projects SET {set_clause} WHERE id = ?", values)
    db.commit()
    row = db.execute("SELECT * FROM projects WHERE id = ?", (project_id,)).fetchone()
    return jsonify(dict(row))


@bp.route("/projects/<int:project_id>", methods=["DELETE"])
def delete_project(project_id):
    db = get_db()
    existing = db.execute("SELECT * FROM projects WHERE id = ?", (project_id,)).fetchone()
    if existing is None:
        return jsonify({"error": "Project not found"}), 404
    db.execute("DELETE FROM projects WHERE id = ?", (project_id,))
    db.commit()
    return jsonify({"deleted": project_id})
