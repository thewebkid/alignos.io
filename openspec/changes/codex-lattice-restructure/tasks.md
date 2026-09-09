## 1. Catalog merge (Grok)

- [x] 1.1 Write a merge script (or one-shot rewrite) that copies `tone_marker`, `structural_role`, `tags`, `description`, `entry_point`, and `pull_quote` from `data/composer-analysis.json` onto `data/codex-catalog.json`, matching by `seq` and asserting `id` equality
- [x] 1.2 Confirm seq 38 is `Open Trust` and seq 130 is `Field Attunement`; fail the merge if either still has the pre-v2 marker
- [x] 1.3 Normalize `cover.thumb_url` to `thumb/{id}.jpg` (singular `thumb/`, matching `cdn-config.js`); keep `cover.url` as `covers/{id}.jpg`
- [x] 1.4 Set `needs_review` to `false` for this draft (James approved as-is) and verify 134 unique ids/sequences

## 2. Asset rename and thumbnails (Grok)

- [x] 2.1 Add `scripts/rename-assets.js` that renames `client/public/md/`, `client/public/pdf/`, and `blobs/covers/` to `{catalogId}` using provenance + `old_cover_filename`; skip if destination exists; never touch `blobs/originals/`
- [x] 2.2 Run the rename script and report any missing sources (especially seq 71) without blocking the rest
- [x] 2.3 Add `sharp` (root or `client/`) and `scripts/generate-thumbs.js` writing `blobs/thumb/{id}.jpg` at 400×520, JPEG q80, progressive
- [x] 2.4 Run thumb generation for all renamed covers and confirm 134 outputs

## 3. Lattice build (Grok)

- [x] 3.1 Rewrite `client/scripts/build-lattice.js` to load the catalog in sequence order, read `client/public/md/{id}.md`, and stop using `LATTICE_URLS` / filename ids / cover `<img>` scraping for identity
- [x] 3.2 Map catalog snake_case into lattice camelCase (`toneMarker`, `structuralRole`, `entryPoint`, `pullQuote`, `tags`, `description`, `coverImage`, `coverThumb`, `titleOverlay`) plus existing body extracts (glossary, registry, special sections, wordCount, readingTime)
- [x] 3.3 Fail the build with the catalog id if markdown is missing; write `codex-lattice.json`, `codex-lattice-meta.json`, and `public/codex-content/{id}.json`
- [x] 3.4 Run the lattice build and spot-check a renamed id plus an unchanged id

## 4. Codex model and redirects (Grok)

- [x] 4.1 Populate `toneMarker`, `description`, `tags`, `structuralRole`, `entryPoint`, `pullQuote`, and `coverThumb` on the Codex constructor from lattice data
- [x] 4.2 Generate `vercel.json` redirects from provenance `id_change` rows (`/codex/{old}` → `/codex/{new}`, 301), keeping the SPA rewrite after them
- [x] 4.3 Point `cdnUrl.cover` / `thumb` / `pdf` at `{id}.jpg` / `{id}.pdf` (strip folder prefixes as today); leave `CDN_BASE` on Azure until Ron's prefix lands
- [x] 4.4 Update CodexCard/search img sources to prefer `coverThumb` when present

## 5. Overlay design (Kimi K3 — required subagent)

- [x] 5.1 Launch a Cursor Task subagent with `model: kimi-k3-max` (do not implement overlay visuals on Grok). If that slug is unavailable, stop and ask Ron — do not silently substitute another model
- [x] 5.2 Kimi inspects `CodexCard.vue`, `CodexGrid.vue`, `ReaderView.vue`, search covers, and sample `blobs/covers/` art, then decides title/subtitle/tone-marker placement at lattice, compact/search, and reader-hero sizes
- [x] 5.3 Kimi implements the overlay in Vue/SCSS (e.g. `CoverOverlay.vue`) so title is HTML, tone marker is visible at every size including small thumbs (not hover-only), and contrast holds on light and dark covers
- [x] 5.4 Kimi writes `openspec/changes/codex-lattice-restructure/overlay-decisions.md` recording the small-thumb rule and whether the below-card title stays or is dropped

## 6. Wire overlay and remaining surfaces (Grok)

- [x] 6.1 After Kimi returns, wire Codex fields into the overlay component; do not restyle Kimi's CSS unless a `cover-overlay` spec scenario fails
- [x] 6.2 Apply the overlay on reader hero (full cover) and search result thumbs using the same component
- [x] 6.3 Rebuild SSG paths for new ids and smoke `/codex/{newId}` plus a redirected `/codex/{oldId}`
- [x] 6.4 Confirm `/api/codex-lattice-meta` entries expose `toneMarker` and new ids only (no duplicate old-id rows)

## 7. CDN prefix and verification

- [ ] 7.1 After Ron uploads covers + thumbs and provides the blob prefix, update `CDN_BASE` / `VITE_BLOB_BASE_URL` only — no per-codex URL edits
- [x] 7.2 Verify lattice grid loads thumbs, reader loads full covers, PDFs download, overlay titles remain if an image 404s
- [x] 7.3 Leave `client/public/md/covers/` and `thumb/` in place for Ron to delete; do not `git rm` them in this change
