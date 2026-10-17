## 1. Prerequisites

- [x] 1.1 Archive `scroll-memory-and-site-text-scale` so `scroll-restoration` exists in `openspec/specs`
- [x] 1.2 Commit a fixture of all 134 reader codex IDs (generated with the reader's `generateId` from `c:\src\alignos\client\public\md`) at `client/tests/fixtures/handoff/reader-ids.json`

## 2. Progress as fractions (alignos.io)

- [x] 2.1 Change `stores/readingProgress.js` to `{ furthest, position, lastRead }` fractions, rounded to 4 decimals; `updateProgress(id, fraction)`; `resumePosition` returns a fraction; `getScrollPercent`, `recentlyRead`, and `stats` derive from `furthest` and keep their 0–100 contract
- [x] 2.2 Normalize earlier-shape and malformed entries on load (spec: Older saved progress is normalized)
- [x] 2.3 Add a pure `mergeProgress(local, incoming)` with the tie rule from design.md
- [x] 2.4 Update `ReaderView.vue` to record the current fraction and restore by multiplying it against the scrollable length after the content-and-cover wait
- [x] 2.5 Check every `getScrollPercent` / `recentlyRead` consumer (`CodexCard`, `CodexGrid`, `CodexLattice`, `AppFooter`, `ReadingSettings`) still shows the right values
- [x] 2.6 Rewrite `tests/unit/reading-progress.test.js` for fractions; add tests for normalization and for merge (idempotent, order-independent, never lowers)
- [x] 2.7 Add an e2e scenario: leave a codex halfway, change text scale, reopen, and land halfway

## 3. Codex aliases (alignos.io build)

- [x] 3.1 In `client/scripts/build-lattice.js`, generate `src/generated/codex-aliases.json` from `data/codex-provenance.json`, following `id_change` chains to the end
- [x] 3.2 Fail the build when an alias key is a current ID or a chain ends at no current codex, naming the ID
- [x] 3.3 Add `resolveCodexId(id)` and `resolveHandoffPath(path, src)` (codex paths through aliases; reader `/` becomes `/lattice` and `/about` becomes `/`; anything not starting with exactly one `/` becomes `/lattice`)
- [x] 3.4 Unit tests: all 134 fixture reader IDs resolve; unchanged IDs map to themselves; unknown IDs give `null`; path mapping including `//example.com/x`; the build check on a synthetic reused ID

## 4. Handoff document (alignos.io)

- [x] 4.1 Add `src/lib/handoff/envelope.js`: build a document from store state, encode as `#z=` (deflate-raw + base64url) with a `#j=` fallback, decode either, and validate (kind, version, clamped 0–1 values, skip bad entries)
- [x] 4.2 Unit tests: round trip in both encodings, unknown version rejected, truncated input rejected, out-of-range values clamped, `position: null` handled
- [x] 4.3 Capture fixture links from the reader's encoder (after 6.3) into `client/tests/fixtures/handoff/` and add a test that decodes them

## 5. Arrival at `/import` (alignos.io)

- [x] 5.1 In `main.js` client setup, before `injectAnalytics`: on `/import` with a `#z=` or `#j=` hash, save the raw hash in a handoff slot and strip it with `history.replaceState`
- [x] 5.2 Add the `/import` route and `ImportView.vue` with its decoding, summary, paste, and unreadable states
- [x] 5.3 Wire import: decode, resolve IDs, `mergeProgress`, apply the theme only when `alignos-theme` is not saved, count skipped entries
- [x] 5.4 Summary: completed and in-progress counts, title of the most recently read codex, a skipped-entries note; "Continue reading" goes to the resolved `to`. With no progress, `router.replace(to)` straight away
- [x] 5.5 Paste box: accept a full handoff link or just its fragment; same flow as following it
- [x] 5.6 E2E with fixture links: merge lands in localStorage, the address bar has no fragment, reload re-imports nothing, theme precedence, continue-and-resume, no-progress pass-through, damaged link, paste

## 6. Carry my reading (alignos.io)

- [x] 6.1 Add a "Carry my reading" action to `ReadingSettings.vue` next to the started/complete stats
- [x] 6.2 Add the carry modal: the link built on open with the current route as `to`; codex count; share (`navigator.share`) when available; copy with a fallback; the "nothing to carry yet" state
- [x] 6.3 Add a lazy-loaded SVG QR encoder; show the code only when the link is no longer than 1,200 characters, otherwise show the "too long for a code" message
- [x] 6.4 E2E: copy-link output decodes to the device's progress; QR shown for small progress and hidden for large; empty state

## 7. Legacy reader handoff (`c:\src\alignos`, local branch only until go-live)

- [x] 7.1 Change the dev script to `--port 5556`
- [x] 7.2 Add config reading `VITE_ALIGNOS_ORIGIN` (default `https://alignos.io`) and `VITE_HANDOFF_MODE` (default `prompt`); add `client/.env.development` with `VITE_ALIGNOS_ORIGIN=http://localhost:5555`
- [x] 7.3 Add `src/lib/handoff.js`: read localStorage directly and encode a `src: "reader"` document (tuples with `position: null`, theme only when saved, `to` = current path) in the same format as alignos.io
- [x] 7.4 Add the client-only handoff component in `App.vue`: the first-visit dialog with read/completed counts (or the no-progress wording), the `alignos-handoff-prompted` flag, the session-dismissible banner above `<RouterView>`, and the link rebuilt on route change and rendered as a plain `<a href>`
- [x] 7.5 Forward mode: in the ViteSSG client setup, `location.replace` the handoff link for the current path before mount
- [x] 7.6 Verify an `off`-mode build renders no handoff UI, and a production build with no env vars links to `https://alignos.io`

## 8. Two-site testing

- [x] 8.1 Add `client/playwright.handoff.config.js` running alignos.io on 5555 and the reader from `READER_DIR` (default `../../alignos/client`) on 5556 (prompt) and 5557 (forward), all on `localhost` so a running reader dev server can be reused; add `npm run test:e2e:handoff`
- [x] 8.2 Two-site e2e: seed reader progress for old IDs, accept the dialog, assert merged progress and landing on alignos.io; repeat after more reader reading to confirm nothing is lowered; forward mode from `/codex/bridge-between-chords-63`
- [ ] 8.3 Manual pass on real devices: phone and desktop, reader on `localhost:5556` to alignos.io on `localhost:5555` (LAN host for the phone), plus carry from phone to laptop via share and from laptop to phone via QR

## 9. Docs and launch

- [x] 9.1 Update `README.md` (and `PRERENDERING-SUMMARY.md` if the route list is documented there) with `/import`, the alias build output, and the two-site test command
- [ ] 9.2 Get the final copy for the reader dialog, the banner, and the arrival summary reviewed by James
- [ ] 9.3 Ship the alignos.io side with the launch deploy; after the DNS cut, verify `https://alignos.io/import` with a fixture link and the www 308 to the apex
- [ ] 9.4 Push the reader to `main`, deploy with no env vars, and verify a seeded handoff from the live reader arrives on `https://alignos.io`
- [ ] 9.5 Later: set `VITE_HANDOFF_MODE=forward` on the reader's Vercel project and redeploy
