## Why

Ondra Wingmaker, who is translating the Harmonic Activation series, reported two problems on alignos.io: every PDF download failed with "Blob not found", and the Harmonic Activation series showed codices he did not expect. He also warned that James renames series and reassigns codices as he writes, so the lattice may carry more errors.

An audit of the live store and the lattice against the PDFs and the planning spreadsheets found:

- 134 of 138 catalog PDFs returned 404 on the blob store. The store holds the original WordPress-style filenames (`Codex-01_-The-Architecture-of-Love-27.pdf`); the catalog and `cdnUrl.pdf` use the renamed catalog ids. The rename never reached the store, and nothing checks the store against the catalog.
- Four entries (sequences 8, 68, 75, 106) displayed another entry's text under their own cards. Their markdown was a copy of the later edition's text, while the PDF they offer is a different document with its own title: "Codex of the Next Threshold", "Codex of Resonant Memory", "The Codex of Harmonic Service", "The Codex of Harmonic Coherence". Two of those are the exact titles the Harmonic Activation series preface names.
- The earlier-edition and alternative-version links for those pairs were justified by "95%, 96%, 99%, 61% of paragraphs shared". That overlap was the copy error. The real texts share almost no wording.

The rest of the lattice matches the planning spreadsheets: ids, tones, roles, entry points and tags show no drift, and the only deviations are James's recorded decisions.

## What Changes

- Upload every catalog PDF to the blob store under `pdf/{id}.pdf` (done in production; the store only gained objects, nothing was deleted or overwritten with different content).
- Add `scripts/verify-blob-pdfs.js` and `npm run verify:pdfs` to check that every catalog PDF resolves on the store and through the site's `/pdf` rewrite.
- Re-convert the markdown for the four entries from their own PDFs with the codex-ingest geometry pass, set their titles to the PDF titles, and correct `pull_quote`, `description` and `metrics`. Mark them `needs_review: true` because the editorial fields were drafted against the wrong text.
- Remove the "Alternative version" link between `codex-of-the-next-threshold` and `codex-on-becoming-a-portal`. The converted texts are separate works.
- Record title, content and link corrections in `data/codex-provenance.json`.
- Add `docs/lattice-known-issues.md`, the running list of errors and open questions that need James.

Not changed: series membership, edition links, the `codex-of-resonant-memory` / `codex-of-the-language-of-resonance` alternative link, tone markers (the v2 values James approved stay), and the seven entries whose markdown and PDF are different revisions.

## Capabilities

### Modified Capabilities
- `blob-assets`: blob objects are named by catalog id, and a check proves it.
- `codex-editions`: an earlier edition carries its own title and its own text; edition and alternative links need real shared text.
- `codex-ingest`: an entry's markdown is converted from that entry's own PDF, and the audit that proves it.

## Impact

- Production blob store `alignos-blob`: +134 objects under `pdf/`. Old-named objects stay.
- `client/public/md/`: four files replaced.
- `data/codex-catalog.json`, `data/codex-provenance.json`.
- `scripts/verify-blob-pdfs.js`, root `package.json`.
- `docs/lattice-known-issues.md`.
- No application code changes. Titles render from the catalog, so the four cards, their readers, and search results pick up the corrected titles on the next build.
