import os
import sys
import webbrowser
from pathlib import Path

from flask import Flask, render_template

from dct_os import __version__
from dct_os import db as database
from dct_os.api import api


def create_app(test_config=None):
    app = Flask(
        __name__,
        instance_relative_config=True,
        template_folder="templates",
        static_folder="static",
    )

    if test_config is None:
        data_dir = Path(os.environ.get("DCT_DATA_DIR", "."))
        db_path = data_dir / "dct_os.db"
        app.config["DATABASE"] = str(db_path)
    else:
        app.config.update(test_config)

    os.makedirs(app.instance_path, exist_ok=True)

    app.register_blueprint(api)
    database.init_app(app)

    @app.route("/")
    def index():
        return render_template("index.html", version=__version__)

    return app


def main():
    host = os.environ.get("DCT_HOST", "127.0.0.1")
    port = int(os.environ.get("DCT_PORT", "5000"))
    debug = os.environ.get("DCT_DEBUG", "").lower() in ("1", "true", "yes")

    app = create_app()

    if not debug and "--no-browser" not in sys.argv:
        webbrowser.open(f"http://{host}:{port}")

    print(f"DCT-OS v{__version__} running at http://{host}:{port}")
    app.run(host=host, port=port, debug=debug)


if __name__ == "__main__":
    main()
