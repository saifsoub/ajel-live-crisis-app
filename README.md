# عاجل / AJEL V2

AJEL V2 is a production-oriented Next.js dashboard for monitoring what is happening right now in the Middle East.

## V2 upgrades
- secure login with signed session cookie
- live multi-source ingestion (GDELT + ReliefWeb + optional NewsAPI)
- optional AI-generated insights and executive summary via OpenAI
- SQLite persistence using Node's built-in `node:sqlite`
- saved watchlists
- analyst bookmarks with notes
- automatic historical snapshots every few minutes
- dark executive dashboard UI

## Stack
- Next.js 15 App Router
- React 19
- TypeScript
- `node:sqlite` for local persistent database
- OpenAI SDK for AI synthesis

## Run locally
```bash
npm install
cp .env.example .env.local
npm run dev
```

## Default local login
- Email: `admin@ajel.local`
- Password: `ChangeThisNow!`

Change both in `.env.local` before using the app.

## Environment variables
```bash
AJEL_ADMIN_EMAIL=admin@ajel.local
AJEL_ADMIN_PASSWORD=ChangeThisNow!
AJEL_SESSION_SECRET=replace-with-a-long-random-secret
OPENAI_API_KEY=
OPENAI_MODEL=gpt-5-mini
NEWS_API_KEY=
RELIEFWEB_APPNAME=ajel-v2.local
```

## Main routes
- `/login` – secure entry
- `/dashboard` – main AI situation room
- `/api/live` – live brief payload
- `/api/watchlists` – watchlist CRUD
- `/api/bookmarks` – bookmark CRUD
- `/api/snapshots` – historical snapshots

## Notes
- SQLite database file is stored in `data/ajel.sqlite`.
- If `OPENAI_API_KEY` is missing, AJEL falls back to deterministic heuristic insights.
- NewsAPI is optional; the dashboard still works with GDELT + ReliefWeb only.
