## Why

The site is currently running on a self-hosted Windows server (PM2 + Caddy + Express) with infrastructure concerns — Windows-specific paths, an unused MongoDB connection, self-hosted Umami analytics proxied through Express, and Prometheus metrics that have no relevance in a serverless context. Moving to Vercel gives us proper CDN-served static delivery, zero-ops deployment on push, preview URLs per PR, and clean serverless functions for the public API — all without managing a server.

## What Changes

- **Remove** the entire `server/` Express application
- **Remove** MongoDB (`mongoose`) dependency — it is connected but never used
- **Remove** Prometheus metrics (`prom-client`) and the `/metrics` endpoint
- **Remove** Umami reverse proxy (`/stats/*` → `localhost:3001`) from the server
- **Add** Vercel Analytics to replace self-hosted Umami (privacy-friendly, zero-config)
- **Add** `vercel.json` to configure build, output directory, and API routing
- **Add** Vercel Serverless Functions at `api/` to expose the public codex API endpoints
- **Add** Vercel Blob storage for large static assets (PDFs, cover images)
- **Add** CDN-versioned strategy for `codex-lattice.json` — upload to Blob on build, expose stable URL with build hash for cache-busting
- **Remove** `AboutView.vue` (hardcoded self-hosted URLs, replaced by the new home page in a future change)
- **Make** all internal API/asset references relative (remove hardcoded `alignos.cosmiccreation.net` URLs)
- **Remove** Windows-specific deployment scripts (`deploy.ps1`, `caddy.ps1`, `setup-staging.ps1`, `DEPLOYMENT.md`, `test_middleware.bat`)
- Link GitHub remote `https://github.com/thewebkid/alignos.io.git` to the Vercel project

## Capabilities

### New Capabilities

- `vercel-hosting`: Configure the project for Vercel — `vercel.json`, build command (`cd client && npm run build`), output directory (`client/dist`), and GitHub integration
- `vercel-analytics`: Integrate Vercel Analytics in the Vue app as the replacement for the self-hosted Umami proxy
- `codex-api`: Vercel Serverless Functions exposing `/api/codex-lattice`, `/api/codex-lattice-meta`, and `/api/codex/[id]` — thin file readers replacing the Express routes
- `blob-assets`: Upload large static files (PDFs, cover images from `client/public/pdf/` and `client/public/md/covers`) to Vercel Blob; update references in the app to use Blob URLs

### Modified Capabilities

_(none — this change is infrastructure only; no existing spec-level behavior changes)_

## Impact

- **Deleted**: `server/` directory entirely
- **Deleted**: Root-level Windows scripts (`deploy.ps1`, `caddy.ps1`, `setup-staging.ps1`, `test_middleware.bat`)
- **Deleted**: `DEPLOYMENT.md` (will be replaced with Vercel deploy docs)
- **Modified**: `client/src/views/AboutView.vue` — removed from router and deleted
- **Modified**: `client/src/router/index.js` — remove `/about` route
- **Modified**: `client/vite.config.js` — remove Umami proxy from `server.proxy`; codex-lattice loader updated if Blob strategy changes import path
- **Modified**: `client/src/App.vue` — integrate Vercel Analytics script
- **Added**: `api/codex-lattice.js`, `api/codex-lattice-meta.js`, `api/codex/[id].js`
- **Added**: `vercel.json`
- **Added**: Build script step to upload `codex-lattice.json` to Vercel Blob and write the resulting URL to an env/config file consumed by the API functions
- **Dependencies removed**: `mongoose`, `prom-client`, `http-proxy-middleware`, `nodemon`, `express`, `cors` (entire `server/package.json`)
