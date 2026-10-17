## Why

A few hundred people read the Codex Lattice on the legacy reader at `alignos.cosmiccreation.net`, and their reading progress lives only in that origin's localStorage. When `alignos.io` goes live, that progress is stranded unless the reader hands it over, and the new lattice has renamed 106 of the reader's 134 codex IDs. The same mechanism also gives anyone a way to carry their reading between their own devices without accounts.

## What Changes

- **Reading progress becomes layout-independent.** Saved progress and resume position are stored as 0–1 fractions of the codex instead of a pixel `scrollTop`, so resuming survives a resize, rotation, text-scale change, or a different device. Older entries (integer percent plus pixels) are normalized on load. `alignos.io` localStorage starts empty at the DNS cut, so nothing in production needs converting.
- **A handoff envelope.** A small versioned JSON document (`kind`, `v`, `src`, `lattice`, `exportedAt`, `progress`, `settings.theme`, `to`), compressed and carried in the URL fragment of a link to `https://alignos.io/import`. The fragment never reaches a server.
- **Retired codex IDs resolve.** A build step generates an alias table from `data/codex-provenance.json` (the same source as the `/codex/<old-id>` 301s), and the build fails if a retired ID is ever reused as a live one.
- **`/import` on alignos.io.** It reads the fragment as early as possible at boot, merges the progress (never lowering anything), applies the theme only where none is saved, clears the fragment, shows a short welcome summary, and offers "Continue reading" to the page the visitor came from.
- **"Carry my reading" on alignos.io.** A modal reached from the reading settings panel: share sheet, copy link, and a QR code, all producing the same link. The `/import` page also accepts a pasted link.
- **Handoff on the legacy reader** (separate repo, `c:\src\alignos`, deployed only after go-live). It shows a personalized modal once, then a dismissible banner on later visits. A later forwarding mode sends every visit straight to `/import`. The target origin comes from Vite env (`http://localhost:5555` in dev, `https://alignos.io` otherwise), and its dev server moves to port 5556 so both sites run side by side.

## Capabilities

### New Capabilities
- `reading-progress`: How reading progress is stored per codex: furthest point and current position as fractions, completion threshold, resume from a fraction, normalizing older entries, and the merge rule shared by every import.
- `reading-handoff`: The handoff envelope and link format, alias resolution of retired codex IDs, the `/import` arrival flow, the "Carry my reading" modal, and the behavior the legacy reader site must provide (modal, banner, forwarding mode, target origin).

### Modified Capabilities
<!-- None in openspec/specs. Resume behavior is specified in the unarchived scroll-memory-and-site-text-scale change (scroll-restoration). This change keeps those rules and only makes the stored position layout-independent; see reading-progress. -->

## Impact

- **alignos.io client:** `stores/readingProgress.js` (data shape, getters, merge), `views/ReaderView.vue` (capture and restore as fractions), lattice, cards, and anything else reading `getScrollPercent`, router (`/import`), boot sequence (consume the fragment before analytics runs), the reading settings panel (entry point), a new carry modal, `useTheme` (apply an imported theme).
- **alignos.io build:** a new generated alias table next to the lattice output, plus a uniqueness check, in `npm run build:lattice`.
- **Dependencies:** a small QR encoder, lazy-loaded with the carry modal. Compression uses the browser's built-in `CompressionStream`, with an uncompressed fallback.
- **Tests:** unit tests for the store, merge, envelope, and resolver. Playwright e2e for `/import` with fixture links captured from the reader. An optional two-server e2e that runs the reader on 5556.
- **Legacy reader (`c:\src\alignos`):** dev port 5556, env-driven target origin and handoff mode, a small vendored envelope encoder, the modal and banner, and forwarding mode. Pushed and deployed only after `alignos.io` is live.
- **Ordering:** `/import` must ship with or before the `alignos.io` launch. The reader deploy follows DNS and TLS verification. Forwarding mode is a later env flip on the reader's Vercel project.
- **Depends on:** `scroll-memory-and-site-text-scale` being archived first, since its resume rules stay in force.
