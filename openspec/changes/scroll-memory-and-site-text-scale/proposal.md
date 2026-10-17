## Why

Navigating between pages that share a view component (`/faq` → `/papers`, codex → codex) keeps the previous page's scroll position, because the global reset only runs when the transition swaps components. Scroll memory was also designed for the old flat 134-card lattice: it restores finished codexes to wherever the reader stopped, and the lattice keeps one position for every filter combination while forgetting the filters themselves. Separately, the reading-settings text size and font only reach codex and page prose, so a reader who needs larger type gets it in some places and not others.

## What Changes

Phase 1: scroll and lattice memory
- Every route change that changes the path starts at the top, including changes between two pages served by the same view.
- A codex resumes at its saved position only when it has been started and not completed (scroll percent < 95). Never-opened and completed codexes open at the top. **BREAKING** for readers who expect a finished codex to reopen at the end.
- The lattice remembers its scope (series or collection), progress filter, and scroll position together, and restores them however the visitor arrives (header, back button, reader links, home).
- A lattice URL that names a scope (`?series=`, `?collection=`) overwrites that memory: scope from the URL, progress filter reset to "Any progress", scroll at the top. In-app links that open a filtered lattice write the memory before navigating.
- The progress filter is persisted (today it resets on every visit).
- A reset control beside the filters appears whenever the scope is not "Everything" or the progress filter is not "Any progress". It clears both and shows the start of the results.
- Changing a filter never moves the sticky filter bar. If the bar is docked, the results scroll to their start under it; otherwise scroll is left alone. The results area keeps a minimum height so a short result list cannot force the bar to undock.

Phase 2: site-wide text size and font
- The text-size setting scales the whole site by scaling the root font size, not just prose. The existing per-component multipliers are removed so prose isn't scaled twice.
- The reading-font setting becomes the site's body font: everything that today inherits Source Sans 3 follows the setting. Headings keep the serif heading face, so the site still uses two families.
- The x-height adjustment that keeps fonts the same apparent size moves to the body, and headings opt out so the heading face doesn't change size.

Phase 3: tests
- Unit tests for the scroll policy, codex resume rule, and lattice memory store.
- Playwright tests for page-to-page reset, codex resume rules, lattice memory and reset, bar stability on filter change, and site-wide text size and font.

## Capabilities

### New Capabilities
- `scroll-restoration`: which scroll position each navigation lands on: top by default, codex resume rules, and same-view navigation.
- `lattice-memory`: persisted lattice scope, progress filter, and scroll position; how URLs and in-app links set them; the reset control; filter-bar stability on filter changes.

### Modified Capabilities
- `site-shell`: the Reading settings requirement changes so text size and font apply site-wide, not only to reading areas.
- `series-corridor-view`: the Lattice series filter requirement changes so a series deep link also sets the remembered lattice state, and clearing the filter is also reachable from the reset control.

## Impact

- `client/src/App.vue`: route-change scroll handling; `.main-content` remains the only scroller.
- `client/src/views/ReaderView.vue`: resume rule, restore after content loads, works when one codex replaces another.
- `client/src/views/CodexLattice.vue`: reads and writes the lattice memory store; reset control; docked-bar handling; results min-height. The unused `@scroll` handler and the `lattice-position` key go away.
- New `client/src/stores/latticeState.js` (Pinia, persisted to localStorage).
- Links into a filtered lattice: `ReaderView.vue`, `HomeView.vue`, `CollectionList.vue`.
- `client/src/stores/readingProgress.js`: a single "should resume" helper.
- `client/src/assets/scss/main.scss` and `_variables.scss`: root font size, body font variable, heading opt-out. Multipliers removed from `App.vue` (`.codex-content`), `PageView.vue`, `PromptBlock.vue`.
- `client/index.html` first-paint script: unchanged contract (`--cl-reading-scale`, `--cl-font-reading`), now with site-wide effect.
- Tests: `client/tests/unit/*`, `client/tests/e2e/*`. The existing "reading progress survives a reload" e2e test scrolls to 100% and must be updated.
- No new dependencies. External deep links (`llms.txt`, bundles, `pages/return-room.md`) keep working.
