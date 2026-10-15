## Why

James approved the v2 proposed-changes as-is and asked us to draft the site on that catalog. The live lattice still derives identity from markdown filenames and inlined cover `<img>` tags, while titles live baked into cover art that has already had text removed. We need one canonical catalog, kebab-case IDs, and HTML overlays so the draft site can ship the approved metadata instead of archaeological filenames.

## What Changes

- **Adopt** `data/codex-catalog.json` as the single source of truth for identity, titles, series, structural role, tone marker, tags, description, entry point, pull quote, cover/asset paths, and status. Merge `data/composer-analysis.json` (v2) into the catalog so James' "as-is" values — including the two mismatch resolutions and the new tone-marker vocabulary — are what the app reads.
- **Rebuild** `client/scripts/build-lattice.js` so generated lattice JSON is catalog-driven. Markdown stays content-only (no YAML frontmatter, no identity parsed from filenames). Registry/glossary/special sections may still be extracted from markdown bodies.
- **Rename in place** markdown, PDFs, and processed covers to `${newId}` using provenance. Generate grid-sized thumbnails. Leave unused `client/public/md/covers/` and `thumb/` for Ron to delete later.
- **Add** provenance-driven redirects in `vercel.json` from old IDs/URLs to new IDs.
- **Render** titles (and tone markers) as HTML/CSS overlays on text-free covers and thumbnails. Overlay layout — especially where tone markers live on small thumbs — is a design decision owned by Kimi K3, not guessed during the data work.
- **Extend** the Codex model and card/reader/search surfaces to consume catalog fields (`toneMarker`, `description`, `structuralRole`, `entryPoint`, `pullQuote`, overlay flags).
- **BREAKING**: Codex IDs and cover/PDF filenames change for any entry that had trailing-number or filename artifacts. Old reader URLs must redirect.

## Capabilities

### New Capabilities

- `codex-catalog`: Canonical catalog schema and merge of v2 analysis into the published lattice metadata.
- `lattice-build`: Catalog-driven lattice generation; markdown is content, not metadata.
- `asset-identity`: Rename md/pdf/covers/thumbs to new IDs; provenance redirects; CDN URL construction after Ron supplies the blob prefix.
- `cover-overlay`: HTML title (and tone-marker) overlays on covers and thumbnails at multiple sizes. Visual decisions are produced by a Kimi K3 design pass; Grok implements against that decision.

### Modified Capabilities

- _(none — no mainline `openspec/specs/` yet)_

## Impact

- **Data**: `data/codex-catalog.json`, `data/composer-analysis.json`, `data/codex-provenance.json`; generated `client/src/generated/codex-lattice.json` and `codex-lattice-meta.json`.
- **Build**: `client/scripts/build-lattice.js`; new rename/thumb scripts under `scripts/`.
- **App**: `client/src/lib/codex.js`, `cdn-config.js`, `CodexCard.vue`, `CodexGrid.vue`, `ReaderView.vue`, search surfaces, router params.
- **Hosting**: `vercel.json` redirects; `cdn-config.js` blob prefix (blocked on Ron's upload).
- **Agents**: Grok 4.6 high owns data roots, catalog merge, lattice build, asset rename, Codex model, redirects. Apply-time Task launches Kimi K3 (`kimi-k3-max`) for overlay typography and tone-marker placement, then Grok wires the decided UI.
- **Out of scope here**: James' four lattice views (series/tone/registry), branding/logo, missing-codex ingest, FAQ/legacy pages, blob-store vendor choice beyond accepting Ron's prefix.
