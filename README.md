# عاجل / AJEL V2

[![CI](https://github.com/saifsoub/ajel-live-crisis-app/actions/workflows/azure-webapps-node.yml/badge.svg)](https://github.com/saifsoub/ajel-live-crisis-app/actions/workflows/azure-webapps-node.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

AJEL V2 is a production-oriented Next.js dashboard for monitoring what is happening right now in the Middle East.

> **Live demo:** _coming soon — deploy your own instance in seconds with Docker Compose (see below)._

## V2 upgrades
- secure login with signed session cookie
- live multi-source ingestion (GDELT + ReliefWeb + optional NewsAPI)
- optional AI-generated insights and executive summary via OpenAI
- SQLite persistence using Node's built-in `node:sqlite`
- saved watchlists
- analyst bookmarks with notes
- automatic historical snapshots every few minutes
- dark executive dashboard UI
- rate-limiting on the login endpoint (brute-force protection)
- React error boundary for graceful client-side error handling

## Stack
- Next.js 15 App Router
- React 19
- TypeScript
- `node:sqlite` for local persistent database (requires Node.js ≥ 22)
- OpenAI SDK for AI synthesis
- Vitest for unit tests

## Run locally
```bash
npm install
node scripts/generate-env.js   # auto-generates .env.local with secure random secrets
npm run dev
```

The `generate-env.js` script reads `.env.example` and writes `.env.local` with a
cryptographically-random `AJEL_SESSION_SECRET` and `AJEL_ADMIN_PASSWORD`. You will
see the generated password in the terminal output — save it somewhere safe.

## Deploy with Docker Compose (one-click)

```bash
# 1. Copy and fill in your secrets
cp .env.example .env.local
node scripts/generate-env.js   # or edit .env.local manually

# 2. Start the app
docker compose up -d
```

Open **http://localhost:3000** and log in with the credentials from `.env.local`.

## Environment variables

| Variable | Required | Description |
|---|---|---|
| `AJEL_ADMIN_EMAIL` | ✅ | Admin login email |
| `AJEL_ADMIN_PASSWORD` | ✅ | Admin login password – **change this!** |
| `AJEL_SESSION_SECRET` | ✅ | Secret for signing session cookies (32+ chars) |
| `OPENAI_API_KEY` | ❌ | Falls back to heuristic insights if omitted |
| `OPENAI_MODEL` | ❌ | Defaults to `gpt-4o-mini` |
| `NEWS_API_KEY` | ❌ | Optional; GDELT + ReliefWeb work without it |
| `RELIEFWEB_APPNAME` | ❌ | Identifier sent to ReliefWeb API |

Generate a ready-to-use `.env.local` with:
```bash
node scripts/generate-env.js
```

## Main routes
- `/login` – secure entry
- `/dashboard` – main AI situation room
- `/api/live` – live brief payload
- `/api/watchlists` – watchlist CRUD
- `/api/bookmarks` – bookmark CRUD
- `/api/snapshots` – historical snapshots

## Testing
```bash
npm test           # run all tests once
npm run test:watch # watch mode
npm run typecheck  # TypeScript type check
```

## Security
Please review [SECURITY.md](SECURITY.md) for our vulnerability disclosure policy and security
recommendations.

## Notes
- SQLite database file is stored in `data/ajel.sqlite`.
- If `OPENAI_API_KEY` is missing, AJEL falls back to deterministic heuristic insights.
- NewsAPI is optional; the dashboard still works with GDELT + ReliefWeb only.
- Node.js ≥ 22 is required for the built-in `node:sqlite` module.

