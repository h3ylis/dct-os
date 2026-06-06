# DCT-OS

**Daily cost tracking, done right.**

DCT-OS is a cost tracking platform built for civil engineering — project managers, site engineers, and contractors who need to track daily costs without fighting enterprise software. SQLite-backed, self-hostable, and ready to deploy.

## Features

- Project and cost code management
- Daily docket entry with resource rate lookups
- PDF-assisted manual entry (PDF viewer + form side-by-side)
- Project summary, cost code breakdown, and supplier spend reports
- CSV and Excel export
- REST API for all operations
- Single binary or `pip install` — runs anywhere

## Quick Start

```bash
pip install dct-os
dct-os
```

Your browser opens automatically to [http://localhost:5000](http://localhost:5000). Demo data loads on first run.

### Auto-start on Windows

Run once after installing:

```bash
dct-os install
```

DCT-OS will start silently when you log in to Windows and your browser will open to the app. Your database is stored in `%LOCALAPPDATA%\DCT-OS\`.

To remove auto-start (keeps your data):

```bash
dct-os uninstall
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
