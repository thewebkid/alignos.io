## Why

The WordPress pages carry James' framing of Alignos (the Three Invitations, Before You Begin, the Return Room practice, the FAQ prompts, the Papers introduction), and they disappear when alignos.io moves to this app. Much of that framing is curated lists: Papers, the Return Room's recommended codexes, Featured Writings. Holding them as data lets the same lists drive the pages, the lattice, and AI readers.

## What Changes

- Add the pages the new nav points to, with James' text carried over verbatim from the captured WordPress pages:
  - **Home** (`/`): hero, latest-codex spotlight, Three Invitations (Story → Between Worlds, Sanctuary → Return Room, Library → Codex Lattice), Featured Writings, the Return Rooms section, Closing Whisper.
  - **Before You Begin…** (`/before-you-begin`): threshold layout.
  - **Begin a Return Room** (`/return-room`): orientation, recommended readings, covenant, conversation starters, Whisper Back, final invitation.
  - **Between Worlds** (`/between-worlds`): threshold layout, leads into the paper.
  - **Papers** (`/papers`): introduction, the five Papers with James' per-paper notes, closing quote.
  - **FAQ** (`/faq`): questions 1–5 of the live FAQ. Question 6 (the forthcoming Dialogic Interlude) is dropped because that work is now in the lattice. The contact line uses `info@alignos.io`.
  - **The Arc of Difference** (`/arc-of-difference`): threshold layout.
- Add a **threshold layout**: one narrow column, small spiral section markers, no grid or sidebar, a single way forward.
- Rewrite links that pointed at WordPress PDFs so they open the codex in the reader (`/codex/{id}`), with the PDF offered alongside.
- Render James' AI prompts (FAQ, Return Room) as copyable prompt blocks.
- Add **collections** (`data/collections.json`): curated, ordered lists of codexes or series, each item carrying James' own note from the legacy page. Initial collections:
  - `papers` (registry name "Harmonic Topical Papers")
  - `return-room-readings`
  - `featured-writings`
  - `home-spotlight` (The Ecology of Becoming)
- Lattice gains a collection filter (`/lattice?collection=papers`), so every Paper is browsable in the lattice as well as on its own page.
- Remove legacy WordPress page artifacts: duplicated blocks (Return Room "Whisper Back", Arc of Difference "Invocation"), the "Begin an Return Room" typo in nav labels, and the old `FaqView.vue` paraphrase stub.

## Capabilities

### New Capabilities
- `site-pages`: The home and legacy pages, their verbatim-content rules, the threshold layout, link rewriting, and copyable prompts.
- `codex-collections`: Curated collections as data, their rendering on pages, and the lattice collection filter.

### Modified Capabilities
<!-- None. Routes and nav are defined in site-shell (site-shell-and-brand); series ids come from series-registry (series-corridors-and-placeholders). -->

## Impact

- New `client/src/content/pages/*.md` (verbatim page bodies), `HomeView.vue`, a page view + threshold layout, `PromptBlock` and collection-list components; replaces the pending views from `site-shell-and-brand` and the unrouted `FaqView.vue`.
- New `data/collections.json` → generated `client/src/generated/collections.json` (validated against catalog and series registry in `build-lattice.js`).
- `CodexLattice.vue` gains a collection filter alongside the series filter.
- Depends on `site-shell-and-brand` (routes, nav) and `series-corridors-and-placeholders` (series ids, corridor deep links).
- Page markdown is reused by `ai-orientation-layer` for `llms-full.txt`.
