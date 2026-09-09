## Context

See `proposal.md` for why. Today `client/scripts/build-lattice.js` walks `client/public/md/`, derives ids from filenames, and scrapes cover paths from inlined `<img>` tags. The Codex class already declares `toneMarker` / `description` / `tags` but does not populate them. Covers on Azure still use original filenames; processed text-free JPGs live in `blobs/covers/` with those same original names. `data/codex-catalog.json` exists but still holds v1 tone markers; `data/composer-analysis.json` is the v2 payload James approved.

The apply agent for this change is Grok 4.6 high. Overlay typography and tone-marker placement — especially on small thumbs — is intentionally not decided here; it is a Kimi K3 design pass launched from the task list.

## Goals / Non-Goals

**Goals:**
- Merge v2 analysis into the catalog and make the lattice build catalog-driven.
- Rename md/pdf/covers to catalog ids; generate grid-sized thumbs; keep old URLs working.
- Give CodexCard / reader / search a data contract for HTML overlays without guessing the visual system.
- Encode an apply-time split: Grok does data and wiring; Kimi designs and implements overlay UI.

**Non-Goals:**
- James' four browse views (series / tone / registry), branding, missing-codex ingest, FAQ/legacy pages.
- Choosing Azure vs Vercel Blob. Ron uploads and returns a prefix; we swap `CDN_BASE`.
- Deleting `client/public/md/covers/` and `thumb/` (unused; Ron deletes later).
- Per-codex `titleColor` / `subtitleColor` until Kimi says they are needed.

## Decisions

### Decision 1: Catalog merge overwrites v1 editorial fields

**Choice**: A one-shot merge script (or in-place rewrite of `data/codex-catalog.json`) copies from `composer-analysis.json` by `id`/`seq`: `tone_marker`, `structural_role`, `tags`, `description`, `entry_point`, `pull_quote`. Provenance, assets, metrics, and ids stay as catalog/provenance already computed. `needs_review` can drop to `false` for this draft — James said as-is.

**Why over keeping both files at runtime**: The app should have one object graph. Composer-analysis remains an audit artifact; the catalog is what build-lattice reads.

**Alternative considered**: Teach build-lattice to join catalog + composer at generate time. Rejected — two sources of truth during every build. Merge once, then catalog is canonical.

### Decision 2: build-lattice reads catalog, then markdown by id

**Choice**: Replace filename-walk + `LATTICE_URLS` sequence with: load catalog (sorted by `sequence`) → for each entry read `client/public/md/{id}.md` (after rename) → extract body features only (glossary, registry, special sections, word count) → write `codex-lattice.json`, `codex-lattice-meta.json`, and `public/codex-content/{id}.json`.

Published lattice field names stay camelCase to match the existing Codex constructor (`coverImage`, `toneMarker`, `wordCount`, `readingTime`). Catalog remains snake_case on disk.

**Why over YAML frontmatter**: Ron's constraint — markdown stays content-only; catalog is SSOT.

**Alternative considered**: Keep `LATTICE_URLS` as sequence source. Rejected — sequence already lives on the catalog.

**Missing markdown**: Fail the build with the catalog id listed. Do not skip silently.

### Decision 3: Rename in place from provenance, thumbs via sharp

**Choice**: `scripts/rename-assets.js` uses provenance `id_change` / `cover_rename` (and catalog `old_cover_filename`) to rename:
- `client/public/md/{old}.md` → `{newId}.md`
- `client/public/pdf/{old}.pdf` → `{newId}.pdf`
- `blobs/covers/{oldCover}` → `{newId}.jpg`

Then `scripts/generate-thumbs.js` (sharp) writes `blobs/thumb/{id}.jpg` at **400×520**, JPEG q80, progressive — the size previously recommended because old thumbs were too small and the grid loaded full covers.

CDN path segment stays **`thumb/`** (singular, matches `cdn-config.js` and Azure). Catalog `cover.thumb_url` currently says `thumbs/`; fix it to `thumb/` during merge.

**Idempotent**: Skip if destination exists and source is gone. Never touch `blobs/originals/`.

**Blob prefix**: After Ron uploads, set `CDN_BASE` (or `VITE_BLOB_BASE_URL`) once. Overlay work MUST NOT wait on the prefix — local/staging can keep pointing at Azure until the rename+upload lands.

### Decision 4: Redirects from provenance into vercel.json

**Choice**: Generate a redirects fragment from provenance `id_change` rows: `/codex/{old_id}` → `/codex/{new_id}` (301). Check `cleanUrls` so we do not also need `.html` variants. Catch-all SPA rewrite stays after redirects.

**Why over in-app alias map**: Bookmarks and `curl` of old URLs should 301 before the SPA boots.

**Alternative considered**: Dual-id lattice rows. Rejected — search, SSG paths, and cards would duplicate.

Also regenerate SSG paths for new ids (`vite-ssg` / router). Old static files on CDN are harmless.

### Decision 5: Agent split — Grok for data, Kimi for overlay design

**Choice**: The applying agent (Grok 4.6 high) implements catalog, lattice build, rename, thumbs, Codex model, redirects, and CDN wiring. When overlay UI work begins, that agent **MUST** launch a Cursor `Task` subagent with `model: kimi-k3-max` (Kimi K3). Do not have Grok invent overlay layout.

Kimi's brief (also copied into `tasks.md`):

- Inspect `CodexCard.vue`, `CodexGrid.vue`, `ReaderView.vue`, search result covers, and a sample of text-free covers in `blobs/covers/`.
- Decide where **title**, **subtitle** (when present), and **tone marker** live at three sizes: lattice card, compact/search thumb, reader hero.
- Especially: small thumbs. Options include edge chip, bottom scrim line, hover-only, initials+marker, or replacing the below-card title. Pick one system and implement it.
- Constraints Kimi cannot violate: title is HTML; tone marker is visible at every size (not hover-only on small thumbs); readable contrast on light and dark covers; data comes from Codex fields Grok will populate (`title`, `subtitle`, `toneMarker`). Prefer CSS variables so light/dark theme can inherit.
- Output: implement the overlay in Vue/SCSS (new component such as `CoverOverlay.vue` is fine) **and** write `openspec/changes/codex-lattice-restructure/overlay-decisions.md` recording the placement rules so Grok does not restyle it.

Grok after Kimi returns: wire catalog fields into the component, point grid `<img>` at thumbs, verify reader/search, do not restyle Kimi's overlay unless a spec is violated.

**Why Kimi for this**: Overlay composition is visual/typographic and the open question (tone markers on small thumbs) is exactly what we do not want Grok to guess. Kimi K3 is available as `kimi-k3-max`.

**Alternative considered**: Grok implements a generic bottom-gradient overlay now, Kimi later. Rejected — Ron asked to plan the spin-up; a placeholder overlay would bake in the wrong small-thumb decision.

**Alternative considered**: Kimi only writes a markdown mock, Grok codes it. Weaker — Kimi should own the CSS it is judging.

### Decision 6: Overlay data contract (Grok), visual system (Kimi)

Until Kimi lands, Grok still extends the Codex constructor:

| Catalog (snake) | Codex / lattice (camel) |
|---|---|
| `tone_marker` | `toneMarker` |
| `structural_role` | `structuralRole` |
| `entry_point` | `entryPoint` |
| `pull_quote` | `pullQuote` |
| `tags` | `tags` |
| `description` | `description` |
| `cover.thumb_url` | `coverThumb` (or equivalent) |
| `cover.title_overlay` | `titleOverlay` (boolean, default true) |

Grid uses `coverThumb` when set, else `coverImage`. Reader hero may keep full `coverImage`.

`cdnUrl.cover` / `cdnUrl.thumb` / `cdnUrl.pdf` take a basename or `{id}.jpg` and strip any `covers/` / `thumb/` prefix as they do today.

## Risks / Trade-offs

- **[Risk] Catalog vs composer id drift** → Mitigation: merge by `seq` with id assertion; fail if `composer.id !== catalog.id`.
- **[Risk] Seq 71 still has the wrong cover art** → Mitigation: rename whatever file we have; do not block the draft. Note in overlay-decisions if the image is obviously the InterBeing glossary.
- **[Risk] Blob prefix arrives mid-change** → Mitigation: CDN base is one constant. Rename locally first; upload is Ron's; then flip the constant.
- **[Risk] Kimi overlay fights existing card chrome** → Mitigation: spec allows dropping the duplicate below-card title. Kimi documents the choice. Grok does not add the title back.
- **[Risk] `kimi-k3-max` unavailable in a later session** → Mitigation: tasks name the slug; if the Task call fails, stop and ask Ron rather than silently having Grok design the overlay.
- **[Risk] SSG still emits old `/codex/{oldId}` HTML** → Mitigation: build after rename; redirects cover leftover inbound links.
- **[Trade-off] 62 tone markers vs original 29** → Accepted; James approved as-is. No grouping UI in this change.

## Migration Plan

1. Merge composer-analysis into catalog (commit data).
2. Rename md/pdf/covers; generate thumbs; update provenance if any rename was missing.
3. Point build-lattice at catalog; extend Codex; generate lattice.
4. Add vercel redirects from provenance.
5. Launch Kimi overlay pass; Grok wires fields.
6. Ron uploads `blobs/covers/` + `blobs/thumb/`; we set CDN prefix.
7. Smoke lattice, reader (old and new id), search thumbs, API.

Rollback: revert the change branch. Azure still has old-named covers until we delete them; redirects can be removed with the revert.

## Open Questions

- Exact blob prefix and whether PDFs move in the same upload — Ron, after upload. Does not change specs or tasks beyond one config edit.
- Whether seq 71's replacement cover arrives before draft — out of band; do not block.
