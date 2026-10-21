## Context

Production downloads failed with "Blob not found". The `vercel-deployment-bootstrap` change recorded "PDFs are already uploaded under `/pdf/`. No migration script" and verified two objects (`when-ai-remembers-the-field`, `the-evolution-of-the-sovereign`) that happened to be lowercase already. The rest of the store was uploaded in January under the WordPress filenames, and `asset-identity` renamed the local files to catalog ids afterwards. Nothing re-uploaded them.

The lattice audit that followed compared three things: the store against the catalog, each entry's markdown against its own PDF, and the live catalog against the planning spreadsheets.

## Decisions

### D1. Upload from Git history, not server-side copy

The old-named objects could be copied to the new names with `vercel blob copy`, but that needs a name mapping with fuzzy matches (`Codex_-The-Mirror-Path-107` → `codex-the-mirror-path`) and still leaves `framing-the-mirror` unmapped (it was never in the store). The last commit containing the id-named PDFs is `908ffc3^`, and that is exactly the file set the site served when downloads worked. Extracting it and uploading `pdf/{id}.pdf` needs no mapping. Before uploading, the old store objects were matched to those files by byte size (137 of 139 matched uniquely), and afterwards the new objects were compared with the Git copies (all 138 identical), so the content is the same as before the rename.

The upload skipped any object that already existed at the right size. It used `allowOverwrite` only for names that did not exist or differed in size, so no existing correct object was replaced. Old-named objects were left in place.

### D2. Convert only entries that hold another entry's text

The audit found two kinds of markdown/PDF disagreement:

- Four entries whose markdown shares 0–2% of its wording with its own PDF and about 100% with a different entry. That is a copy error. The markdown is not James's text for that entry, so it is replaced from the PDF with the `codex-ingest` geometry pass, the word-diff, and a visual check of the flagged pages.
- Seven entries where most wording matches but each side has passages the other lacks (and in some, the site has text the PDF does not). That is two revisions of one work. Re-converting would silently choose one, which is James's decision. They are listed in `docs/lattice-known-issues.md` and not touched.

### D3. Titles of the four follow their PDFs

The catalog title for each was the later edition's, set on 2026-06-28 on the assumption that "markdown title represents the evolved version". With the real text in place that no longer holds: the card would show one title and the download another. The series preface prints "The Codex of Harmonic Service" and "The Codex of Harmonic Coherence", and the legacy URL `/ripple/the-codex-of-harmonic-service/` resolves to the Harmonic Service entry. The titles are set to the PDF and cover titles. The "Earlier edition" marker and the reader notice carry the lineage. This is one field per entry and is easy to revert if James prefers the evolved names on the earlier cards.

### D4. Leave edition links and the Resonant Memory pairing alone, and say so

James's 15 Oct confirmations of two earlier/later pairs were given from overlap figures that came from the copy error. Changing the links would reverse something he said yes to, so they stay and the doubt is recorded for him. The Next Threshold / On Becoming a Portal alternative link is different. James never named that pair, its only basis was the false overlap, and the converted texts share no wording, so keeping it would put a known-false "Alternative version" label on two cards. It is removed.

### D5. Tone markers are not changed

The audit first flagged `codex-06-the-architecture-of-love` and `the-harmonics-of-the-field-extended` as AI proposals overriding cover-confirmed markers. `codex-catalog` states that James approved the v2 values as-is, including those two resolutions. The change that restored the cover markers was reverted before commit. Checking the specs before correcting a value is now part of how this list is kept.

### D6. A check for the failure that happened

The store and catalog drifted because nothing compared them. `scripts/verify-blob-pdfs.js` does that with HEAD requests and no credentials, so it can run in CI. `scripts/audit-content.py` makes the markdown-versus-PDF comparison repeatable and reads `docs/lattice-known-issues.md` so accepted findings do not fail it.

## Risks / Trade-offs

- [Corrected entries carry tone, tags, role and entry point drafted against the wrong text] → Flagged `needs_review: true` with notes; `metadataStatus` renders "draft". James reviews them with the rest.
- [Old-named blobs remain] → Harmless, possibly linked externally. Deleting is a separate decision for Ron.
- [The content audit needs the PDFs] → It downloads them from the store into the OS temp folder and reuses them.
- [Overlap-based audits can miss text that changed within a section] → Used as a screen, not a proof. Entries that pass are not guaranteed identical to their PDFs.

## Migration Plan

The blob upload was applied to production first because it fixes a live failure and only adds objects. The content changes ship with the next deploy. Rollback for content is a git revert; for the store, delete the added `pdf/{id}.pdf` objects, which would re-break downloads, so there is no reason to.

## Open Questions

Tracked in `docs/lattice-known-issues.md` under "Needs James".
