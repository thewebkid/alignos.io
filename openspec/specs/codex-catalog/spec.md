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
The catalog SHALL contain one entry per published lattice codex (currently 134), each with a unique `id` and unique `sequence`.

#### Scenario: Unique ids
- **WHEN** the catalog is validated
- **THEN** no two entries share an `id` or a `sequence`

