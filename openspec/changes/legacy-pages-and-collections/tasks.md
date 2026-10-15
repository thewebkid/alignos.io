## 1. Collections data

- [x] 1.1 Create `data/collections.json` with `papers`, `return-room-readings`, `featured-writings`, `home-spotlight`; copy titles, intros, taglines, notes, and groups verbatim from `analysis/legacy-pages/` (papers.md, return-room.md, home.md)
- [x] 1.2 Extend `build-lattice.js` to validate collections against catalog and `data/series.json` and emit `client/src/generated/collections.json` with resolved titles
- [x] 1.3 Load collections in the app alongside the codex registry

## 2. Page content

- [x] 2.1 Create `client/src/content/pages/` markdown for before-you-begin, return-room, between-worlds, papers, faq, arc-of-difference from the captures; preserve poetic line breaks; apply only the D6 deviations
- [x] 2.2 Rewrite legacy PDF links to `/codex/{id}` (series → `/lattice?series={id}`); convert James' AI prompts to `prompt` fenced blocks; insert `collection` fenced blocks for Papers and Return Room readings
- [x] 2.3 Parse `prompt` and `collection` fenced blocks into page segments in `client/src/lib/markdown.js` (pages only; D1)

## 3. Views and components

- [x] 3.1 `PageView.vue` loading page markdown via `?raw`, choosing `threshold` or `standard` layout from route meta, rendering a route-meta onward action
- [x] 3.2 `PromptBlock.vue` (exact-text copy, hidden when clipboard API missing) and `CollectionList.vue` (Read action, tagline/note, groups, series items, series position badge for members)
- [x] 3.3 `HomeView.vue` with verbatim sections, `home-spotlight` and `featured-writings` from collections, Three Invitations to `/between-worlds`, `/return-room`, `/lattice`
- [x] 3.4 Point the site-shell routes at `HomeView`/`PageView`; delete `FaqView.vue` and the pending view
- [x] 3.5 Lattice: add collection options to the "Browse by" control (`?collection=`), collection-ordered grid with series items expanded to positioned members; mutual exclusion with `?series=`

## 4. Design pass

- [x] 4.1 Kimi K3 (`kimi-k3-max`) visual pass by its own design judgment (new styles and theme changes allowed): Home sections, threshold layout, PromptBlock, CollectionList, Browse-by control
- [x] 4.2 Consolidate styles after the visual pass: move new values into the theme, remove duplication with existing SCSS, and confirm the reader app is unaffected or intentionally changed

## 5. Verify

- [x] 5.1 Script or manual diff: rendered text of each page vs its capture; only D6 deviations remain
- [x] 5.2 Every content link resolves (no `wp-content` URLs, no 404 routes); PDFs open
- [x] 5.3 `/lattice?collection=papers` shows the five Papers in order; `?collection=return-room-readings` expands Evolution of the Sovereign to its seven published codexes
- [x] 5.4 Copy buttons copy exact prompt text; static HTML for each page contains its body
- [x] 5.5 `openspec validate legacy-pages-and-collections --strict` passes

## 6. Read in the browser, not as PDFs

- [x] 6.1 Remove PDF prompts from page content: Between Worlds' "Download the full Codex:" lead and PDF action, Arc of Difference's "Click to download."
- [x] 6.2 Remove PDF actions from `CollectionList` and Home (spotlight, Featured Writings, Return Rooms section)
- [x] 6.3 `client/scripts/build-ai-layer.js`: collection bundles at `public/bundles/{id}.md`, run in `build:lattice`, git-ignored
- [x] 6.4 Return Room: "share these Codices with your AI" (D6.7)
- [x] 6.5 Return Room: one bundle download with the reading list
- [x] 6.6 Add D6.7 and D6.10 to James' question list
- [x] 6.7 Verify: page checker passes with the new deviations; no `.pdf` links in prerendered pages; bundle order matches the reading-bundles spec; reader PDF download still works
