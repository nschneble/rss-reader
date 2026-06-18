# RSS Reader

A modern reinterpretation of Google Reader. Next.js 15 + SQLite + Drizzle. Single-user, local-first.

## Features

- **Subscribe** to RSS and Atom feeds by URL
- **Folder organization** — dropdown reassignment, unread counts roll up
- **Three-pane layout** (feeds / articles / reader) on desktop, mobile pane switching
- **Read & star state** with optimistic updates
- **Full-text search** across titles, authors, summaries, content
- **OPML import & export** for migration in and out
- **Periodic refresh** (5-minute background interval) plus manual refresh
- **Keyboard shortcuts**: `j`/`k` navigate, `s` star, `m` mark read, `r` refresh, `/` focus search, `u` toggle unread-only
- **Sanitized content** with allowlist for safe iframes (YouTube, Vimeo)
- **Light / dark theme** via `prefers-color-scheme`

## Stack

- Next.js 15 App Router (React 19, TypeScript)
- Tailwind CSS v4
- SQLite via better-sqlite3
- Drizzle ORM
- rss-parser, sanitize-html

## Run it

```bash
npm install
npm run db:migrate     # creates data/reader.db
npm run db:seed        # optional — populates a few starter feeds
npm run dev            # http://localhost:3000
```

Production:

```bash
npm run build
npm start
```

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Dev server on port 3000 |
| `npm run build` | Production build |
| `npm start` | Run production build |
| `npm run lint` | ESLint |
| `npm run db:generate` | Drizzle: generate migrations from schema |
| `npm run db:migrate` | Apply migrations to `data/reader.db` |
| `npm run db:seed` | Subscribe to a curated set of starter feeds |
| `npm run refresh` | Fetch all feeds once from the CLI |

## Storage

SQLite database at `data/reader.db` (gitignored). Override with `RSS_READER_DB=/path/to/db.sqlite`.

## API

REST endpoints under `/api`:

- `GET/POST /api/feeds` — list / subscribe
- `PATCH/DELETE /api/feeds/[id]` — reassign folder / unsubscribe
- `POST /api/feeds/[id]/mark-read`
- `GET /api/articles?feedId=&folderId=&starred=1&unread=1&search=&limit=&offset=`
- `GET/PATCH /api/articles/[id]` — fetch / set read / set starred
- `POST /api/articles/mark-all-read`
- `GET/POST /api/folders`, `PATCH/DELETE /api/folders/[id]`
- `POST /api/refresh?feedId=` (omit `feedId` to refresh all)
- `GET /api/opml/export`
- `POST /api/opml/import` (multipart form, field `file`)

## Layout

```
src/
  app/
    page.tsx           # mounts <ReaderApp />
    layout.tsx
    globals.css        # theme tokens + prose styles
    api/               # REST routes
  components/
    reader-app.tsx     # top-level state + 3-pane shell
    sidebar.tsx
    article-list.tsx
    reader.tsx
    add-feed-dialog.tsx
    new-folder-dialog.tsx
    icons.tsx
  lib/
    db/                # client, schema, queries, migrate
    feeds/             # rss-parser wrapper, sanitize, store
    opml/              # build/parse OPML
    api-client.ts      # typed fetch wrapper for components
drizzle/               # generated migrations
scripts/               # CLI: migrate, seed, refresh
data/                  # SQLite DB (gitignored)
```

## License

MIT
