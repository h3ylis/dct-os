# Security Policy

## Reporting a vulnerability

If you find a security issue in DCT-OS, please report it privately — don't open a public issue.

- **Preferred:** [GitHub private vulnerability reporting](../../security/advisories/new) — click "Report a vulnerability"
- **Email:** astral2@gmx.de

You'll get an acknowledgement within a few days. Fixes for confirmed issues are released as soon as practical, and reporters are credited in the release notes unless they prefer otherwise.

## Supported versions

Only the latest release receives security fixes. Run `dct-os upgrade` to stay current — the in-app banner tells you when a new version is available.

## Scope and threat model

DCT-OS is a local, single-user application by design:

- The server binds to `127.0.0.1` (localhost) by default and has **no authentication**. It is not designed to be exposed to the internet, and doing so is outside the supported threat model.
- Your data stays in a local SQLite file. DCT-OS makes **no network calls** except: checking PyPI for a newer version, and (only when you run `dct-os upgrade`) anonymous usage counts. Optional self-hosted log reporting is inert unless you configure `DCT_OS_LOG_URL` yourself.
- Shared-database mode places the `.db` file on storage you control (network drive, SharePoint, OneDrive). Access control for that file is your file-system's job — DCT-OS adds awareness (who has it open), not authorisation.

Reports about hardening within this model (XSS, SQL injection, path traversal in the file browser, etc.) are very welcome.
