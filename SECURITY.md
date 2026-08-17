# Security Policy

## Reporting a Vulnerability

We take the security of **Ekos Green Group Project Tracker** seriously. If you believe you have discovered a security vulnerability in this project, please report it to us responsibly instead of opening a public issue.

### How to Report

Please report security issues via:
- **Email**: Send details to the project administrator or maintainers.
- **Private Vulnerability Reporting**: If enabled on GitHub, submit a report via the **Security** tab -> **Report a vulnerability**.

### Information to Include

Please provide:
- A description of the issue and its potential impact.
- Detailed step-by-step instructions (or a proof-of-concept script) to reproduce the vulnerability.
- Any suggested mitigations or patches if available.

### Disclosure Policy

- We will acknowledge receipt of your vulnerability report promptly.
- Please do not disclose the vulnerability publicly until we have had an opportunity to address and resolve it.

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| Main    | :white_check_mark: |

## Security Best Practices

- **No Hardcoded Secrets**: Ensure credentials, API keys, and sensitive tokens are supplied via environment variables (`.env` ignored in Git).
- **Automated Audits**: Dependencies are continuously audited using `npm audit` and GitHub Dependabot updates.
- **Branch Protection**: Direct pushes to `main` should be restricted with Pull Request reviews enabled.
