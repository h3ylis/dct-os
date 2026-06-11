from pathlib import Path

from flask import Blueprint, jsonify, request, current_app

from .projects import bp as projects_bp
from .cost_codes import bp as cost_codes_bp
from .resources import bp as resources_bp
from .dockets import bp as dockets_bp
from .work_orders import bp as work_orders_bp
from .purchase_orders import bp as purchase_orders_bp

api = Blueprint("api", __name__, url_prefix="/api")

api.register_blueprint(projects_bp)
api.register_blueprint(cost_codes_bp)
api.register_blueprint(resources_bp)
api.register_blueprint(dockets_bp)
api.register_blueprint(work_orders_bp)
api.register_blueprint(purchase_orders_bp)


@api.route("/version", methods=["GET"])
def version_info():
    from dct_os import __version__
    from dct_os.db import get_update_info
    info = {"version": __version__}
    update = get_update_info()
    if update:
        info["update_available"] = update["latest"]
    return jsonify(info)


# ---------------------------------------------------------------------------
# Database management endpoints
# ---------------------------------------------------------------------------

@api.route("/database", methods=["GET"])
def database_info():
    """Return current database path, lock status, and recent list."""
    from dct_os.database_manager import load_config, check_lock

    db_path = current_app.config["DATABASE"]
    lock = check_lock(db_path)
    config = load_config()

    return jsonify({
        "current": db_path,
        "current_name": Path(db_path).name,
        "current_dir": str(Path(db_path).parent),
        "locked_by": lock,
        "recent": config.get("recent_databases", []),
    })


@api.route("/database/switch", methods=["POST"])
def database_switch():
    """Switch to a different database file."""
    from dct_os.database_manager import (
        check_lock, acquire_lock, release_lock, add_recent, rotate_backup,
    )
    from dct_os.db import close_db, init_db_for_path

    data = request.get_json(force=True)
    new_path = data.get("path", "").strip()
    if not new_path:
        return jsonify({"error": "No path provided"}), 400

    new_path = str(Path(new_path).resolve())

    if not Path(new_path).exists():
        return jsonify({"error": "Database file not found"}), 404

    # Check lock on the new database
    lock = check_lock(new_path)

    # Release lock on old database
    old_path = current_app.config["DATABASE"]
    release_lock(old_path)

    # Close existing connection
    close_db()

    # Switch
    current_app.config["DATABASE"] = new_path
    init_db_for_path(current_app, new_path)
    acquire_lock(new_path)
    add_recent(new_path)
    rotate_backup(new_path)

    return jsonify({
        "switched": True,
        "path": new_path,
        "locked_by": lock,
    })


@api.route("/database/create", methods=["POST"])
def database_create():
    """Create a new database at the specified directory."""
    from dct_os.database_manager import acquire_lock, release_lock, add_recent
    from dct_os.db import close_db, init_db_for_path

    data = request.get_json(force=True)
    directory = data.get("directory", "").strip()
    filename = data.get("filename", "dct_os.db").strip()

    if not directory:
        return jsonify({"error": "No directory provided"}), 400

    if not filename.endswith(".db"):
        filename += ".db"

    dir_path = Path(directory)
    if not dir_path.is_dir():
        return jsonify({"error": "Directory does not exist"}), 404

    new_path = str((dir_path / filename).resolve())

    if Path(new_path).exists():
        return jsonify({"error": "Database already exists at that location"}), 409

    # Release old lock, close old connection
    old_path = current_app.config["DATABASE"]
    release_lock(old_path)
    close_db()

    # Switch to new path (empty — no seed data for user-created databases)
    current_app.config["DATABASE"] = new_path
    init_db_for_path(current_app, new_path, seed=False)
    acquire_lock(new_path)
    add_recent(new_path)

    return jsonify({
        "created": True,
        "path": new_path,
    }), 201


@api.route("/backup", methods=["GET"])
def backup_download():
    """Download a consistent snapshot of the current database."""
    import sqlite3
    import tempfile
    from datetime import datetime
    from flask import send_file

    db_path = current_app.config["DATABASE"]
    if not Path(db_path).exists():
        return jsonify({"error": "Database file not found"}), 404

    tmp = tempfile.NamedTemporaryFile(suffix=".db", delete=False)
    tmp.close()
    try:
        src = sqlite3.connect(db_path)
        dst = sqlite3.connect(tmp.name)
        with dst:
            src.backup(dst)
        dst.close()
        src.close()
    except Exception as e:
        return jsonify({"error": f"Backup failed: {e}"}), 500

    stamp = datetime.now().strftime("%Y-%m-%d")
    download_name = f"{Path(db_path).stem}-backup-{stamp}.db"
    return send_file(
        tmp.name,
        as_attachment=True,
        download_name=download_name,
        mimetype="application/octet-stream",
    )


@api.route("/browse", methods=["GET"])
def browse_files():
    """Browse the filesystem for directories and .db files."""
    from dct_os.database_manager import browse_directory

    path = request.args.get("path")
    result = browse_directory(path)

    if "error" in result:
        return jsonify(result), 400

    return jsonify(result)
