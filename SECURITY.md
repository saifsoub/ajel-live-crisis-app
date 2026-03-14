# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 0.x     | :white_check_mark: |

## Reporting a Vulnerability

If you discover a security vulnerability in AJEL Live Crisis App, please **do not** open a public GitHub issue.

Instead, please report it privately by emailing the maintainers or using [GitHub's private vulnerability reporting](https://docs.github.com/en/code-security/security-advisories/guidance-on-reporting-and-writing/privately-reporting-a-security-vulnerability).

We will acknowledge your report within **48 hours** and provide an estimated timeline for a fix.

## Security Considerations

### Authentication
- Passwords are compared using environment variables. Use a strong, unique `AJEL_ADMIN_PASSWORD`.
- Session tokens are HMAC-SHA256 signed. Use a long, random `AJEL_SESSION_SECRET` (32+ characters).
- Session cookies are `httpOnly`, `sameSite: lax`, and `secure` in production.

### Secrets Management
- **Never** commit `.env.local` or any file containing real credentials to version control.
- Use the provided `scripts/generate-env.js` script to auto-generate a `.env.local` with cryptographically random secrets.
- Rotate `AJEL_SESSION_SECRET` if you suspect compromise (this will invalidate all active sessions).

### API Keys
- `OPENAI_API_KEY` and `NEWS_API_KEY` are optional but should be kept confidential.
- Restrict API key permissions to only what is needed.

### Rate Limiting
- The `/api/auth/login` endpoint is rate-limited to prevent brute-force attacks.
- For production deployments with multiple instances, replace the in-memory rate limiter with a distributed store (e.g., Redis / Upstash).

### Dependencies
- Run `npm audit` regularly to check for known vulnerabilities.
- Keep dependencies up to date.

### Database
- The SQLite database (`data/ajel.sqlite`) is stored locally. Ensure the `data/` directory is not publicly accessible.
- For multi-user / cloud deployments, migrate to PostgreSQL with proper access controls.

## Responsible Disclosure

We follow the principle of [Coordinated Vulnerability Disclosure](https://vuls.cert.org/confluence/display/CVD/Executive+Summary). After a fix is deployed, we will credit the reporter (unless they prefer anonymity) in the release notes.
