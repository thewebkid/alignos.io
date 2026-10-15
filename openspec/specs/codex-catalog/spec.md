# codex-catalog Specification

## Purpose
Defines the canonical codex catalog as the single source of identity and editorial metadata for the AlignOS lattice, using James' v2 proposed-changes as-is.
## Requirements
### Requirement: Catalog is the source of identity
The system SHALL treat `data/codex-catalog.json` as the sole source of truth for each published codex's `id`, `title`, `subtitle`, `sequence`, `author`, `series`, `structural_role`, `tone_marker`, `tags`, `description`, `entry_point`, `pull_quote`, cover/asset paths, `metrics`, `provenance`, and `status`. Markdown files MUST NOT be used to invent or override those identity fields.

#### Scenario: Catalog id is used as the lattice id
- **WHEN** the lattice is built from the catalog and markdown corpus
- **THEN** every published lattice entry's `id` equals the catalog `id` for that sequence, not a filename-derived variant

#### Scenario: Markdown filename does not override title
- **WHEN** a markdown file's first heading differs from the catalog title
- **THEN** the published lattice entry uses the catalog title

### Requirement: v2 proposed-changes are the published values
The catalog SHALL be updated so that tone markers, structural roles, tags, descriptions, entry points, and pull quotes match `data/composer-analysis.json` (the v2 analysis James approved as-is), including the two mismatch resolutions and the expanded tone-marker vocabulary.

#### Scenario: Mismatch resolutions are published
- **WHEN** a consumer reads the published lattice for sequence 38 (The Architecture of Yielding) and sequence 130 (The Harmonics of the Field)
- **THEN** their `toneMarker` values are `Open Trust` and `Field Attunement` respectively, not the prior cover-confirmed markers

#### Scenario: New tone markers are first-class
- **WHEN** a catalog entry's v2 tone marker is not in the original 29-value taxonomy
- **THEN** that marker is stored and published as a normal `tone_marker` / `toneMarker` string with no fallback to a legacy taxonomy value

### Requirement: IDs are kebab-case without trailing number artifacts
Every catalog `id` SHALL be a kebab-case slug derived from the canonical title, with no trailing numeric filename artifacts (for example no `-11-1`, `-55`, `-27`). Provenance SHALL record the previous id when an id changes.

#### Scenario: Trailing-number id is cleaned
- **WHEN** a prior id was `between-the-whole-and-the-relational-11-1`
- **THEN** the catalog id is `between-the-whole-and-the-relational` and provenance records the old id

### Requirement: Catalog covers the published corpus
The catalog SHALL contain one entry per published lattice codex (currently 138), each with a unique `id` and unique `sequence`. Works that James has named but not written (planned series positions) MUST NOT be catalog entries; they live only in the series registry.

#### Scenario: Unique ids
- **WHEN** the catalog is validated
- **THEN** no two entries share an `id` or a `sequence`

#### Scenario: Planned work is not catalogued
- **WHEN** the catalog is validated
- **THEN** no entry corresponds to a planned position in the series registry (for example "The Codex of the Spiral Species")

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

