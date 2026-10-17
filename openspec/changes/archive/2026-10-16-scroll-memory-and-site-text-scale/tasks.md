## 1. Phase 1: Shell scroll reset on every path change

- [x] 1.1 In `App.vue`, take `route` from the `RouterView` slot and key the routed component by `route.path`; keep the `after-leave` reset
- [x] 1.2 Update the `resetScroll` comment to match (runs on every path change; views that remember restore on mount)
- [x] 1.3 Manually confirm `/faq` → `/papers`, `/between-worlds` → `/arc-of-difference`, and lattice filter changes (query only) behave per the scroll-restoration spec

## 2. Phase 1: Codex resume rule

- [x] 2.1 Add `resumePosition(id)` to `readingProgress.js`: saved position when started and not complete, else 0
- [x] 2.2 In `ReaderView.vue`, replace the 100ms timeout restore: skip when `resumePosition` is 0; otherwise wait for rendered codex text plus the cover image settling (`complete` / `load` / `error`), capped around 2s, then scroll instantly
- [x] 2.3 Cancel a pending restore if the visitor scrolls, wheels, touches, or presses a key first
- [x] 2.4 Move scroll-listener removal to `onBeforeUnmount` so DOM removal can't record clamped progress
- [x] 2.5 Manually confirm codex → codex (next, edition, cross-reference) lands per the resume rule and records no progress for an unscrolled target

## 3. Phase 1: Lattice state store

- [x] 3.1 Create `client/src/stores/latticeState.js` (Pinia, persisted under `lattice-state`) with `scope`, `progress`, `scrollTop`; actions `setScope`, `setProgress`, `reset`, `saveScroll`; validate persisted values and fall back to defaults
- [x] 3.2 Export pure helpers `resolveArrival(urlScope, memory)`, `scopeFromQuery(query)` / `queryFromScope(scope)`, and `filterChangeScrollTarget({ scrollTop, dockTop })`
- [x] 3.3 Treat a remembered scope that no longer exists (unknown series or collection) as Everything
- [x] 3.4 Remove the legacy `lattice-position` key on store init

## 4. Phase 1: Lattice view wiring

- [x] 4.1 On mount, apply `resolveArrival` to the route query, then `router.replace` the query to mirror the store's scope
- [x] 4.2 Drive the scope dropdown, progress dropdown, `scopeLabel`, `browseValue`, and the corridor header "Show all codexes" buttons from the store (replace the local `activeFilter` ref and query-derived selection)
- [x] 4.3 Save scroll from a throttled passive listener on `.main-content`, attached on mount and removed in `onBeforeUnmount`; delete the dead `.container @scroll` handler and the old `onMounted` / `onUnmounted` localStorage code
- [x] 4.4 Restore `scrollTop` on mount after `nextTick` plus one animation frame
- [x] 4.5 Implement dock measurement (filter bar top relative to the scroll content) and apply `filterChangeScrollTarget` around every scope, progress, and reset change (capture docked state before, set scroll after `nextTick`)
- [x] 4.6 Set `--lattice-results-min` from `.main-content` `clientHeight` with a `ResizeObserver` (disconnect on unmount) and apply it as `min-height` on `.grid-section`
- [x] 4.7 Add the reset control after the progress dropdown: icon button, accessible name "Reset filters", shown only when scope isn't Everything or progress isn't Any progress; style it to match `.filter-toggle`

## 5. Phase 1: In-app scoped links

- [x] 5.1 Add `latticeState.primeLink(to, event)`: opens the linked scope on a plain left click (modified clicks open a new tab and arrive through the URL), no-op for non-lattice or unscoped targets. Used as `@click` on the existing `RouterLink`s instead of a wrapper component, because home and collection links share one `itemLink()` for series and codexes
- [x] 5.2 Prime with `primeLink`: the reader's series label and series context lines (`ReaderView.vue`)
- [x] 5.3 Prime with `primeLink`: the home page's featured series links (`HomeView.vue`)
- [x] 5.4 Prime with `primeLink`: series and collection links in `CollectionList.vue`, and prime internal `/lattice?…` links clicked inside page markdown (`PageView.vue`)
- [x] 5.5 `rg "name: 'lattice'"` and `rg "/lattice"` to confirm no scoped in-app link was missed; unscoped links stay plain `RouterLink`

## 6. Phase 2: Site-wide text size

- [x] 6.1 Add `html { font-size: calc(100% * var(--cl-reading-scale)); }` in `main.scss`
- [x] 6.2 Remove the `* var(--cl-reading-scale)` multipliers from `.codex-content` (`App.vue`), both `.page-prose` rules (`PageView.vue`), and `PromptBlock.vue`
- [x] 6.3 Check at text size 1.25 from 992px to 1280px wide that the header nav doesn't wrap or overflow; adjust header spacing or the collapse breakpoint if it does (it wrapped below 1200px: desktop nav labels now `nowrap`, with tighter link padding from 992px to 1199px; breakpoint unchanged)
- [x] 6.4 Check the lattice hero, filter bar, cards, reader header, glossary popover, search overlay, and footer at 0.9 and 1.25 for overflow or clipping

## 7. Phase 2: Site-wide body font

- [x] 7.1 Route the body font through `--cl-font-reading` (`$font-family-base` and the `body` rule in `main.scss`) and add `font-size-adjust: var(--cl-font-reading-adjust)` to `body`; emit `--cl-font-reading` and `--bs-font-serif` with `inspect()` so 'Source Sans 3' keeps its quotes (unquoted, it's an invalid family and the body fell back to Times New Roman)
- [x] 7.2 Add `font-size-adjust: none` to `h1`–`h6` and `.h1`–`.h6` globally
- [x] 7.3 Add `font-size-adjust: none` beside every `font-family: var(--bs-font-serif)` declaration (`rg "bs-font-serif"`; about 33 across 13 files)
- [x] 7.4 Remove `font-family: var(--cl-font-reading)` / `font-size-adjust` pairs that now only restate the inherited body value
- [x] 7.5 Confirm the `index.html` first-paint script still applies both variables before paint at the new site-wide reach (no change expected)

## 8. Phase 3: Unit tests (Vitest)

- [x] 8.1 `reading-progress.test.js`: `resumePosition` is 0 when never started, the saved position when started below 95, and 0 at or above 95 (including after scrolling back below 95)
- [x] 8.2 New `lattice-state.test.js`: defaults; persistence round-trip; invalid persisted values fall back; `setScope` resets progress and scroll; `reset` clears everything; legacy `lattice-position` key is removed
- [x] 8.3 `resolveArrival`: no URL scope keeps memory; equal scope keeps memory; different scope replaces it with Any progress and scroll 0; `series=none` and collections handled
- [x] 8.4 `scopeFromQuery` / `queryFromScope` round-trip, including `series=none` and an unknown id
- [x] 8.5 `filterChangeScrollTarget`: below the dock returns null; at the dock, 1px under it, and far past it return the dock top
- [x] 8.6 `reading-settings.test.js`: still passes unchanged (variables and storage contract untouched)

## 9. Phase 3: End-to-end tests (Playwright)

- [x] 9.1 Update "reading progress survives a reload" to scroll to about 50% (not the bottom) and expect the position restored
- [x] 9.2 Completed codex opens at the top: scroll to the bottom, navigate away, reopen, expect `scrollTop` 0
- [x] 9.3 Never-opened codex opens at the top after navigating from a scrolled page
- [x] 9.4 Codex → codex via next: target opens at the top and has no `codex-reading-progress` entry until scrolled
- [x] 9.5 Page → page: scroll `/faq`, click **Papers** in the header, expect `scrollTop` 0; repeat for two threshold pages
- [x] 9.6 Lattice memory: pick a series and Unread, scroll, open a codex, click **Codex Lattice** in the header; expect the same series, Unread, scroll position, and `?series=` in the URL
- [x] 9.7 Lattice memory survives reload
- [x] 9.8 Browser back to a scoped lattice restores the progress filter and scroll
- [x] 9.9 Reader series link resets: with the same series remembered as Complete and scrolled, click the reader's series label; expect Any progress at the top
- [x] 9.10 External-style deep link (`page.goto('/lattice?collection=…')`) with a different remembered scope shows that collection with Any progress at the top
- [x] 9.11 Reset control: hidden at defaults, shown when filtered, clears both filters and the URL scope when clicked
- [x] 9.12 Bar stability: dock the bar in Everything, pick a small series, then a progress filter with no matches; the bar's `getBoundingClientRect().top` is unchanged each time
- [x] 9.13 Bar stability when not docked: scroll partway into the hero, change the progress filter; `scrollTop` and the bar's top are unchanged
- [x] 9.14 Site-wide text size: set 1.25 through localStorage, reload; lattice hero subtitle, a card title, and a nav link are larger than at 1; codex body is 1.25× its default (not about 1.56×)
- [x] 9.15 Site-wide font: pick Atkinson; nav link and card text use Atkinson; an `h1` still uses Cormorant Garamond; heading font sizes match between Source Sans 3 and Georgia
- [x] 9.16 Default body font is Source Sans 3 (guards the quoting regression found during implementation)

## 10. Wrap-up

- [x] 10.1 Run `npm test` and `npm run test:e2e` from the repo root; both pass
- [x] 10.2 Run `openspec validate scroll-memory-and-site-text-scale --strict`
- [x] 10.3 Run `npm run build` (SSG) to confirm pre-rendering still works with the keyed view and the new store
