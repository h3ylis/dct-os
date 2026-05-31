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
# Clone and install
git clone https://github.com/h3ylis/dct-os.git
cd dct-os
pip install -e .

# Run
flask --app dct_os.app run --port 5000
```

Open [http://localhost:5000](http://localhost:5000) — demo data loads automatically on first run.

Set `DCT_NO_SEED=1` to start with a completely empty database.

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
