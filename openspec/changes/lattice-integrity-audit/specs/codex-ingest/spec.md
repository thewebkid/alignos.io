## ADDED Requirements

### Requirement: An entry's markdown comes from that entry's own PDF
For every catalog entry, at least 85% of the 5-word sequences in `client/public/md/{id}.md` SHALL appear in `{id}.pdf`, and at least 85% of the PDF's SHALL appear in the markdown, unless the entry is recorded in `docs/lattice-known-issues.md` as a revision mismatch awaiting James. No two entries SHALL have markdown with more than 90% shared 5-word sequences unless the pair is recorded there as a known duplicate. `scripts/audit-content.py` SHALL report both conditions and exit non-zero when an entry holds another document's text or a duplicate pair exists.

#### Scenario: Copied text is detected
- **WHEN** an entry's markdown shares under 5% of its 5-word sequences with its own PDF, in both directions
- **THEN** the audit reports the entry as holding another document's text and exits non-zero

#### Scenario: Revision mismatches are tracked, not silently re-converted
- **WHEN** an entry's markdown and PDF share most wording but each has passages the other lacks
- **THEN** the entry is listed in `docs/lattice-known-issues.md` for James to say which revision is canonical, and its markdown is not overwritten

### Requirement: Corrected entries are labelled as drafts
When an entry's markdown is replaced because it held another entry's text, the entry SHALL have `needs_review: true` and `review_notes` naming `pull_quote` and `description` as re-drafted from the real text, and naming `tone_marker`, `structural_role`, `entry_point` and `tags` as drafted against the wrong text and not re-evaluated. A `content_correction` row SHALL be added to `data/codex-provenance.json`.

#### Scenario: Pull quote is verbatim from the real text
- **WHEN** the corrected entry's `pull_quote` is searched in its markdown with whitespace collapsed
- **THEN** it is found
