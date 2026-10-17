## Context

See proposal.md for motivation. The design depends on these facts:

- **Same storage on both sites.** The reader and alignos.io both persist progress in localStorage under `codex-reading-progress` as `{ [codexId]: { scrollPercent, scrollPosition, lastRead } }`. `scrollPercent` is an integer high-water mark from 0 to 100; `scrollPosition` is a raw pixel `scrollTop` of `.main-content`.
- **How the reader builds IDs.** A reader ID is the lowercased slug of its markdown filename (e.g. `the-codex-of-the-interbeing-lattice-42`), which is exactly the `old_value` form in `data/codex-provenance.json`. Checked against both content folders: of the 134 reader IDs, 28 are unchanged and 106 resolve through `id_change` records. None is left unmapped, no two collide, and no retired ID is a live ID. Four alignos.io codices have no reader counterpart.
- **The redirects already use provenance.** `scripts/generate-redirects.js` turns the same `id_change` records into the `/codex/<old>` 301s in `vercel.json`.
- **Theme storage matches.** Both sites store `alignos-theme` with values `light`, `dark`, or `system`.
- **Both dev servers use port 5555.** Both use `vite --host --port 5555`. alignos.io's Playwright config targets `http://127.0.0.1:5555`.
- **Boot order.** In alignos.io, `main.js` calls `injectAnalytics` during the ViteSSG client setup, before the router renders.
- **Who reads progress.** Consumers of `getScrollPercent` (0–100): `CodexCard`, `CodexGrid`, `CodexLattice` (filters and "continue reading"), `AppFooter` and `ReadingSettings` (stats). `ReaderView` keeps its own current-position percent for the progress bar and time remaining.
- **Cross-origin storage can't be pulled.** An alignos.io page cannot read the reader's storage. A cross-origin iframe gets its own partitioned storage in current Safari and Chrome. So the old origin has to start a top-level navigation itself.
- **Measured link sizes.** deflate-raw plus base64url gives about 530 characters for 10 codices, 1,450 for 40, and 4,360 for all 134.

## Goals / Non-Goals

**Goals:**
- One document format and one merge rule shared by the reader handoff, device-to-device carry, and any future sync or login.
- Keep all old-to-new knowledge (IDs and paths) in alignos.io. The reader sends raw IDs and its raw path.
- Make it testable end to end on one machine before anything is deployed.

**Non-Goals:**
- Continuous sync, sync codes, or accounts.
- Carrying reading settings (font, text scale, pace, glossary) or lattice view state. Only progress and theme travel.
- Resuming at an exact paragraph. Resuming at a fraction is accurate to about one paragraph's worth of reflow.
- Recovering progress that the browser has already deleted.

## Decisions

### Stored progress: fractions under the same key, normalized on load
Each entry becomes `{ furthest, position, lastRead }`. `furthest` and `position` are in [0, 1], rounded to 4 decimals (about 5px on a 50,000px codex), and `lastRead` is an ISO string. The storage key stays `codex-reading-progress`. On load, any entry that still has `scrollPercent` is normalized according to the reading-progress spec: `furthest = position = scrollPercent / 100`, and the pixel value is dropped.

- `updateProgress(id, fraction)` takes the current fraction. `ReaderView` computes it as `scrollTop / (scrollHeight - clientHeight)`, and the restore step multiplies the fraction back out after the existing content-and-cover wait.
- `resumePosition(id)` returns a fraction and keeps the rule: started and not complete.
- `getScrollPercent(id)` stays and returns `Math.round(furthest * 100)`, so the 0–100 consumers don't change. `recentlyRead` and `stats` derive from `furthest`.
- **Alternative: a new key (`…-v2`) plus a one-time migration.** Rejected. The normalizer has to exist anyway for reader imports, and reusing it on load covers local dev data and needs no migration flag.
- **Alternative: store paragraph anchors.** Rejected for now: more machinery in the renderer for a small gain in precision.

### Merge is a pure function
`mergeProgress(local, incoming) → result` applies the spec's rule: max of `furthest`, latest `lastRead`, and `position` from the more recent side. Ties on `lastRead` keep the larger `position`, so the result is deterministic whichever order the inputs come in. Both import and any future sync call this one function.

### Handoff document and encoding
```
{ kind: "alignos-progress", v: 1, src: "reader" | "alignos.io",
  lattice: "<diagnostic>", exportedAt: <epoch s>,
  theme?: "light" | "dark" | "system", to?: "/path",
  progress: { "<codexId>": [furthest, position | null, lastReadEpochSeconds] } }
```
- **Entries are tuples** rather than objects, to cut size. A `position` of `null` means "use `furthest`" (the reader can't convert its pixels, so it sends `null`).
- **Encoding:** `JSON → deflate-raw (CompressionStream) → base64url`, placed in the fragment as `#z=…`. Without `CompressionStream`, it's `#j=` followed by base64url JSON. Decoding accepts both.
- **`lattice`** is diagnostic only. The reader sends `"reader"`; alignos.io sends its lattice build stamp. ID resolution never branches on it; it goes through aliases (next decision).
- **Theme** is included only if the source has `alignos-theme` saved explicitly, so a default `system` never overrides a choice made on the receiving device.
- **Alternative: an ordinal or binary codec** (index into an append-only ID dictionary, packed numbers), which would get 138 codices to about 1.5KB. Rejected for v1: a committed dictionary to maintain, for a gain that only matters to the QR code (see below).

### Aliases generated at lattice build
`client/scripts/build-lattice.js` reads `../data/codex-provenance.json`, follows `id_change` chains to the end, and writes `src/generated/codex-aliases.json` (`{ retiredId: currentId }`). The build fails if an alias key is a current ID, or if a chain ends at no current codex. `resolveCodexId(id)` returns `id` if it is current, the alias if there is one, or `null` otherwise. Path resolution for `to` uses the same table: `/codex/<old>` becomes `/codex/<current>`. For `src: "reader"`, `/` maps to `/lattice` and `/about` maps to `/`. Anything not starting with exactly one `/` becomes `/lattice`.
- **Alternative: read `vercel.json` redirects at runtime.** Rejected: they're server configuration, not client data, and they mix in WordPress paths.
- **Alternative: let the reader map IDs before sending.** Rejected: the mapping would live in two repos.

### Taking the fragment before analytics
At the very top of the client setup in `main.js`, before `injectAnalytics`: if `location.pathname` is `/import` and the hash is `#z=` or `#j=`, save the raw hash in a module-level handoff slot and call `history.replaceState` to drop it. `ImportView` takes the slot (or a pasted link), decodes asynchronously, validates, resolves IDs, merges, applies the theme, and shows the summary. Because the fragment is gone before analytics or any component sees the URL, no page view records it, and reloading re-imports nothing.

### `/import` view
A prerendered static route. It has four states:
- **Decoding:** brief.
- **Welcome summary:** completed count, in-progress count, title of the most recently read codex, a "Continue reading" button to the resolved `to`, and a note if any entries were skipped.
- **Paste box:** shown when there's no fragment.
- **Unreadable:** says so plainly and links to the lattice.

A document with no progress calls `router.replace(to)` without showing the summary, so reader visitors with nothing to carry pass straight through.

### "Carry my reading" dialog
An action in `ReadingSettings.vue` next to the existing started/complete stats, opening a modal.
- The link is built when the modal opens, with the current route as `to`.
- **Share** uses `navigator.share({ url })` where available. **Copy** uses the Clipboard API, with a select-the-text fallback.
- **QR:** a small dependency-free encoder that outputs SVG, lazy-loaded only when the modal opens. The code is shown only if the link is no longer than 1,200 characters (comfortably scannable off a laptop screen at a medium error-correction level); otherwise the modal shows the "too long for a code" message.
- **Alternative: always use the compact binary codec to fit every QR.** Deferred; see above. Share and copy cover the heavy-reader case.

### Legacy reader (`c:\src\alignos`)
- **Configuration**, all baked in at build time:
  - `VITE_ALIGNOS_ORIGIN`: defaults to `https://alignos.io` in code. `client/.env.development` sets `http://localhost:5555`.
  - `VITE_HANDOFF_MODE`: `off`, `prompt`, or `forward`; defaults to `prompt` in code.

  A production build with no env vars set therefore does the right thing. A forgotten variable can never ship a localhost link, and variables that already exist in the environment take precedence over `.env` files (Vite's rule), which the two-server test relies on.
- **Dev port:** the dev script moves to `--port 5556`. A different port is a different origin, so local testing reproduces the production storage boundary.
- **Encoder:** `src/lib/handoff.js`, encode only, vendored with the format pinned by the alignos.io fixtures. It reads localStorage directly, so it also works in forward mode before Pinia exists.
- **Prompt mode:** a component mounted in `App.vue` and rendered only on the client after hydration (the reader is SSG).
  - First visit, i.e. no `alignos-handoff-prompted` in localStorage: show the dialog and set the flag when it's shown.
  - Later visits: show the banner above `<RouterView>` unless `alignos-handoff-banner-hidden` is in sessionStorage.
  - The link is rebuilt on every route change, so the action is a plain `<a href>`. No async work happens on tap, which matters for iOS.
- **Forward mode:** in the ViteSSG client setup, build the link for `location.pathname` and call `location.replace` before the app mounts.
- **Never an edge redirect** (per the spec). Forward mode is still the SPA, which does the work in the client.

### Testing
- **Unit (vitest, alignos.io):**
  - normalizer, merge (properties: idempotent, order-independent, never lowers)
  - encode/decode round trip, including the `#j=` fallback
  - validation and clamping
  - `resolveCodexId` against a committed fixture of all 134 reader IDs (every one resolves)
  - `to` path resolution, including foreign paths
  - the alias build check
- **E2E (Playwright, alignos.io, default suite):** opening `/import` with committed fixture links captured from the reader's encoder. Checks the merge in localStorage, the fragment being stripped, the summary, "Continue reading" landing and resume, theme precedence, the paste box, a damaged link, and the carry dialog (copy link, QR shown/hidden by size).
- **Two-site E2E (opt-in):** `playwright.handoff.config.js` starts both servers. alignos.io runs on 5555. The reader runs from `READER_DIR` (default `../../alignos/client`) on 5556, with `VITE_ALIGNOS_ORIGIN=http://127.0.0.1:5555`. The test seeds reader localStorage, taps the dialog's button, and checks alignos.io. It's run by `npm run test:e2e:handoff` and isn't part of `test:e2e`, so CI never needs the other repo.

## Risks / Trade-offs

- **[Testing on `localhost` versus `127.0.0.1`]** These are different origins with separate storage. Mitigation: the reader's `.env.development` uses `localhost`, so manual checks happen on `http://localhost:5555`; the two-site e2e overrides to `127.0.0.1` to match Playwright.
- **[Safari deletes script-written storage after 7 days without interaction with a site]** Some reader visitors may already have lost their progress, and the same applies to alignos.io from now on. Mitigation: none for what's already gone. The carry link is a user-held backup, and this is the strongest argument for sync or login later.
- **[In-app browsers]** Links opened inside Instagram, Gmail, and similar apps use their own storage, so progress lands there. Mitigation: the arrival summary makes the result visible. The modal copy can suggest opening in the browser they normally read in.
- **[Heavy readers can't use the QR code]** Mitigation: share and copy always work; the compact codec is a contained follow-up if it matters.
- **[Format drift between the vendored encoder and alignos.io]** Mitigation: committed fixture links produced by the reader's encoder are decoded in alignos.io tests, and the two-site e2e exercises the real code.
- **[A crafted or forwarded link marks someone else's codices as read]** Impact is low: merges never lower progress, and every value is validated and clamped.
- **[Fraction resume is approximate after reflow]** Accepted. It's far better than pixels, and the spec allows for reflow.
- **[A progress consumer reads a fraction as a percent, so a bar or filter is silently wrong]** Mitigation: `getScrollPercent` keeps its 0–100 contract, and the store's unit tests pin it.

## Migration Plan

1. Archive `scroll-memory-and-site-text-scale`, so the resume rules this change relies on are in the main specs.
2. Build the alignos.io side (store, aliases, envelope, `/import`, carry dialog) and ship it with or before the launch deploy. Pasting a fixture link works on the omega preview to smoke-test it.
3. Build the reader side on a local branch of `c:\src\alignos`. Test it against alignos.io locally (manually on `localhost:5556` → `localhost:5555`, and through the two-site e2e).
4. Do the DNS cut. Verify `https://alignos.io/import` with a fixture link and check that www returns a 308 to the apex.
5. Push the reader to `main` and deploy on Vercel with no env vars; it defaults to prompt mode and `https://alignos.io`. Open the deployed reader with seeded storage, tap through, and confirm the progress arrives.
6. Later, set `VITE_HANDOFF_MODE=forward` on the reader's Vercel project and redeploy.

Rollback: alignos.io's parts are additive; a broken `/import` can be reverted without touching anyone's stored progress. On the reader, set `VITE_HANDOFF_MODE=off` and redeploy, or revert the commit.

## Open Questions

- Final wording for the reader dialog, the banner, and the arrival summary (James to review for voice).
- How long to stay in prompt mode before switching to forward. The reader's returning-visitor numbers should show when the tail has thinned.
