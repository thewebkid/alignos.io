# Test suite

Record of the test work on `ron/feature/pipeline`. This is a plan, not an OpenSpec change.

## Done

- [x] Vitest unit tests for glossary parsing and longest-match wrapping, title-over-body search ranking, reading progress (percent only rises, position updates, 95% complete), the three API handlers (200, 404, 405), and PDF-versus-cover URLs. Live in [client/tests/unit](../client/tests/unit).
- [x] Playwright journeys for home, search, a glossary popover, and reading progress after reload. Live in [client/tests/e2e/reader.spec.js](../client/tests/e2e/reader.spec.js).
- [x] Local commands from the repo root: `npm test` and `npm run test:e2e`. `npm test` builds the lattice first, because `client/src/generated/` is gitignored and the API tests read those files.
- [x] GitHub Actions workflow [.github/workflows/tests.yml](../.github/workflows/tests.yml): `unit`, `e2e`, and `redirects` in parallel, on pull requests and on pushes to `master`. Not a required status check.
- [x] Remove unused Lunr (`client/src/lib/search.js` and the dependency) and the Vite starter sheet (`client/src/style.css`).
- [x] Fixes the suite found: glossary lookup uses the catalog filename `the-living-glossary-of-the-field.md`; the reader redraws after the full glossary loads; the lattice build no longer requires a compilation PDF in `client/public/pdf`.

## Tasks

- [x] 1. One reader for the three API handlers. [api/lattice-file.js](../api/lattice-file.js) reads each generated JSON file once per process and shares `sendJson`. [api/codex/[id].js](../api/codex/[id].js) still finds by id and returns the 404 body. Tests in [client/tests/unit/api.test.js](../client/tests/unit/api.test.js) call the handlers.
- [x] 2. Redirect check in CI. The `redirects` job runs [scripts/generate-redirects.js](../scripts/generate-redirects.js) and fails if `vercel.json` changes. A local run left the file unchanged, so the `/pdf/:path*` rewrite and the `*.vercel.app` noindex header stay put.
- [x] 3. `ALIGNOS_REVIEW` removed from the alignos project's Production environment. The build no longer reads it. The next deploy is what makes `/review` fall through to `/` and sends `/pdf/…` to the blob store.

## Closed on purpose

- SCSS stays split. Tokens and shared classes in [client/src/assets/scss](../client/src/assets/scss). Component styles stay with the components.
- No coverage percentage. The suite is pass/fail.
- Tests do not gate the Vercel build. The GitHub workflow is the signal.
- Reading progress stays in the Pinia store. The unit test already locks the rule.
