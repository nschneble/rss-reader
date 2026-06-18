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
| `npm run dev`         | Start development server        |
| `npm run build`       | Production build                |
| `npm start`           | Run production build            |
| `npm run lint`        | Lint code                       |
| `npm run db:generate` | Generate migrations from schema |
| `npm run db:migrate`  | Apply migrations                |
| `npm run db:seed`     | Subscribe to starter feeds      |
| `npm run refresh`     | Fetch all feeds from the CLI    |

## API

| Method   | Endpoint                      | Description       |
| -------- | ----------------------------- | ----------------- |
| `GET`    | `/api/feeds`                  | List feeds        |
| `POST`   | `/api/feeds`                  | Subscribe to feed |
| `PATCH`  | `/api/feeds/{id}`             | Move to folder    |
| `DELETE` | `/api/feeds/{id}`             | Unsubscribe       |
| `POST`   | `/api/feeds/{id}/mark-read`   |                   |
| `GET`    | `/api/articles`               |                   |
| `GET`    | `/api/articles/{id}`          | Fetch article     |
| `PATCH`  | `/api/articles/{id}`          | Mark read/starred |
| `POST`   | `/api/articles/mark-all-read` |                   |
| `GET`    | `/api/folders`                |                   |
| `POST`   | `/api/folders`                |                   |
| `PATCH`  | `/api/folders/{id}`           |                   |
| `DELETE` | `/api/folders/{id}`           |                   |
| `POST`   | `/api/refresh`                |                   |
| `POST`   | `/api/opml/import`            | Xxx               |
| `GET`    | `/api/opml/export`            |                   |

## Layout

```
src/
  app/
    api/       # REST API
  lib/
    db/        # client + schema
    feeds/     # rss-parser wrapper
scripts/       # CLI: migrate, seed, refresh
drizzle/       # generated migrations
data/          # SQLite DB
```

SQLite database is stored by default at `data/reader.db`. Override with
`RSS_READER_DB=/path/to/db.sqlite`.

## License

MIT. See [LICENSE](LICENSE).

## Acknowledgements

The RSS Reader logo is an illustration by [Round Icons] on [Unsplash]. The
color palette was generated with [Color Palette Pro].

[License: MIT]: https://img.shields.io/badge/license-MIT-green
[Round Icons]: https://unsplash.com/@roundicons/illustrations
[Unsplash]: https://unsplash.com/illustrations
[Color Palette Pro]: https://colorpalette.pro
