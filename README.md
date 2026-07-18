# RSS Reader

[![License: MIT]](LICENSE)

**A modern reinterpretation of Google Reader.**
Built with Next.js and Drizzle.

<img src="rss-reader-evolution.gif" alt="RSS Reader" />

## Features

- **Subscribe** to RSS and Atom feeds
- **Organize** into folders
- **Star** your favorite articles
- **Search** across titles, authors, summaries, and content
- **Navigate** with keyboard shortcuts
- **Import/export** using OPML files

## Tech stack

- Next.js 15 (React 19)
- Tailwind CSS v4
- SQLite
- Drizzle ORM

## Quick start

```bash
npm install
npm run db:migrate  # creates the database
npm run db:seed     # populates a few starter feeds (optional)
npm run dev         # http://localhost:3000
```

## Scripts

| What                  | Why                             |
| --------------------- | ------------------------------- |
| `npm run build`       | Production build                |
| `npm run db:generate` | Generate migrations from schema |
| `npm run db:migrate`  | Apply migrations                |
| `npm run db:seed`     | Subscribe to starter feeds      |
| `npm run dev`         | Start development server        |
| `npm run lint`        | Lint code                       |
| `npm run refresh`     | Fetch all feeds from the CLI    |
| `npm run test:watch`  | Run tests in watch mode         |
| `npm start`           | Run production build            |
| `npm test`            | Run the test suite              |

> `db:seed` and `refresh` fetch live feeds, so they require network access.

## API

| Method   | Endpoint                      | Description                          |
| -------- | ----------------------------- | ------------------------------------ |
| `GET`    | `/api/articles`               | List articles                        |
| `POST`   | `/api/articles/mark-all-read` | Mark matching articles as read       |
| `GET`    | `/api/articles/{id}`          | Fetch one article with full content  |
| `PATCH`  | `/api/articles/{id}`          | Set read/starred                     |
| `GET`    | `/api/feeds`                  | List feeds with unread counts        |
| `POST`   | `/api/feeds`                  | Subscribe to a feed                  |
| `PATCH`  | `/api/feeds/{id}`             | Move a feed to a folder              |
| `DELETE` | `/api/feeds/{id}`             | Unsubscribe and delete its articles  |
| `POST`   | `/api/feeds/{id}/mark-read`   | Mark every article in a feed as read |
| `GET`    | `/api/folders`                | List folders                         |
| `POST`   | `/api/folders`                | Create a folder                      |
| `PATCH`  | `/api/folders/{id}`           | Rename a folder                      |
| `DELETE` | `/api/folders/{id}`           | Delete a folder                      |
| `GET`    | `/api/opml/export`            | Download all subscriptions as OPML   |
| `POST`   | `/api/opml/import`            | Import an OPML file                  |
| `POST`   | `/api/refresh`                | Refetch feeds                        |

Both `/api/articles` and `/api/articles/mark-all-read` accept the same
filter query params, so "mark all read" only affects the currently-visible
set on the list endpoint. The browser also refreshes all feeds in the
background every five minutes while the app is open.

## Layout

```
data            # SQLite DB
drizzle         # generated migrations
scripts         # CLI: migrate, seed, refresh
src/app/api     # REST API route handlers
src/components  # React UI
src/lib/api     # shared route helpers
src/lib/db      # Drizzle client, schema, queries, etc.
src/lib/feeds   # fetch + parse + sanitize + store
src/lib/opml    # OPML import/export
```

SQLite database is stored by default at `data/reader.db`.

## License

MIT. See [LICENSE](LICENSE).

## Acknowledgements

The RSS Reader logo is an illustration by [Round Icons] on [Unsplash]. The
color palette was generated with [Color Palette Pro].

[License: MIT]: https://img.shields.io/badge/license-MIT-green
[Round Icons]: https://unsplash.com/@roundicons/illustrations
[Unsplash]: https://unsplash.com/illustrations
[Color Palette Pro]: https://colorpalette.pro
