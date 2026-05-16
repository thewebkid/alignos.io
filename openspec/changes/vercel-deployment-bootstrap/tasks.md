## 1. Vercel Project Setup

- [x] 1.1 Verify Vercel CLI is globally installed (`vercel --version`); install globally if not (`npm i -g vercel`)
- [ ] 1.2 Run `vercel link` in the repo root to connect this directory to the Vercel project (or create new) linked to GitHub remote `https://github.com/thewebkid/alignos.io.git`
- [x] 1.3 Create `vercel.json` at the repo root with `buildCommand`, `outputDirectory` (`client/dist`), `installCommand`, and `functions` config with `includeFiles` for the lattice JSON files
- [ ] 1.4 Run `vercel deploy` (preview) to confirm the build pipeline works end-to-end before making any code changes

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
- [ ] 3.5 Test all three API endpoints on the preview deployment

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

## 6. Vercel Blob Storage Setup (Phase 2 — can defer until after go-live)

- [ ] 6.1 Create a Vercel Blob store in the Vercel dashboard and note the store name
- [ ] 6.2 Run `vercel env pull` to get `BLOB_READ_WRITE_TOKEN` into local `.env`
- [ ] 6.3 Write a one-time migration script (`scripts/upload-to-blob.js`) to upload all files from `client/public/pdf/`, `client/public/md/covers/`, and `client/public/md/thumb/` to Vercel Blob
- [ ] 6.4 Run the migration script and capture the Blob base URL
- [ ] 6.5 Set `VITE_BLOB_BASE_URL` in Vercel environment variables (production + preview)
- [ ] 6.6 Update `build-lattice.js` to prefix `pdfUrl` and `coverImage` fields with `process.env.VITE_BLOB_BASE_URL` when present
- [ ] 6.7 Update any hardcoded `/pdf/` or `/md/covers/` references in Vue components to use the env-var-based URL builder
- [ ] 6.8 Verify PDFs download and images render from Blob CDN on a new preview deployment
- [ ] 6.9 Remove `client/public/pdf/`, `client/public/md/covers/`, `client/public/md/thumb/` from Git (`.gitignore` or `git rm`)

## 7. Production Go-Live

- [x] 7.1 Run a full build locally (`cd client && npm run build`) to confirm no build errors
- [ ] 7.2 Deploy to Vercel production (`vercel --prod` or merge to `master`)
- [ ] 7.3 Point `alignos.io` DNS to Vercel (add domain in Vercel dashboard, update DNS records)
- [ ] 7.4 Confirm SSL certificate is provisioned for `alignos.io`
- [ ] 7.5 Smoke test: home page loads, codex reader works, search works, `/api/codex-lattice-meta` returns JSON
- [ ] 7.6 Set up a permanent redirect on `alignos.cosmiccreation.net` to `alignos.io` (done on the old server, not this repo)
