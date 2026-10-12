# Browser regression: global documentation search

The automated Playwright test is `sidebar-search.spec.ts`.

Install Chromium once with `npx playwright install chromium`, then run
`npm run test:browser`. Playwright builds and serves a production preview on port
5174, separate from the usual development server. This runs independently from
Vitest's `npm test`.

## Assertions

1. The documentation sidebar has exactly one search box.
2. Searching `ansi` finds Console, addon, and repository documentation pages.
3. The unrelated Console Feed navigation entry is absent from results.
4. Filtering keeps the current article open until a result is selected.
5. Selecting the ANSI data export result navigates to the correct addon page and
   retains the query.
6. A query with no matches shows one **No matching pages** status.
7. Clearing the query restores normal package navigation.

A screenshot of the global ANSI results is saved to the Playwright test output
folder. Failure screenshots and traces are also retained there.

The earlier `sidebar-search-ansi.jpg` records the former per-package search UI;
keep it only as historical evidence of the original confusing behavior.
