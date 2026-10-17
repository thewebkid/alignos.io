## Context

See proposal.md for motivation and the specs for required behavior. Constraints that shape the approach:

- `.main-content` (in `App.vue`) is the only scroller. `.app-container` is `100vh` with `overflow: hidden`, so vue-router's `scrollBehavior` (which scrolls `window`) can't help.
- `App.vue` resets `.main-content.scrollTop` in the transition's `after-leave` hook. That hook only fires when the routed component changes. `PageView` serves six routes and `ReaderView` serves every codex, so navigating within either reuses the instance and skips the reset. `ReaderView` then keeps its scroll listener bound to the new codex.
- `ReaderView` restores `scrollPosition` 100ms after mount regardless of completion, and before late-loaded codex text or the cover image (which has no reserved size) is laid out.
- `CodexLattice` saves a single `lattice-position` key only in `onUnmounted`; its `@scroll` handler is bound to a non-scrolling `.container` and never fires. Scope lives only in the URL query; the progress filter is a local `ref`.
- The lattice filter bar is `position: sticky; top: 0` inside `.main-content`, below a hero whose height varies with viewport width and text size.
- Text size is `--cl-reading-scale`, multiplied into three rules (`.codex-content` in `App.vue`, `.page-prose` twice in `PageView.vue`, `PromptBlock.vue`). All 108 `font-size` declarations in the client use `rem`; none use `px`.
- Body font is compiled in (`$font-family-sans-serif` in `main.scss`). `--cl-font-reading` carries the reading-font setting; `index.html` applies both variables before first paint.
- Tests: Vitest in a `node` environment (`client/tests/unit`, stores tested with stubbed `window`/`document`/`localStorage`), Playwright against `npm run dev` on port 5555 (`client/tests/e2e`).

## Goals / Non-Goals

**Goals:**
- One plain scroll policy: views that remember (reader, lattice) restore on mount; everything else is at the top because the shell reset runs on every path change.
- The lattice reads one store and never infers intent from how it was reached, except one rule for URLs.
- Scroll decisions that can be pure functions are pure, so they can be unit tested without a DOM.

**Non-Goals:**
- Anchor/hash scrolling within pages.
- Per-scope lattice scroll memory (one remembered position is enough; scope changes start at the top).
- A separate "interface size" control, or changing the heading face.
- Re-styling components that look cramped at 1.25 beyond what's needed to keep them usable.

## Decisions

### 1. Key the routed view by path

`<RouterView v-slot="{ Component, route }">` renders `<component :is="Component" :key="route.path" />`. Every path change remounts the view, so the out-in transition runs, `after-leave` resets `.main-content` to 0, and the new view mounts fresh. Query-only changes keep the same key, so lattice filter changes don't remount.

This fixes `PageView` → `PageView` and codex → codex in one line. Remounting gives the reader a fresh `onMounted` restore and a fresh scroll listener, which removes the cross-codex progress leak with no extra code.

*Alternative:* a central `router.afterEach` scroll manager that knows each route's rule. Rejected for now: it would need to wait on view-specific readiness (codex text, cover image, lattice grid), which the views already know. Keying keeps the shell dumb and each view owning its own memory.

*Cost:* codex → codex now fades and re-renders instead of reusing the instance. That's a small cost, and the fade is consistent with every other navigation.

### 2. Reader resume rule and readiness

- `readingProgress` gains `resumePosition(id)`: the saved `scrollPosition` when `isStarted(id) && !isComplete(id)`, otherwise `0`. It's a pure lookup and unit tested.
- On mount, if `resumePosition` is 0, do nothing; the shell already reset to top.
- Otherwise restore once the page is ready: codex text rendered (`htmlContent` non-empty, then `nextTick`) **and** the cover image settled (`complete`, or its `load`/`error` event). Cap the wait (around 2s) so a slow image doesn't block restoration forever; restore with `behavior: 'instant'`.
- Attach the progress scroll listener on mount; detach it in `onBeforeUnmount`, not `onUnmounted`. When the old view's DOM is removed, the browser clamps `scrollTop`, and a still-attached listener would record that as progress.
- Scroll events queued by the transition (the shell's reset to 0) are dispatched after the new view mounts. So the progress handler never creates an entry at position 0 for a codex that hasn't been started.
- "Text rendered" is judged from the reactive loading flags (`isLoadingContent`, `contentLoadError`, `isContentLoaded()`), never by reading `htmlContent`: it depends on a non-reactive flag, so evaluating it mid-load caches an empty render.

*Alternative for the cover:* reserve its box with `aspect-ratio`. Covers don't share one ratio and the registry doesn't carry dimensions, so waiting for the image is simpler and exact.

### 3. Lattice state store with an "arrival" rule

New Pinia store `latticeState` (`client/src/stores/latticeState.js`), persisted to localStorage (key `lattice-state`), shaped:

```
{ scope: { kind: 'series' | 'collection', id } | null,   // null = Everything
  progress: 'all' | 'unread' | 'reading' | 'complete',
  scrollTop: number }
```

Actions: `openScope(scope)` starts a fresh view of a scope (progress `'all'`, `scrollTop` 0) for links and URL arrivals. `setScope(scope)` is the lattice's own scope menu and keeps the progress filter. Also `setProgress(p)`, `reset()`, `saveScroll(top)`, `arrive(urlScope)`, `primeLink(to, event)`, and `flush()`. Writes to localStorage are debounced, and `flush()` runs on unmount. Invalid persisted values fall back to defaults, matching `readingSettings`.

**Arrival rule**, a pure function `resolveArrival(urlScope, memory)` that is unit tested:

```
  urlScope absent           ─▶ memory unchanged (lattice mirrors memory.scope into the URL with router.replace)
  urlScope equals memory    ─▶ memory unchanged (this is what makes back/forward restore)
  urlScope differs          ─▶ setScope(urlScope)  (external links, and old history entries)
```

**In-app scoped links always reset.** This is Ron's "set state, then navigate". Links stay plain `RouterLink`s, so `:to` carries the query (real href for SSG, crawlers, open-in-new-tab), with `@click="lattice.primeLink(to, $event)"`. On a plain left click with a scoped lattice target, that calls `openScope` before navigation. When the lattice mounts, URL and memory already agree, so it just restores the freshly reset state. Used by the reader's series label and context lines, the home page's featured series, `CollectionList`, and internal links in page markdown. A wrapper component was dropped because home and collection links share one `itemLink()` for series and codexes; `primeLink` does nothing for reader targets.

The lattice's route watcher is guarded to `route.name === 'lattice'`, because the global route also changes on the way out, and mirroring would otherwise add `?series=` to the next page's URL.

*Why not mirror-free URLs:* dropping the query after arrival would break shareable corridor URLs and the existing deep-link spec. *Why not history `state` markers:* they persist in the history entry, so back would re-trigger the reset, which is exactly the "cute" inference this avoids.

**Lattice view wiring:**
- `scope`, `progress` and the scope label all come from the store. The dropdowns call store actions and then `router.replace` the mirrored query.
- Scroll: listen on `.main-content` (`passive`, throttled with requestAnimationFrame) and call `saveScroll`, attached on mount and detached in `onBeforeUnmount`, for the same clamping reason as the reader. Restore `scrollTop` on mount after `nextTick` plus one animation frame. The grid renders synchronously from registry metadata.
- The `lattice-position` key and the dead `.container @scroll` handler are removed. A one-time read of `lattice-position` isn't worth it; first visit after deploy starts at top.

### 4. Filter changes keep the bar still

Define **D** as the hero's bottom edge relative to the scroll content: `hero.getBoundingClientRect().bottom - main.getBoundingClientRect().top + main.scrollTop`, measured when needed. Measuring the bar itself doesn't work: a stuck sticky element reports where it's stuck, not where it docks. Hero height varies, so D is never hard-coded. The lattice also sets `overflow-anchor: none`, since Chrome's scroll anchoring otherwise nudges `scrollTop` by a pixel or two when the grid re-renders.

Pure function `filterChangeScrollTarget({ scrollTop, dockTop })`: returns `dockTop` if `scrollTop >= dockTop - 1` (docked), otherwise `null` (leave alone). On any scope, progress or reset change: compute docked state **before** the change, apply it, wait for `nextTick`, then set `scrollTop = D` if docked. The same helper serves the corridor header's "Show all codexes" button.

**Minimum results height.** `.grid-section` gets `min-height: var(--lattice-results-min)`, where the lattice sets `--lattice-results-min` to `.main-content`'s `clientHeight`, kept current by a `ResizeObserver`. That guarantees `scrollHeight - clientHeight >= D`, so the browser can never clamp a docked bar out of its dock, even for an empty result.

*Alternative:* `100dvh - header height`. It couples the lattice to the header's height and breaks if the header wraps at large text sizes. *Alternative:* CSS container units (`100cqh`) with `container-type: size` on `.main-content`. Rejected: size containment also applies layout containment, which turns `.main-content` into the containing block for `position: fixed` descendants (popovers, overlays, dropdown menus).

**Reset control:** a small icon button (accessible name "Reset filters") after the progress dropdown, `v-if` the scope isn't Everything or progress isn't `'all'`. Calls `latticeState.reset()`, mirrors the URL, and applies the docked rule.

### 5. Site-wide text size: scale the root

`html { font-size: calc(100% * var(--cl-reading-scale)); }` in `main.scss`. Every `rem` (all type, plus `rem` spacing) scales together, so it behaves like a text-focused zoom. Remove `* var(--cl-reading-scale)` from `.codex-content`, `.page-prose` (both rules), and `PromptBlock`, or those would compound (1.25² ≈ 1.56).

Media queries are unaffected (`rem` in media queries resolves against the browser's initial size), so Bootstrap's breakpoints don't shift. `px` sizes stay put: header logo heights, column `max-width: 720px`, borders.

*Alternative:* multiply each `font-size` by the variable through a Sass helper. That's precise but means about 108 edits, and every new component has to remember it. Rejected.

### 6. Site-wide body font with heading opt-out

- `$font-family-base: var(--cl-font-reading)` so Bootstrap's `--bs-body-font-family` and reboot follow the setting. Replace the compiled `font-family` on `body` in `main.scss` with the variable. Buttons and inputs already `inherit`.
- Emit the font variables with `inspect()`. Plain `#{}` interpolation strips the quotes, and an unquoted `Source Sans 3` is an invalid family name. The old hard-coded `body` font hid this: reading areas fell back to it. With `body` reading the variable, there's nothing to fall back to except Times New Roman.
- `body { font-size-adjust: var(--cl-font-reading-adjust); }` so the interface stays the same apparent size across reading fonts.
- Opt-out: `font-size-adjust: none` on `h1`–`h6`, `.h1`–`.h6`, and every rule that sets `font-family: var(--bs-font-serif)`. There are about 33 such declarations across 13 files (headings, card titles, the lattice hero, cover overlay, search). Each gets `font-size-adjust: none` beside the family, so the serif never inherits the sans adjustment.
- Existing `font-family: var(--cl-font-reading)` / `font-size-adjust` pairs in reading areas become redundant. Remove them where they only restate the inherited value, and keep any that override a serif parent.

## Risks / Trade-offs

- [The header nav at 1.25 may wrap or crowd between the `lg` breakpoint and wider widths] → Verify at 1.25 from 992px to 1280px; if needed, reduce nav gaps or font size inside the header, or move the collapse breakpoint to `xl`.
- [A serif element missed in the opt-out audit grows when the reading font changes] → An e2e test compares heading font sizes under Source Sans 3 and Georgia; check `rg "bs-font-serif"` during review.
- [Root scaling also enlarges `rem` padding and margins, so dense views hold less at 1.25] → Accepted; this is how accessible text zoom works. Cards and the reader column stay usable.
- [`:key` remount loses any in-memory state in `PageView` or `ReaderView` between same-view navigations] → None of it is meant to survive; the reading panel state lives in a store.
- [Codex restore waits on the cover image; on a very slow connection the jump comes late] → Cap the wait. The visitor sees the top of a codex they're mid-way through for at most the cap, and restore never happens after they start scrolling (cancel it on the first user scroll or wheel event).
- [Mismatched old history entries reset the remembered state (back to a corridor you later left)] → Accepted; the visitor explicitly navigated to that corridor's URL.
- [An external link to the remembered scope restores old progress and scroll instead of a clean view] → Accepted; it's the same view the visitor left, and the reset control is one click away.
- [`ResizeObserver` min-height leaves blank space under short result lists] → Accepted; the footer sits below it. This is what keeps the bar still.

## Migration Plan

Ship as one deploy. Rollback is a revert. Persisted data: `codex-reading-progress` is unchanged. `lattice-position` is ignored (it can be removed with `localStorage.removeItem` on store init). `lattice-state` is new. `alignos-reading` is unchanged; only its visual reach grows.
