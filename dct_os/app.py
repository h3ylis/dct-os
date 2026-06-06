import os
import sys
import time
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

    cache_bust = str(int(time.time()))

    @app.context_processor
    def inject_globals():
        return {"version": __version__, "v": cache_bust}

    @app.route("/")
    def index():
        return render_template("index.html")

    return app


# ---------------------------------------------------------------------------
# Windows auto-start (install / uninstall)
# ---------------------------------------------------------------------------

def _get_app_dir():
    """Return the DCT-OS application data directory."""
    base = Path(os.environ.get("LOCALAPPDATA", Path.home() / "AppData" / "Local"))
    d = base / "DCT-OS"
    d.mkdir(parents=True, exist_ok=True)
    return d


def _get_startup_dir():
    """Return the Windows Startup folder for the current user."""
    appdata = os.environ.get("APPDATA", "")
    if appdata:
        return Path(appdata) / "Microsoft" / "Windows" / "Start Menu" / "Programs" / "Startup"
    return Path.home() / "AppData" / "Roaming" / "Microsoft" / "Windows" / "Start Menu" / "Programs" / "Startup"


def _find_dct_exe():
    """Find the dct-os.exe console script installed by pip."""
    # The console_scripts entry creates dct-os.exe next to python.exe
    python_dir = Path(sys.executable).parent
    for name in ("dct-os.exe", "dct-os"):
        candidate = python_dir / "Scripts" / name
        if candidate.exists():
            return candidate
        candidate = python_dir / name
        if candidate.exists():
            return candidate
    return None


def do_install():
    """Create a silent auto-start entry so DCT-OS launches on Windows login."""
    if sys.platform != "win32":
        print("Auto-start install is only supported on Windows.")
        return

    app_dir = _get_app_dir()
    startup_dir = _get_startup_dir()

    # Determine what command to run
    exe = _find_dct_exe()
    if exe:
        run_cmd = f'"{exe}"'
    else:
        # Fallback: use the Python interpreter directly
        run_cmd = f'"{sys.executable}" -m dct_os'

    # Write a VBS launcher that hides the console window
    vbs_path = app_dir / "dct-os-launcher.vbs"
    vbs_content = (
        f'Set WshShell = CreateObject("WScript.Shell")\r\n'
        f'WshShell.CurrentDirectory = "{app_dir}"\r\n'
        f'WshShell.Run {run_cmd}, 0, False\r\n'
    )
    vbs_path.write_text(vbs_content, encoding="utf-8")

    # Create a shortcut in the Startup folder
    lnk_path = startup_dir / "DCT-OS.lnk"
    # Use PowerShell to create the .lnk (no external deps needed)
    ps_script = (
        f'$ws = New-Object -ComObject WScript.Shell; '
        f'$sc = $ws.CreateShortcut("{lnk_path}"); '
        f'$sc.TargetPath = "wscript.exe"; '
        f'$sc.Arguments = """{vbs_path}"""; '
        f'$sc.WorkingDirectory = "{app_dir}"; '
        f'$sc.Description = "DCT-OS Daily Cost Tracker"; '
        f'$sc.Save()'
    )
    os.system(f'powershell -NoProfile -Command "{ps_script}"')

    # Also set DCT_DATA_DIR in the VBS so the database lives in app_dir
    db_path = app_dir / "dct_os.db"

    # Rewrite VBS with the env var set
    vbs_content = (
        f'Set WshShell = CreateObject("WScript.Shell")\r\n'
        f'Set env = WshShell.Environment("Process")\r\n'
        f'env("DCT_DATA_DIR") = "{app_dir}"\r\n'
        f'WshShell.CurrentDirectory = "{app_dir}"\r\n'
        f'WshShell.Run {run_cmd}, 0, False\r\n'
    )
    vbs_path.write_text(vbs_content, encoding="utf-8")

    print(f"DCT-OS v{__version__} installed for auto-start.")
    print(f"  Data folder: {app_dir}")
    print(f"  Database:    {db_path}")
    print(f"  Startup:     {lnk_path}")
    print()
    print("DCT-OS will start automatically when you log in to Windows.")
    print("To start it now, just run: dct-os")
    print("To remove auto-start, run: dct-os uninstall")


def do_uninstall():
    """Remove the auto-start entry. Does not delete the database."""
    if sys.platform != "win32":
        print("Auto-start uninstall is only supported on Windows.")
        return

    app_dir = _get_app_dir()
    startup_dir = _get_startup_dir()

    removed = []

    lnk_path = startup_dir / "DCT-OS.lnk"
    if lnk_path.exists():
        lnk_path.unlink()
        removed.append(str(lnk_path))

    vbs_path = app_dir / "dct-os-launcher.vbs"
    if vbs_path.exists():
        vbs_path.unlink()
        removed.append(str(vbs_path))

    if removed:
        print("DCT-OS auto-start removed.")
        for f in removed:
            print(f"  Removed: {f}")
    else:
        print("No auto-start entry found. Nothing to remove.")

    print()
    print("Your database has NOT been deleted.")
    print(f"  Data folder: {app_dir}")


# ---------------------------------------------------------------------------
# CLI entry point
# ---------------------------------------------------------------------------

def main():
    # Handle subcommands before starting the server
    if len(sys.argv) > 1:
        cmd = sys.argv[1].lower()
        if cmd == "install":
            do_install()
            return
        elif cmd == "uninstall":
            do_uninstall()
            return

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
