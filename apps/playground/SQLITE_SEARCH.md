# SQLite documentation search

The existing Vite build extracts MDX prose, headings, inline code, fenced code,
and relative `?raw` example imports into a SQLite database. No additional workflow,
server, credentials, or database hosting is needed. The Pages deployment publishes
the database and SQLite engine alongside the application.

The generated file is `dist/assets/search-<hash>.sqlite`. Its content hash changes
when indexed content changes. Open it with any SQLite tool to inspect the
`documents` and `tokens` tables:

```sql
SELECT title, description, body FROM documents;
SELECT DISTINCT documents.key
FROM tokens JOIN documents ON documents.id = tokens.doc_id
WHERE word >= 'console' AND word < 'consolf';
```

Search loads the database and engine on the first nonempty query, and keeps them
in a Web Worker for subsequent queries. Every query term must match a word prefix;
one typo or adjacent transposition is allowed only in title words of at least four
characters. Ancestor labels and routing IDs do not produce matches. Results retain
the sidebar's existing grouping and navigation order. Hidden pages remain hidden.

The worker opens the database in query-only mode. Loading errors appear in the
sidebar; changing the query retries loading. Requests are debounced and obsolete
responses cannot replace results for a newer query. Empty queries restore the full
navigation tree without loading SQLite.

In development, Markdown (`.md`) and MDX (`.mdx`) transforms update the in-memory document index and notify the search client through Vite HMR. The client discards the cached SQLite worker, re-fetches the database, and repeats the current nonempty query. Tracked relative `?raw` source imports are watched, and changes trigger re-transformation of their importing documentation modules. Deleting an indexed Markdown or MDX file removes its document from the index. No `dist/` output or dev-server restart is needed.

The dev server serves a generated database at `@search.sqlite`; production uses a
hashed asset URL that respects Vite's configured base path for GitHub Pages.

Validation: `npm test`, `npm run typecheck`, `npm run lint`,
`npm run format:check`, and `npm run build`.
