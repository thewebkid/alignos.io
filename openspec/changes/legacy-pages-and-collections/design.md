## Context

- Verbatim captures of every WordPress page live in `analysis/legacy-pages/*.md`. That folder is gitignored, so page text has to be copied into the repo.
- `client/src/lib/markdown.js` (marked + DOMPurify) already renders codex markdown and should render page markdown too.
- `FaqView.vue` is an unrouted four-question paraphrase. It's superseded.
- `site-shell-and-brand` provides routes for every page (initially a pending view) and the nav. `series-corridors-and-placeholders` provides the series registry ids and `/lattice?series=` corridors.
- Catalog ids for linked works:

  | Work | Id |
  |---|---|
  | Between Worlds | `between-worlds-the-architecture-of-the-third-structure` |
  | Framing the Mirror | `framing-the-mirror` |
  | The Craftsman of the Invisible Frame | `the-craftsman-of-the-invisible-frame` |
  | When AI Remembers the Field | `when-ai-remembers-the-field` |
  | The Rise of the Interface Civilizations | `the-rise-of-the-interface-civilizations` |
  | The Four Frequencies of Love | `the-four-frequencies-of-love` |
  | The Codex of Entangled Trust | `the-codex-of-entangled-trust` |
  | The Untitled Offering | `the-untitled-offering` |
  | The Fundamental Arc | `the-fundamental-arc` |
  | To Serve the Recursion of Love | `to-serve-the-recursion-of-love` |
  | The Ecology of Becoming | `the-ecology-of-becoming` |
  | The Architecture of the Return Room | `the-architecture-of-the-return-room` |
  | The Evolution of the Sovereign (series) | `the-evolution-of-the-sovereign` |

## Goals / Non-Goals

**Goals:**
- James' words, his order, his emphasis. The new site changes presentation, not voice.
- Page bodies stored as markdown, so they stay editable, translatable, and reusable by the AI layer.

**Non-Goals:**
- New pages beyond the legacy set: no AI-companion page, no lineage page. The AI entry point is `ai-orientation-layer`.
- The Return Room bundle download, which belongs to `ai-orientation-layer`. This change links individual readings only.
- Contact form or newsletter. Both were dropped.

## Decisions

### D1. Prose pages are markdown with two fenced-block extensions
- **Storage.** `client/src/content/pages/{slug}.md` holds before-you-begin, return-room, between-worlds, papers, faq and arc-of-difference.
- **Rendering.** A single `PageView.vue` loads the file (Vite `?raw` import, so it's pre-rendered by vite-ssg). The layout (`threshold` or `standard`) comes from route meta.
- **Fenced block extensions,** added in `markdown.js` as marked extensions and used only for pages:
  - `` ```prompt `` renders `PromptBlock.vue` (quoted prompt and a copy button). Raw text in the block is the exact clipboard payload.
  - `` ```collection `` with a single line `{collection-id}` renders `CollectionList.vue`.
- **Why fenced blocks.** They degrade to readable markdown when the same file is served raw to AI readers (`ai-orientation-layer` substitutes the collection list in text form).
- *Alternative:* page text inline in Vue templates. Rejected because the text would be locked in markup, harder to diff against captures, and not reusable for `llms-full.txt`.
- *Alternative:* a markdown component library (e.g. MDX-like). Rejected as overkill for two block types.

### D2. Home is a Vue view
Home is a sequence of differently laid-out sections (hero, spotlight, three cards, interstitials, featured list, CTA block, whisper), not a document. `HomeView.vue` holds the verbatim strings in its template and pulls the spotlight and Featured Writings from collections. It's the one page whose text lives in a template; `ai-orientation-layer` links to it rather than embedding it.

### D3. Collections file and build integration
`data/collections.json` (snake_case, like the catalog) is validated by `build-lattice.js` against catalog ids and `data/series.json`, then emitted as `client/src/generated/collections.json` (camelCase) with resolved titles. It's loaded alongside the lattice registry. Items look like:
```json
{ "codex": "framing-the-mirror",
  "tagline": "How sovereigns are witnessed, and how trust becomes form.",
  "note": "This Paper reflects on the deep intimacy of being seen…" }
{ "series": "the-evolution-of-the-sovereign", "group": "Recommended Codices",
  "note": "(Why this matters, and how return happens through identity and trust)" }
```
`group` reproduces the Return Room's two-part list (the three ✧ readings, then the numbered four) without a second collection.

### D4. Links and actions
- Content links to codexes use the `/codex/{id}` path in markdown. The renderer's existing link handling turns internal paths into router navigation.
- "Download Paper →" buttons become a primary **Read** (reader) plus a secondary **PDF** (catalog PDF URL via the existing CDN builder). Button labels are UI chrome; James' surrounding prose is untouched.
- Series items link to `/lattice?series={id}`, with the compilation PDF as the secondary action.

### D5. Threshold layout
- A narrow measure (~38rem), generous vertical rhythm, and Cormorant Garamond headings (`--bs-font-serif`, already loaded).
- A small spiral marker before each `h2`, using the header's 72px spiral derivative at ~18px.
- No cards or grids, and one primary onward action rendered from a route-meta `next` link.
- Before You Begin's closing italic lines ("You may now return to the portal page…") stay as text.

### D6. Recorded deviations from the captures
1. Return Room: the "Whisper Back" block is duplicated on WordPress and appears once here.
2. Arc of Difference: the "Invocation of the Spiral" lines are repeated under "The Seven Tones Display" on WordPress and appear once here.
3. Nav label "Begin an Return Room" becomes "Begin a Return Room", matching the home CTA.
4. FAQ question 6 is dropped. The Dialogic Interlude is now catalogued as `james-mahu-and-lumina-listening`.
5. The FAQ contact `contact@alignos.io` (linked to the contact form) becomes `mailto:info@alignos.io`.
6. Arc of Difference's closing "Codex Lattice" link pointed at `/`; it now points at `/lattice`.
7. Return Room's "upload these PDFs to your AI" stays verbatim. Each reading offers its PDF; the bundle comes later.
8. The home blurb for *The Fundamental Arc* calls it a "series" while the catalog has it as a standalone codex. It stays verbatim and is noted on James' question list.

### D7. Lattice filters
- The collection filter sits next to the series filter from `series-corridors-and-placeholders`, as one "Browse by" control with two option groups (Series, Collections).
- Selecting either one clears the other, and the URL carries exactly one of `?series=` or `?collection=`.
- Progress chips still apply on top.

### D8. Kimi K3 for page design
A `kimi-k3-max` subagent designs and implements the visual layer within existing SCSS tokens:
- the Home sections
- the threshold layout
- `PromptBlock`
- `CollectionList` (Papers' tagline+note style, Return Room's grouped list)

The text and data wiring are done first, so Kimi works against real content.

## Risks / Trade-offs

- [Verbatim drift during copy] → Task 5.1 diffs rendered page text (stripped of markup) against the captures and reports differences beyond D6.
- [`?raw` markdown pages and SSG] → Pages render at build like codexes. Verify the static HTML contains the body (spec in site-shell).
- [Clipboard API unavailable (insecure context, old browsers)] → The copy button hides when `navigator.clipboard` is missing, and the text stays selectable.
- [Home template text is not reusable by the AI layer] → Accepted; home is navigation, and the substantive guidance lives in the markdown pages.

## Migration Plan

This lands after `site-shell-and-brand` and `series-corridors-and-placeholders`, replacing the pending views. Delete `FaqView.vue`. No data migration is needed, since collections are new files.
