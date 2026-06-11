"""Optional remote log reporting for DCT-OS.

Completely inert unless the operator sets DCT_OS_LOG_URL. When enabled,
DCT-OS reports to a log collector you run yourself:

  - a startup event and a periodic liveness heartbeat
  - unhandled request exceptions (with traceback)
  - upgrade results (the same data written to logs/upgrades.jsonl)

Nothing is ever sent anywhere by default, and there is no built-in
destination — this is a self-hosting feature, not telemetry for the
DCT-OS project.

Configuration (environment variables):
  DCT_OS_LOG_URL       Base URL of your collector, e.g. http://127.0.0.1:5388
  DCT_OS_LOG_KEY       Optional API key, sent as the X-ABLog-Key header
  DCT_OS_LOG_APP       App name to report as (default: "dct-os")
  DCT_OS_LOG_INTERVAL  Heartbeat seconds (default 300; 0 disables heartbeat)

Wire format (POST, JSON) — compatible with ABLog2 and trivial to receive
with anything else:
  {base}/api/v2/log        {"app", "component", "level", "message", "traceback"}
  {base}/api/v2/heartbeat  {"app", "component", "status"}

All sends are fire-and-forget on daemon threads with short timeouts and
swallow every error: log reporting must never affect the app.
"""

import json
import os
import threading
import traceback as tb_module
import urllib.request

from dct_os import __version__


def _base_url():
    return (os.environ.get("DCT_OS_LOG_URL") or "").strip().rstrip("/")


def enabled():
    return bool(_base_url())


def _app_name():
    return os.environ.get("DCT_OS_LOG_APP", "dct-os")


def _post_async(path, payload):
    if not enabled():
        return

    def _send():
        try:
            headers = {"Content-Type": "application/json"}
            key = os.environ.get("DCT_OS_LOG_KEY")
            if key:
                headers["X-ABLog-Key"] = key
            req = urllib.request.Request(
                _base_url() + path,
                data=json.dumps(payload).encode("utf-8"),
                headers=headers,
                method="POST",
            )
            with urllib.request.urlopen(req, timeout=4):
                pass
        except Exception:
            pass  # never let log reporting affect the app

    threading.Thread(target=_send, daemon=True).start()


def log_event(level, message, traceback_text=None, component="server"):
    _post_async("/api/v2/log", {
        "app": _app_name(),
        "component": component,
        "level": level,
        "message": str(message)[:2000],
        "traceback": traceback_text,
    })


def ship_upgrade(stats, to_version):
    log_event("info", f"Upgraded DCT-OS to v{to_version}",
              component="upgrade")


def _heartbeat_loop(interval):
    import time
    while True:
        # No expected-interval hint: DCT-OS is often run interactively, so a
        # closed app should just go stale on the collector, not raise alarms.
        _post_async("/api/v2/heartbeat", {
            "app": _app_name(),
            "component": "main",
            "status": "up",
        })
        time.sleep(interval)


def init_app(app):
    """Attach reporting to a Flask app. No-op when DCT_OS_LOG_URL is unset."""
    if not enabled():
        return

    @app.teardown_request
    def _report_unhandled(exc):
        if exc is not None:
            log_event(
                "error",
                f"Unhandled error: {exc}",
                traceback_text="".join(tb_module.format_exception(
                    type(exc), exc, exc.__traceback__))[-4000:],
            )

    log_event("info", f"DCT-OS v{__version__} started", component="lifecycle")

    interval = int(os.environ.get("DCT_OS_LOG_INTERVAL", "300") or 0)
    if interval > 0:
        threading.Thread(
            target=_heartbeat_loop, args=(interval,),
            name="dct-os-log-heartbeat", daemon=True,
        ).start()
