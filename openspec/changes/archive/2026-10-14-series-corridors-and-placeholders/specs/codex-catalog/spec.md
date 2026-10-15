## MODIFIED Requirements

### Requirement: Catalog covers the published corpus
The catalog SHALL contain one entry per published lattice codex (currently 138), each with a unique `id` and unique `sequence`. Works that James has named but not written (planned series positions) MUST NOT be catalog entries; they live only in the series registry.

#### Scenario: Unique ids
- **WHEN** the catalog is validated
- **THEN** no two entries share an `id` or a `sequence`

#### Scenario: Planned work is not catalogued
- **WHEN** the catalog is validated
- **THEN** no entry corresponds to a planned position in the series registry (for example "The Codex of the Spiral Species")

## ADDED Requirements

### Requirement: Series references resolve to the registry
Every catalog `series.name` SHALL equal the canonical `name` of a series registry record. A `series.position`, when present, SHALL be within 1..`total` of that record and SHALL NOT collide with another member or planned position. A catalog entry's `series.total` SHALL equal the record's `total`.

#### Scenario: Alias in catalog is rejected
- **WHEN** a catalog entry uses `series.name` "Harmonic Activation" (an alias)
- **THEN** validation fails and names the canonical series "The Codices of Harmonic Activation"

### Requirement: AI-drafted metadata stays flagged until reviewed
A catalog entry whose editorial fields (`tone_marker`, `structural_role`, `entry_point`, `tags`, `description`, `pull_quote`) or relationships (series placement, edition links) were drafted or changed by AI after James' v2 approval SHALL have `needs_review: true` and `review_notes` naming the fields, the model, and the date. Only Ron, recording James' confirmation, sets it back to false.

#### Scenario: Rewritten description keeps the flag
- **WHEN** the description of `the-ecology-of-becoming` is rewritten in the approved voice
- **THEN** the entry still has `needs_review: true` and `review_notes` records the rewrite

### Requirement: Descriptions share one voice
Catalog `description` values SHALL be written in the atmospheric register of the James-approved v2 set: a short sensory and tonal reading of the codex, rather than an analytical summary of its argument.

#### Scenario: New entries match the approved register
- **WHEN** descriptions for sequences 136–139 are compared with approved v2 descriptions
- **THEN** they use the same register (tone and atmosphere, comparable length), not "This paper asks…" summaries
