# Security Policy

## Reporting a vulnerability

If you find a security issue in DCT-OS, please report it privately — don't open a public issue.

- **Preferred:** [GitHub private vulnerability reporting](../../security/advisories/new) — click "Report a vulnerability"
- **Email:** hello@dct-os.com

You'll get an acknowledgement within a few days. Fixes for confirmed issues are released as soon as practical, and reporters are credited in the release notes unless they prefer otherwise.

## Supported versions

Only the latest release receives security fixes. Run `dct-os upgrade` to stay current — the in-app banner tells you when a new version is available.

## Scope and threat model

DCT-OS is a local, single-user application by design:

- The server binds to `127.0.0.1` (localhost) by default and has **no authentication**. It is not designed to be exposed to the internet, and doing so is outside the supported threat model.
- Your data stays in a local SQLite file. The only network call DCT-OS makes is checking PyPI for a newer version — it fetches the latest version number and sends nothing about you or your data. The anonymous usage counts gathered when you run `dct-os upgrade` are written to a **local** log file (`logs/upgrades.jsonl`) and never leave your machine — they're only sent anywhere if you opt in to self-hosted log reporting by setting `DCT_OS_LOG_URL` to an endpoint you control.
- Shared-database mode places the `.db` file on storage you control (network drive, SharePoint, OneDrive). Access control for that file is your file-system's job — DCT-OS adds awareness (who has it open), not authorisation.

Reports about hardening within this model (XSS, SQL injection, path traversal in the file browser, etc.) are very welcome.
