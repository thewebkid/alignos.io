## Why

Four published James Mahu works are on the live alignos.io but missing from the lattice: Papers 4 and 5 from the Papers page, The Architecture of the Return Room (linked from the home page), and The Ecology of Becoming (sent by James on 2026-09-08 and featured on the live home page). Until they are in the catalog, every later conversation about nav, papers, tone views, and Return Rooms is reasoning over an incomplete geometry. This change is a prerequisite for the site-organization specs that follow.

## What Changes

- **Convert** four PDFs to content-only markdown in `client/public/md/{id}.md`, matching the existing corpus conventions (no frontmatter, no inlined cover image). Evaluate `C:\src\pyscripts\pdf_to_md.py` (the `pdf-to-markdown` skill) on these codex PDFs and record how well it performs.
- **Add** four catalog entries to `data/codex-catalog.json`, appended at sequences 136–139 (placement within the sequence is revisited later):
  - `when-ai-remembers-the-field` (Paper 4)
  - `the-rise-of-the-interface-civilizations` (Paper 5)
  - `the-architecture-of-the-return-room`
  - `the-ecology-of-becoming`
- **Label AI-drafted metadata as hypothesis.** Fields not authored by James (`tone_marker`, `structural_role`, `tags`, `description`, `entry_point`) are drafted by the ingest agent, set `needs_review: true`, and say so in `review_notes`. `title`, `subtitle`, and `pull_quote` come verbatim from the PDF.
- **Add** assets under the codex id as basename (`md/{id}.md`, `pdf/{id}.pdf`, `covers/{id}.jpg`, `thumb/{id}.jpg`), the same identity pattern every existing codex follows. Covers are scrubbed of all baked-in text (original kept in `blobs/originals/{id}.jpg`) and thumbs are generated from the scrubbed cover. Also add `added` rows in `data/codex-provenance.json`.
- **Rebuild** the lattice (`codex-lattice.json`, `codex-lattice-meta.json`, `public/codex-content/{id}.json`) and confirm SSG emits `/codex/{id}` for each new id.
- **Distill** findings (converter quality, per-codex structure and cross-references, metadata rationale, open flags for James and Ron, updated lattice tallies) into `findings.md` to feed the next round of site-organization specs.

## Capabilities

### New Capabilities

- `codex-ingest`: Repeatable path from a James-published PDF to a published lattice entry: markdown conversion, catalog entry with provenance-labelled metadata, assets, and lattice rebuild.

### Modified Capabilities

- _(none — no mainline `openspec/specs/` yet; `codex-lattice-restructure` is complete but unarchived)_

## Impact

- **Data**: `data/codex-catalog.json` (+4), `data/codex-provenance.json` (+4 `added` rows).
- **Content/assets**: `client/public/md/`, `client/public/pdf/` (incl. renaming `The Ecology of Becoming.pdf`), `client/public/covers/`, `client/public/thumb/`, `blobs/originals/`.
- **Generated**: `client/src/generated/*`, `client/public/codex-content/*` via `npm run build:lattice`.
- **Out of scope**: re-sequencing, tone/series/registry views, nav, branding, legacy pages, `llms.txt` / `llms.json` refresh, the Evolution of the Sovereign compilation PDF (a series aggregate, not a new codex).
