## 1. Sources and identity

- [x] 1.1 Open each source PDF (see design.md table); record page count and the exact title/subtitle/author from the title page; confirm or adjust the four proposed ids
- [x] 1.2 Compare `client/public/pdf/The Ecology of Becoming.pdf` with `analysis/legacy-pages/pdf/The-Ecology-of-Becoming.pdf` (page count + text hash); pick the canonical copy per design Decision 5

## 2. Markdown conversion

- [x] 2.1 Run `python C:\src\pyscripts\pdf_to_md.py` on all four PDFs into a scratch folder; capture warnings (U+200B markers, dropped-text audit) and word counts
- [x] 2.2 Render sample pages (PyMuPDF) and compare each output against the PDF and against corpus house style (`framing-the-mirror.md`, `between-worlds-the-architecture-of-the-third-structure.md`)
- [x] 2.3 Hand-correct to verbatim fidelity (line breaks, emphasis, headings, glyphs, no page numbers/headers/frontmatter/cover img) and write `client/public/md/{id}.md`
- [x] 2.4 Do not modify `pdf_to_md.py`; write a converter evaluation (what worked, what failed, recommended fixes) into `findings.md`

## 3. Assets

- [x] 3.1 Place PDFs at `client/public/pdf/{id}.pdf` (`git mv` the spaced Ecology filename; copy the other three from `analysis/legacy-pages/pdf/`)
- [x] 3.2 Extract page-1 cover art to `blobs/originals/{id}.jpg` (text intact, never published)
- [x] 3.3 Write a text-free `client/public/covers/{id}.jpg` (existing text-free source, or art with no baked text); otherwise publish nothing for that cover and list it as pending text removal for Ron. No UI/overlay changes; `title_overlay` stays `true` — Ron supplied all four text-free covers
- [x] 3.4 Generate `client/public/thumb/{id}.jpg` from each text-free cover (400×520 q80 progressive) — Ron supplied all four thumbs
- [x] 3.5 Run the asset-identity check: every catalog id has `md/`, `pdf/`, `covers/`, `thumb/` files with the id as basename (pending covers listed as exceptions), and no published asset folder has a non-catalog basename

## 4. Catalog and provenance

- [x] 4.1 Append four entries at sequences 136–139 to `data/codex-catalog.json` following design Decision 3 (verbatim fields, AI-drafted fields, `needs_review: true`, `review_notes`, metrics computed like existing entries)
- [x] 4.2 Verify each `pull_quote` appears exactly in its markdown; verify `structural_role`/`entry_point` use existing values; flag any new `tone_marker`
- [x] 4.3 Append four `added` rows to `data/codex-provenance.json` with date and source URL/email
- [x] 4.4 Validate catalog: 138 entries (sequence 18 was already vacant), unique ids and sequences

## 5. Build and verify

- [x] 5.1 Run `npm run build:lattice` in `client/`; confirm 138 entries in `codex-lattice-meta.json` and `public/codex-content/{id}.json` for each new id
- [x] 5.2 Run `npm run build` in `client/` (vite-ssg); confirm `/codex/{id}` is emitted for the four new ids and the build succeeds
- [x] 5.3 Spot-check rendering: new cards show tone marker and correct title handling; reader renders headings, line breaks, and glossary terms

## 6. Conversion refinement

- [x] 6.1 Build a geometry-based codex converter (`.cursor/skills/codex-ingest/scripts/codex_pdf_to_md.py`): paragraph gap → blank line, U+200B soft return → hard break, margin-reaching line → wrap join; TOC-driven `##` levels; numeral + title merge; weight/italic emphasis; bullets; drawn rules; auto-removal and report of cover, TOC, Note to Readers, running headers, footers
- [x] 6.2 Re-convert all four PDFs; hand-finish flagged items (When AI table, Rise registry bullets); word-diff against previous md and PDF text — identical word sequences apart from print-only removals and house-style additions
- [x] 6.3 Verify every `pull_quote` is still an exact substring; rerun `npm run build:lattice` (138) and the asset-identity check
- [x] 6.4 Write the `codex-ingest` skill (`.cursor/skills/codex-ingest/SKILL.md`) with the print-only checklist, geometry-to-markdown rules, and fidelity proof

## 7. Findings

- [x] 7.1 Write `openspec/changes/ingest-new-codices/findings.md`: converter evaluation; per-codex summary (title, subtitle, word count, section outline, key glossary terms, codexes it references or echoes, metadata rationale); flags for James (all AI-drafted fields, any new tone markers) and for Ron (cover text removal, Ecology PDF variance); updated lattice tallies (structural_role, entry_point, tone markers, series) after ingestion; placement thoughts (where each might sit in sequence, series, or tone neighborhoods)
