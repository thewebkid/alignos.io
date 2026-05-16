## Context

alignos.io is a Vue 3 SSG site (vite-ssg) with 133+ pre-rendered codex pages. The current architecture wraps this in an Express server on a self-hosted Windows box, adding MongoDB (unused), Prometheus metrics, a reverse proxy to self-hosted Umami, and various Windows-specific deployment scripts. None of the Express infrastructure is needed for the site itself — the Vue app loads all data from Vite-bundled JSON imports. The Express API routes (`/api/codex-lattice`, `/api/codex-lattice-meta`, `/api/codex/:id`) exist solely for external consumers (developers, LLM tools).

The client build is already fully static and SSG-ready. The migration is primarily infrastructure surgery with minimal application code changes.

**GitHub remote**: `https://github.com/thewebkid/alignos.io.git`

## Goals / Non-Goals

**Goals:**
- Deploy the site to Vercel with zero self-hosted infrastructure
- Replace all Express server functionality with Vercel primitives (static serving, Serverless Functions)
- Remove MongoDB, Prometheus, and Umami proxy entirely
- Add Vercel Analytics as the analytics solution
- Move large binary assets (PDFs, cover images) to Vercel Blob, reducing deployment bundle size
- Serve `codex-lattice.json` from Blob CDN with build-time versioning for cache control
- Make all internal URLs relative (remove hardcoded `alignos.cosmiccreation.net`)
- Remove `AboutView.vue` (it only existed to document the self-hosted API)
- Vercel CLI linked to GitHub repo, deploy on push to `master`

**Non-Goals:**
- Adding new content pages (home page redesign, FAQ, return-room — separate changes)
- Changing the Vue application routing, design, or components beyond what's listed
- Setting up authentication, databases, or any stateful backend
- Migrating self-hosted Umami data/history

## Decisions

### Decision 1: Vercel Serverless Functions for the public API

**Choice**: Create `api/codex-lattice.js`, `api/codex-lattice-meta.js`, `api/codex/[id].js` as Vercel Functions.

**Why over pure static files**: The API URLs (`/api/codex-lattice`) are documented externally and already in use by the cosmiccreation.net site consumers. Keeping the same URL shape maintains backward compatibility. Static files at `/data/codex-lattice.json` would require updating external consumers.

**Why over keeping Express**: Serverless functions cold-start in <100ms for file reads. No server to maintain. No port. Deploy on every `git push`.

**Implementation**: Each function reads from `client/src/generated/codex-lattice.json` (or the Blob URL for the versioned lattice) using `fs.readFileSync` or a `fetch` to Blob. The functions use `includeFiles` in `vercel.json` to bundle the JSON at deploy time.

**Alternative considered**: Route `/api/codex-lattice` as a rewrite to a static file in `client/dist/`. Rejected — Vercel rewrites work for static assets but MIME types and cache headers are harder to control than in a function.

### Decision 2: Vercel Analytics (replaces Umami)

**Choice**: `@vercel/analytics` Vue integration.

**Why**: Zero infrastructure, no self-hosted service, privacy-friendly (no cookies by default), auto-instrumented with Web Vitals. The Umami proxy was the only reason the `/stats` route existed in Express — removing it simplifies the server entirely.

**Integration**: Add `@vercel/analytics` package to the client. In `main.js`, call `inject()` from `@vercel/analytics` on `isClient`. Remove the `/stats` proxy from `vite.config.js` dev server proxy config.

**Alternative considered**: Umami Cloud. Rejected — requires separate account/billing. Vercel Analytics is included in the Vercel plan and requires no extra setup.

### Decision 3: Vercel Blob for large static assets

**Choice**: Upload PDFs (`client/public/pdf/`) and cover images (`client/public/md/covers/`, `client/public/md/thumb/`) to Vercel Blob during a one-time migration step. Reference via Blob URLs in the app.

**Why**: The `client/public/pdf/` folder contains 133+ PDF files (each 500KB–800KB). The total is likely 70–100MB. Vercel's deployment bundle limit is 250MB compressed, but keeping binaries out of Git and out of the deploy artifact is a best practice. Blob serves from Cloudflare CDN with aggressive caching.

**Blob URL strategy**: Use a known prefix path (e.g., `VITE_BLOB_BASE_URL` env var) so the app can construct Blob URLs without hardcoding. `build-lattice.js` currently writes PDF paths; it will be updated to write Blob URLs when `VITE_BLOB_BASE_URL` is set.

**Alternative considered**: Vercel's native static serving from `public/`. Viable short-term, but pushes large binary files into the deploy bundle and Git history. Blob is the right long-term home.

### Decision 4: codex-lattice.json CDN versioning via Blob

**Choice**: During the Vercel build, after `build-lattice.js` generates `codex-lattice.json`, a post-build script uploads it to Vercel Blob with a content-addressed key (e.g., `codex-lattice-{hash}.json`). The API function reads a `CODEX_LATTICE_BLOB_URL` env var to know which version to proxy/redirect to.

**Why**: `codex-lattice.json` is 3.4MB. It's bundled into the Vite output as a dynamic import chunk, which is fine. But the API function serving it externally benefits from CDN caching. The hash-keyed Blob URL means old versions remain cached in browsers while new builds produce fresh URLs.

**For the Vue app itself**: The app continues using the Vite-bundled dynamic import (`import('./generated/codex-lattice.json')`). This is fastest (no fetch, uses Vite's chunk caching). The Blob URL is only for the API function's external response.

**Alternative considered**: Always serve from `client/src/generated/codex-lattice.json` via `fs.readFileSync` in the function. Simpler, works fine. The Blob strategy is an optimization — if complexity is a concern during first pass, skip it and serve from the bundled file. Mark as a follow-up improvement.

### Decision 5: vercel.json structure

```json
{
  "buildCommand": "cd client && npm install && npm run build",
  "outputDirectory": "client/dist",
  "installCommand": "cd client && npm install",
  "functions": {
    "api/codex-lattice.js": {
      "includeFiles": "client/src/generated/codex-lattice.json"
    },
    "api/codex-lattice-meta.js": {
      "includeFiles": "client/src/generated/codex-lattice-meta.json"
    },
    "api/codex/[id].js": {
      "includeFiles": "client/src/generated/codex-lattice.json"
    }
  }
}
```

The `outputDirectory` points to `client/dist` where vite-ssg writes the pre-rendered HTML. Vercel serves this from CDN. The `api/` folder at the root is auto-discovered by Vercel as serverless functions.

## Risks / Trade-offs

- **[Risk] Blob upload in CI adds complexity** → Mitigation: Phase 1 ships without Blob — serve PDFs from `public/` as before. Blob migration is Phase 2 once the site is running on Vercel.
- **[Risk] codex-lattice.json hash strategy requires a post-build script** → Mitigation: Start with simple `fs.readFileSync` in the API function (included via `includeFiles`). Blob CDN strategy is an optimization, not a blocker.
- **[Risk] `includeFiles` in Vercel Functions has size limits** → Mitigation: The full lattice JSON is 3.4MB, well within function bundle limits (50MB). Not a concern.
- **[Risk] `build-lattice.js` reads markdown from `client/public/md/` — these files must be available at build time on Vercel** → Mitigation: The markdown files are committed to the repo and will be present during build. No change needed.
- **[Risk] Removing AboutView.vue leaves a dead `/about` route** → Mitigation: Remove route from `router/index.js`. Vercel will serve the SSG fallback (`index.html`) for unknown routes, or we add a redirect in `vercel.json`.

## Migration Plan

1. Link Vercel project to GitHub repo via Vercel CLI (`vercel link`)
2. Set up `vercel.json` and confirm build succeeds on a preview deployment
3. Create `api/` serverless functions
4. Integrate Vercel Analytics in Vue client
5. Remove `server/` directory and all Windows scripts
6. Remove `AboutView.vue` and `/about` router entry
7. Fix all hardcoded `alignos.cosmiccreation.net` URL references → relative
8. Test preview deployment end-to-end (site loads, API functions respond, analytics fires)
9. Configure production domain `alignos.io` in Vercel dashboard
10. **(Phase 2, separate change)** Migrate PDFs/covers to Blob storage

**Rollback**: The self-hosted site at `alignos.cosmiccreation.net` remains live throughout. DNS for `alignos.io` is not pointed to Vercel until deployment is confirmed working.

## Open Questions

- Does the Vercel plan support the deployment bundle size including all PDFs in `public/`? (Expected ~80MB of PDFs) — check before Phase 1 goes live; if too large, accelerate Phase 2 Blob migration.
- Should the `codex-lattice-meta.json` also be served from Blob, or is bundled-in-function sufficient given its small size (130KB)? Likely sufficient bundled.
