## 1. Collections data

- [ ] 1.1 Create `data/collections.json` with `papers`, `return-room-readings`, `featured-writings`, `home-spotlight`; copy titles, intros, taglines, notes, and groups verbatim from `analysis/legacy-pages/` (papers.md, return-room.md, home.md)
- [ ] 1.2 Extend `build-lattice.js` to validate collections against catalog and `data/series.json` and emit `client/src/generated/collections.json` with resolved titles
- [ ] 1.3 Load collections in the app alongside the codex registry

## 2. Page content

- [ ] 2.1 Create `client/src/content/pages/` markdown for before-you-begin, return-room, between-worlds, papers, faq, arc-of-difference from the captures; preserve poetic line breaks; apply only the D6 deviations
- [ ] 2.2 Rewrite legacy PDF links to `/codex/{id}` (series → `/lattice?series={id}`); convert James' AI prompts to `prompt` fenced blocks; insert `collection` fenced blocks for Papers and Return Room readings
- [ ] 2.3 Add `prompt` and `collection` marked extensions in `client/src/lib/markdown.js` (pages only)

## 3. Views and components

- [ ] 3.1 `PageView.vue` loading page markdown via `?raw`, choosing `threshold` or `standard` layout from route meta, rendering a route-meta onward action
- [ ] 3.2 `PromptBlock.vue` (exact-text copy, hidden when clipboard API missing) and `CollectionList.vue` (Read + PDF actions, tagline/note, groups, series items, series position badge for members)
- [ ] 3.3 `HomeView.vue` with verbatim sections, `home-spotlight` and `featured-writings` from collections, Three Invitations to `/between-worlds`, `/return-room`, `/lattice`
- [ ] 3.4 Point the site-shell routes at `HomeView`/`PageView`; delete `FaqView.vue` and the pending view
- [ ] 3.5 Lattice: add collection options to the "Browse by" control (`?collection=`), collection-ordered grid with series items expanded to positioned members; mutual exclusion with `?series=`

## 4. Design pass

- [ ] 4.1 Kimi K3 (`kimi-k3-max`) visual pass within existing SCSS tokens: Home sections, threshold layout with spiral section markers, PromptBlock, CollectionList, Browse-by control

## 5. Verify

- [ ] 5.1 Script or manual diff: rendered text of each page vs its capture; only D6 deviations remain
- [ ] 5.2 Every content link resolves (no `wp-content` URLs, no 404 routes); PDFs open
- [ ] 5.3 `/lattice?collection=papers` shows the five Papers in order; `?collection=return-room-readings` expands Evolution of the Sovereign to its seven published codexes
- [ ] 5.4 Copy buttons copy exact prompt text; static HTML for each page contains its body
- [ ] 5.5 `openspec validate legacy-pages-and-collections --strict` passes
