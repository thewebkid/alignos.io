## Why

James reviews the new site before alignos.io moves, and the review has two documents: what we built (`docs/review/alignos-2-review.md`) and the generated question list (`docs/review/james-questions.md`). As markdown files sent by email or Drive they arrive as raw text with dead links, and every item points at something on the site he would have to find by hand. Served as pages on the staging site, each item can link to the page, corridor, or codex it's about. This reverses the earlier "markdown list instead of a `/review` page" decision, now that a staging URL exists.

Staging (`alignos-omega.vercel.app`) is a production alias and is currently indexable: it sends no `X-Robots-Tag`. A staging copy of James' site shouldn't compete with the live one in search.

## What Changes

- Add `/review` (the review document) and `/review/questions` (the question list) as pages on the site, rendered like the other markdown pages.
- Build the review pages only when `ALIGNOS_REVIEW=1` is set at build. Without it, neither the routes nor the document text are in the build output. Removing the variable is a step in the cutover checklist.
- Review pages carry `noindex`, are not in the menu, and are not listed in `llms.txt`, `llms.json`, or the page markdown.
- Every `*.vercel.app` host serves `X-Robots-Tag: noindex`. Custom domains (alignos.io) are unaffected, so nothing has to be undone at cutover.
- The review document's links become site-relative (`/lattice?series=…`, `/codex/…`), and its "[staging link]" placeholder goes.
- The question list generator links every codex it names to its reader page and every series to its corridor. Maintainer notes (how the file is generated) become invisible in the rendered page.

## Capabilities

### New Capabilities
- `staging-review`: The review pages for James (routes, build gating, noindex, links), and noindex for non-production hosts.

### Modified Capabilities
<!-- None. The question list's content requirements in series-registry are unchanged; only its link formatting changes. -->

## Impact

- `client/src/router/index.js`, `client/vite.config.js` (build-time flag), `PageView.vue` (a second source of page markdown), and a new loader for the review documents.
- `scripts/audit-series.js` (links in the generated question list), `docs/review/alignos-2-review.md`.
- `vercel.json` gains a `headers` rule; `scripts/generate-redirects.js` must keep it (it rewrites `redirects` only).
- Vercel project env: `ALIGNOS_REVIEW=1` on the staging build; `vercel-deployment-bootstrap` gets a cutover task to remove it.
