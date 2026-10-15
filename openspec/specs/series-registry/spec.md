# series-registry Specification

## Purpose
Gives every codex series one canonical record (name, alternate names, total, order, companions, related works, compilation asset, and planned unwritten positions) so corridors keep a cited order. Works James has named but not written stay recorded and are not shown in the lattice.
## Requirements
### Requirement: Series registry is the source of series identity
The system SHALL keep a committed series registry with one record per series. Each record SHALL have a kebab-case `id` derived from its canonical name, the canonical `name`, `aliases` (other names found in James' text, possibly empty), `total` (or null when unknown), `companion_ids` (catalog ids of non-numbered companion texts, possibly empty), `compilation_pdf` (or null), `planned` positions (possibly empty), and a `source` note citing where the canonical name and order come from.

#### Scenario: Registry record shape
- **WHEN** the registry is validated
- **THEN** every record has a unique `id` and `name`, and no alias equals another record's name or alias

### Requirement: Canonical names and order come from James' text
A series' canonical name, total, and position order SHALL be taken from James' own text (series prefaces, codex registries, or legacy pages), and the source SHALL be cited in the record. Where sources disagree, the record SHALL use the series preface over individual registries, and SHALL list the other names as aliases. A position that no source states MUST remain unknown (null), not inferred.

#### Scenario: Harmonic Activation
- **WHEN** the registry record for the Harmonic Activation corridor is read
- **THEN** its name is "The Codices of Harmonic Activation", its total is 7, its aliases include "Harmonic Activation" and "The Harmonic Principles of the Field", its companion is `the-codex-of-harmonic-reality-why-the-field-is-not-a-simulation`, and its source cites the series preface printed in that companion

#### Scenario: Unknown order stays unknown
- **WHEN** no source states the order of the two Trans-Species Resonance codexes
- **THEN** their positions remain null and the series is listed on the question list for James

### Requirement: Planned positions
A series record MAY list planned positions for works James has named but not written. Each planned position SHALL have `position`, `title`, optional `subtitle`, and `source`, with title and subtitle quoted from James' text. Planned positions MUST NOT be catalog entries, MUST NOT have assets, and MUST NOT count toward the published corpus. No two members or planned positions in a series SHALL share a position.

#### Scenario: Spiral Species
- **WHEN** the Harmonic Activation record is read
- **THEN** position 3 is planned with title "The Codex of the Spiral Species" and subtitle "Understanding evolution as a function of conscious recursion"

#### Scenario: Codex VI
- **WHEN** the Evolution of the Sovereign record is read
- **THEN** position 6 of 8 is planned with title "Codex VI: The Function of Presence"

#### Scenario: Interface Trilogy
- **WHEN** the Interface Trilogy record is read
- **THEN** it has total 3, members `when-ai-remembers-the-field` (1) and `the-rise-of-the-interface-civilizations` (2), and position 3 planned as "The Architecture of Listening"

### Requirement: Members that carry the series but have no stated position
A catalog entry MAY belong to a series without a position when James' text links it to the series but doesn't place it. Such members SHALL be shown as unplaced, and MUST NOT be assigned a position.

#### Scenario: Registry claim without a position
- **WHEN** *What Is an InterBeing?* names "Codices of the InterBeing" in its registry but no source places it
- **THEN** it is an unplaced member of "Codices of the InterBeing" and appears on the question list for James

### Requirement: Prefaces place members across corridors
When a printed series preface lists a codex at a position, that placement SHALL take precedence over a registry line that names a different series, and the conflicting registry name SHALL be recorded in review notes.

#### Scenario: Nonlocal Memory
- **WHEN** the Planetary Service preface lists *The Codex of Nonlocal Memory* fourth of six, but its registry names "The Harmonic Principles of the Field"
- **THEN** it is position 4 of "The Codices of Planetary Service", and the record's review notes cite the alias usage

### Requirement: Draft series records are flagged
A series record whose name, order, membership, or planned positions involve our interpretation rather than a direct statement in James' text SHALL carry `needs_review: true` with `review_notes` explaining the interpretation.

#### Scenario: Interpretive merge flagged
- **WHEN** two catalog series names are merged into one record
- **THEN** that record has `needs_review: true` and its notes name the merged names and the evidence

