## 1. Blob store

- [x] 1.1 List the store with the project's `BLOB_READ_WRITE_TOKEN` and confirm 134 of 138 catalog PDFs are missing under their catalog ids
- [x] 1.2 Extract the id-named PDFs from `908ffc3^` and match them to the old store objects by byte size
- [x] 1.3 Upload `pdf/{id}.pdf` for every PDF not already present at the right size (134 uploaded, 0 failed)
- [x] 1.4 Verify: all 138 catalog PDFs resolve on the store and through `https://alignos.io/pdf/...`, and all 138 legacy redirect destinations resolve
- [x] 1.5 Compare the new objects with the Git copies by hash (138 identical)
- [x] 1.6 Add `scripts/verify-blob-pdfs.js` and the `verify:pdfs` script; confirm it exits 1 against a wrong base URL

## 2. Content audit

- [x] 2.1 Compare the lattice with `proposed-changes.xlsx`, `proposed-changes-v2.xlsx` and `codex-catalog.xlsx` (ids, titles, tone, role, entry point, tags, series)
- [x] 2.2 Compare every PDF's first page with its catalog title
- [x] 2.3 Compare every entry's markdown with its own PDF and with every other entry's markdown
- [x] 2.4 Add `scripts/audit-content.py` that repeats 2.3 and honours `docs/lattice-known-issues.md`

## 3. Corrections

- [x] 3.1 Convert `codex-of-the-next-threshold`, `codex-of-resonant-memory`, `the-codex-of-harmonic-service-latticework-for-planetary-reassembly` and `the-codex-of-harmonic-coherence` from their own PDFs; run the word-diff; review the flagged pages
- [x] 3.2 Install the four markdown files; set titles to the PDF titles; replace `pull_quote` (verbatim, found in the new text), `description` and `metrics`; set `needs_review` with notes
- [x] 3.3 Remove the `alternative_ids` link between `codex-of-the-next-threshold` and `codex-on-becoming-a-portal`
- [x] 3.4 Add `title_change`, `content_correction` and `alternative_link_removed` rows to `data/codex-provenance.json`
- [x] 3.5 Revert the tone-marker restore for sequences 38 and 130 after reading the `codex-catalog` spec
- [x] 3.6 `npm test` in `client/` passes; `node scripts/audit-series.js` reports 0 validation errors

## 4. Record

- [x] 4.1 Write `docs/lattice-known-issues.md`
- [ ] 4.2 James answers the "Needs James" list; update the catalog, `series.json` and the specs to match
- [ ] 4.3 Archive this change when the PR merges
