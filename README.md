# DCT-OS

**Daily cost tracking, done right.**

DCT-OS is a cost tracking platform built for civil engineering — project managers, site engineers, and contractors who need to track daily costs without fighting enterprise software. SQLite-backed, self-hostable, and ready to deploy.

## Features

- Project and cost code management
- Daily docket entry with resource rate lookups
- PDF-assisted manual entry (PDF viewer + form side-by-side)
- Project summary, cost code breakdown, and supplier spend reports
- Cost code budget tracking with burn-rate visuals
- Rate review at invoice time — confirm rates in the summary report and your resource rates stay current automatically
- Shared databases — open a `.db` file on a network drive, SharePoint, or OneDrive, and see who else has it open
- One-click backups, plus automatic rotating backups
- CSV and Excel export, CSV import
- REST API for all operations ([documented](docs/API.md))
- `pip install dct-os` — runs on Windows, macOS, and Linux

## Installation (Windows)

You only need to do this once. After that, DCT-OS starts automatically every time you turn on your computer.

### Option A: Let Claude do it

If you have [Claude Code](https://docs.anthropic.com/en/docs/claude-code) installed, open it and paste this:

```
Install DCT-OS for me. Run: pip install dct-os, then run: dct-os install.
If Python isn't installed, download and install it from python.org first
(make sure "Add Python to PATH" is ticked). After install, run: dct-os
to start it and open the browser.
```

Claude will handle the rest. Once it's done, bookmark [http://localhost:5000](http://localhost:5000) and you're set.

### Option B: Do it yourself

### Step 1: Install Python

1. Go to [python.org/downloads](https://www.python.org/downloads/)
2. Click the big yellow **Download Python** button
3. Run the installer
4. **Important:** Tick the box that says **"Add Python to PATH"** at the bottom of the first screen
5. Click **Install Now** and wait for it to finish

### Step 2: Install DCT-OS

1. Press the **Windows key**, type `cmd`, and press **Enter** to open a command prompt
2. Type the following and press **Enter**:

```
pip install dct-os
```

Wait for it to finish (you'll see some download progress, then it returns to the blinking cursor).

3. Type the following and press **Enter**:

```
dct-os install
```

You'll see a confirmation message. That's it. You're done with the command prompt and can close it.

### Step 3: Start DCT-OS

Type the following and press **Enter**:

```
dct-os
```

Your browser will open to DCT-OS with demo data loaded. Have a click around.

From now on, **DCT-OS starts automatically when you log in to Windows**. No command prompt needed. Just open your browser and go to:

**[http://localhost:5000](http://localhost:5000)**

> **Tip:** Bookmark that address. It's your DCT-OS.

### Updating

When a new version is available, a banner will appear at the top of DCT-OS. To update:

1. Open a command prompt (Windows key, type `cmd`, Enter)
2. Type:

```
pip install --upgrade dct-os
```

3. Close the command prompt. DCT-OS will use the new version next time it starts.

Your data is never touched during updates.

### Uninstalling

To stop DCT-OS from starting automatically (your data is kept):

```
dct-os uninstall
```

To fully remove:

```
pip uninstall dct-os
```

Your database stays in your user folder at `%LOCALAPPDATA%\DCT-OS\` unless you delete it manually.

---

## Installation (macOS / Linux)

```bash
pip install dct-os
dct-os
```

Your browser opens to [http://localhost:5000](http://localhost:5000). That's it.

Auto-start on login (`dct-os install`) is Windows-only for now — on Mac/Linux just run `dct-os` when you need it, or add it to your own startup mechanism.

---

## Sharing a database with your team

DCT-OS stores everything in a single `.db` file, and you can put that file anywhere — including a shared network drive, a SharePoint document library, or a synced OneDrive folder.

1. Click the **database indicator** in the header (the dot + filename next to the logo)
2. Browse to the shared folder and open the `.db` file — or create a new one there
3. Everyone on the team does the same. The indicator shows who else currently has the file open.

**The honest fine print:** SQLite (the database engine inside DCT-OS) is designed for one writer at a time. Two people *reading* is fine. Two people *entering dockets at the same moment* can collide — DCT-OS warns you with a banner when someone else has the file open, so coordinate who's entering data. For genuinely concurrent multi-user entry, a shared file isn't the right tool — that's what client-server databases are for.

Also note: sync services (OneDrive/SharePoint) sync the file *between edits*, not live. Best practice is one person entering at a time, and let the file sync before the next person starts.

---

## Quick Start (for developers)

```bash
pip install dct-os
dct-os
```

Your browser opens automatically to [http://localhost:5000](http://localhost:5000). Demo data loads on first run.

API reference: [docs/API.md](docs/API.md)

### Auto-start on Windows

```bash
dct-os install     # creates a silent startup entry
dct-os uninstall   # removes it (keeps your data)
```

### Install from source

```bash
git clone https://github.com/h3ylis/dct-os.git
cd dct-os
pip install -e .
dct-os
```

### Options

| Environment variable | Default | Description |
|---|---|---|
| `DCT_PORT` | `5000` | Server port |
| `DCT_HOST` | `127.0.0.1` | Bind address |
| `DCT_DATA_DIR` | `.` (current dir) | Where to store the database |
| `DCT_NO_SEED` | unset | Set to `1` to start with an empty database |

### Optional: remote log reporting (self-hosted)

If you run several DCT-OS instances (site laptops, office PCs) you can have
them report health and errors to a log collector **that you operate** — there
is no built-in destination and DCT-OS sends nothing anywhere by default.

| Environment variable | Default | Description |
|---|---|---|
| `DCT_OS_LOG_URL` | unset (feature off) | Base URL of your collector |
| `DCT_OS_LOG_KEY` | unset | Optional API key (`X-ABLog-Key` header) |
| `DCT_OS_LOG_APP` | `dct-os` | Name this instance reports as |
| `DCT_OS_LOG_INTERVAL` | `300` | Heartbeat seconds (`0` = no heartbeat) |

When enabled, DCT-OS POSTs JSON to `{url}/api/v2/log` (startup, unhandled
errors with traceback, upgrade results) and `{url}/api/v2/heartbeat`
(liveness). The schema is in `dct_os/log_webhook.py` — a few lines of Flask
or any webhook receiver can accept it. Reporting is fire-and-forget and never
affects the app if the collector is down.

## Licence and Use

DCT-OS is released under the [Business Source License 1.1](LICENSE).

**What this means:**

- **Free for internal use** — engineers, contractors, and organisations running it for their own cost tracking. Modify it, deploy it internally, use it on every project. No cost, no limits, no phone-home.
- **Commercial licence required** for hosted or embedded use — if you're offering DCT-OS to third parties as a service, bundling it into a product you sell, or reselling it, you need a commercial licence.
- **Converts to Apache 2.0** after four years per release — every version eventually becomes fully open under the Apache Licence.

See [LICENSING.md](LICENSING.md) for the full breakdown of what's free and what needs a commercial licence.

For commercial licensing enquiries: **astral2@gmx.de**

## Contributing

We welcome contributions. A Contributor Licence Agreement (CLA) is being configured — please open an issue for discussion before submitting pull requests.

See [CONTRIBUTING.md](CONTRIBUTING.md) for details.

## Contact

- Commercial licensing: astral2@gmx.de
- Bug reports and feature requests: [GitHub Issues](../../issues)
