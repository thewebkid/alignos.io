## 1. Vercel Project Setup

- [x] 1.1 Verify Vercel CLI is globally installed (`vercel --version`); install globally if not (`npm i -g vercel`)
- [x] 1.2 Project is already linked. Staging deploys are live at `https://alignos-omega.vercel.app/`
- [x] 1.3 Create `vercel.json` at the repo root with `buildCommand`, `outputDirectory` (`client/dist`), `installCommand`, and `functions` config with `includeFiles` for the lattice JSON files
- [x] 1.4 Preview deploys already succeed on that project. No separate confirmation deploy.

## 2. Vercel Analytics Integration

- [x] 2.1 Install `@vercel/analytics` in `client/`: `cd client && npm install @vercel/analytics`
- [x] 2.2 In `client/src/main.js`, import and call `inject` from `@vercel/analytics` inside the `isClient` guard
- [x] 2.3 Remove the `/stats` proxy entry from `server.proxy` in `client/vite.config.js`
- [x] 2.4 Remove any Umami `<script>` tag or `/stats/script.js` reference from `client/index.html`

## 3. Vercel Serverless API Functions

- [x] 3.1 Create `api/` directory at the repo root
- [x] 3.2 Create `api/codex-lattice.js` — reads `codex-lattice.json` via `fs.readFileSync` (path relative to function), sets `Content-Type: application/json` and cache headers, sends response
- [x] 3.3 Create `api/codex-lattice-meta.js` — same pattern for `codex-lattice-meta.json`
- [x] 3.4 Create `api/codex/[id].js` — reads full lattice, finds by `id`, returns 200 with codex object or 404 with error JSON
- [x] 3.5 GET on `https://alignos-omega.vercel.app`: `/api/codex-lattice-meta` 200 JSON (~272 KB), `/api/codex-lattice` 200 JSON (~3.4 MB), `/api/codex/when-ai-remembers-the-field` 200, `/api/codex/not-a-real-codex` 404 with the browse suggestion. HEAD is 405, which is the handler's method check.

## 4. Remove Server & Windows Infrastructure

- [x] 4.1 Delete the entire `server/` directory
- [x] 4.2 Delete `deploy.ps1` from repo root
- [x] 4.3 Delete `caddy.ps1` from repo root
- [x] 4.4 Delete `setup-staging.ps1` from repo root
- [x] 4.5 Delete `test_middleware.bat` from repo root
- [x] 4.6 Delete `DEPLOYMENT.md` from repo root
- [x] 4.7 Review root `package.json` and `package-lock.json` — remove any server-specific scripts or workspace entries that reference `server/`

## 5. Remove AboutView & Fix Hardcoded URLs

- [x] 5.1 Delete `client/src/views/AboutView.vue`
- [x] 5.2 Remove the `/about` route from `client/src/router/index.js`
- [x] 5.3 Add a catch-all redirect for `/about` in `vercel.json` (redirect to `/` or a 404 page)
- [x] 5.4 Search codebase for `alignos.cosmiccreation.net` and replace all instances with relative paths (e.g., `/api/codex-lattice`)

## 6. Vercel Blob — PDFs only

Covers (`client/public/covers/`) and thumbnails (`client/public/thumb/`) stay in the repo. Copies in the blob store can stay; the app does not use them.

- [x] 6.1 Blob store `alignos-blob` already exists
- [x] 6.2 No write token in the app. Objects are public-read
- [x] 6.3 PDFs are already uploaded under `/pdf/`. No migration script
- [x] 6.4 Base URL is `https://qahh5hlfi6v2odz8.public.blob.vercel-storage.com`
- [x] 6.5 That host is the default in `cdnUrl.pdf`. `VITE_BLOB_BASE_URL` overrides it and is not set on the project
- [x] 6.6 `cdnUrl.pdf` returns `{base}/pdf/{id}.pdf`. Cover and thumb URLs stay `/covers/` and `/thumb/`. `vercel.json` rewrites `/pdf/:path*` to the same store so existing redirect destinations keep working
- [x] 6.7 Blob object `pdf/when-ai-remembers-the-field.pdf` and compilation `pdf/the-evolution-of-the-sovereign.pdf` return 200. Staging cover `covers/between-the-whole-and-the-relational.jpg` returns 200. The rewrite itself goes out with the next deploy
- [x] 6.8 `client/public/pdf/` removed from Git and ignored. `covers/` and `thumb/` stay committed

## 7. Retire the review route

Go-live (DNS, SSL, production promote, smoke test, cosmiccreation redirect) is out of this change.

- [x] 7.1 Remove `/review` and `/review/questions`, `ReviewView.vue`, and the `ALIGNOS_REVIEW` build flag. Unknown paths still fall through to `/`
- [x] 7.2 Move `docs/review/alignos-2-review.md` and `docs/review/james-questions.md` into `james-lattice-decisions/review/` and archive that change at `openspec/changes/archive/2026-10-15-james-lattice-decisions/`
