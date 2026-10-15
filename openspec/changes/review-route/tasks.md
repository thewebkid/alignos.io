## 1. Build flag and routes

- [x] 1.1 `vite.config.js`: define `__ALIGNOS_REVIEW__` from `ALIGNOS_REVIEW`; add `../docs/review` to `server.fs.allow`
- [x] 1.2 `PageView.vue`: optional `markdown` prop, falling back to the route-meta `page` lookup
- [x] 1.3 `ReviewView.vue`: eager `?raw` glob of `docs/review/*.md`, renders the route's document through `PageView`, sets `noindex`
- [x] 1.4 Router: `/review` and `/review/questions` inside `if (__ALIGNOS_REVIEW__)`

## 2. Documents

- [x] 2.1 `audit-series.js`: codex titles link to `/codex/{id}`, series headings to `/lattice?series={id}`, header note as an HTML comment; regenerate `james-questions.md`
- [x] 2.2 `alignos-2-review.md`: drop the staging-link placeholder, link each item to what it's about, link the question list at `/review/questions`, header note as an HTML comment

## 3. Noindex and cutover

- [x] 3.1 `vercel.json`: `X-Robots-Tag: noindex` header for `*.vercel.app` hosts; confirm `generate-redirects.js` leaves it in place
- [x] 3.2 `vercel-deployment-bootstrap/tasks.md`: before the DNS move, remove `ALIGNOS_REVIEW`, redeploy, confirm `/review` redirects home
- [ ] 3.3 Set `ALIGNOS_REVIEW=1` on the Vercel project's Production environment (ask Ron before changing project settings)

## 4. Verify

- [x] 4.1 Build with the flag: both pages pre-rendered with their text and a robots `noindex` meta; links navigate in `vite preview`; no `/review` in `llms.txt`/`llms.json`
- [x] 4.2 Build without the flag: no `dist/review*`, and no file in `dist` contains the review document's opening sentence
- [x] 4.3 Visual check of both pages in light and dark (lists, blockquote, line breaks)
- [ ] 4.4 After deploy: `X-Robots-Tag: noindex` on `alignos-omega.vercel.app`; `/review` and `/review/questions` load
- [x] 4.5 `openspec validate review-route --strict`
