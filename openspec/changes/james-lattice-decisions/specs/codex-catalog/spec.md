## MODIFIED Requirements

### Requirement: AI-drafted metadata stays flagged until reviewed
A catalog entry whose interpretive fields (`tone_marker`, `structural_role`, `entry_point`, `tags`, `description`, `pull_quote`) were drafted by AI and not yet reviewed by James SHALL have `needs_review: true` and `review_notes` naming those fields. Evidence-supported series placements and edition links that James has confirmed SHALL NOT by themselves set `needs_review`. The notes SHALL say which placement was confirmed and which interpretive fields remain provisional.

#### Scenario: Rewritten description keeps the flag
- **WHEN** the description of `the-ecology-of-becoming` is an AI draft James has not reviewed
- **THEN** the entry has `needs_review: true` and `review_notes` names the interpretive fields

#### Scenario: Confirmed placement is not a draft
- **WHEN** a catalog entry's only unreviewed change was a series placement James confirmed on 15 Oct 2026, and its interpretive fields came from the approved v2 set
- **THEN** `needs_review` is false

## ADDED Requirements

### Requirement: Registry statements are kept when placement differs
When a codex registry names a series other than the catalog placement, the catalog entry SHALL store that statement in provenance. The catalog placement SHALL NOT be changed to match it. The statement SHALL NOT cause a new series to be created.

#### Scenario: Realized Flame
- **WHEN** the catalog entry for Codex of the Realized Flame (Part I) is read
- **THEN** provenance preserves a registry statement naming "The Architecture of Love", and the entry's series is "Realized Flame"
