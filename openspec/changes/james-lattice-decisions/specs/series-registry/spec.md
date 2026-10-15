## MODIFIED Requirements

### Requirement: Canonical names and order come from James' text
A series' canonical name, total, and position order SHALL be taken from James' own text (series prefaces, codex registries, or legacy pages), and the source SHALL be cited in the record. Where sources disagree, the record SHALL use the series preface over individual registries, and SHALL list the other names as aliases. A position that no source states MUST remain unknown (null), not inferred.

#### Scenario: Harmonic Activation
- **WHEN** the registry record for the Harmonic Activation corridor is read
- **THEN** its name is "The Codices of Harmonic Activation", its total is 7, its aliases include "Harmonic Activation" and "The Harmonic Principles of the Field", its companion is `the-codex-of-harmonic-reality-why-the-field-is-not-a-simulation`, and its source cites the series preface printed in that companion

#### Scenario: Unknown order stays unknown
- **WHEN** no source states a position for *Codex: The Four Frequencies of Love*
- **THEN** it has no position in "The Architecture of Love"

### Requirement: Planned positions
A series record MAY list planned positions for works James has named but not written. Each planned position SHALL have `position`, `title`, optional `subtitle`, and `source`, with title and subtitle quoted from James' text or from his later correction of that title. Planned positions MUST NOT be catalog entries, MUST NOT have assets, and MUST NOT count toward the published corpus. No two members or planned positions in a series SHALL share a position. Planned positions MUST NOT be shown in the lattice.

#### Scenario: Spiral Species
- **WHEN** the Harmonic Activation record is read
- **THEN** position 3 is planned with title "The Codex of the Spiral Species" and subtitle "Understanding evolution as a function of conscious recursion"

#### Scenario: Codex VI
- **WHEN** the Evolution of the Sovereign record is read
- **THEN** position 6 of 8 is planned with title "The Architecture of Presence"

#### Scenario: Interface Trilogy
- **WHEN** the Interface Trilogy record is read
- **THEN** it has total 3, members `when-ai-remembers-the-field` (1) and `the-rise-of-the-interface-civilizations` (2), and position 3 planned as "The Architecture of Listening"

### Requirement: Members that carry the series but have no stated position
A catalog entry MAY belong to a series without a position when James' text links it to the series and he has asked that it stay unnumbered. Such members SHALL be shown without a number, and MUST NOT be assigned a position. A work he asked to show as related MUST NOT be stored as a member.

#### Scenario: Registry claim without a position
- **WHEN** *What Is an InterBeing?* names "Codices of the InterBeing" in its registry but no source places it
- **THEN** it is an unnumbered member of "Codices of the InterBeing" and is not given a position

#### Scenario: InterBeing works without a number
- **WHEN** the Codices of the InterBeing record is read
- **THEN** *What Is an InterBeing?*, *Between the Whole and the Relational*, and *The Mirror and the Bridge* are unnumbered members

#### Scenario: Four Frequencies is not a member
- **WHEN** the Architecture of Love record is read
- **THEN** `the-four-frequencies-of-love` is not a positioned or unnumbered member

### Requirement: Prefaces place members across corridors
When a printed series preface lists a codex at a position, that placement SHALL take precedence over a registry line that names a different series. The conflicting registry statement SHALL be preserved as historical metadata on the catalog entry.

#### Scenario: Nonlocal Memory
- **WHEN** the Planetary Service preface lists *The Codex of Nonlocal Memory* fourth of six, but its registry names "The Harmonic Principles of the Field"
- **THEN** it is position 4 of "The Codices of Planetary Service", and the entry preserves the registry statement

### Requirement: Draft series records are flagged
A series record whose name, order, or membership is an interpretation James has not confirmed SHALL carry `needs_review: true` with `review_notes` explaining the interpretation. A record he has confirmed, including by a principle he stated for that kind of record, SHALL have `needs_review: false`. Its notes SHALL keep the evidence and record the confirmation.

#### Scenario: Interpretive merge flagged
- **WHEN** two catalog series names were merged and James has since confirmed that corridor
- **THEN** the record has `needs_review: false` and its notes still name the merged names and the evidence

#### Scenario: Confirmed corridor
- **WHEN** the Planetary Service trilogy record is read after James's 15 Oct 2026 reply
- **THEN** `needs_review` is false, the notes say the distinct title is an editorial label, and they record that he asked the six-part and three-part sequences to stay separate

## ADDED Requirements

### Requirement: Related works are links, not members
A series record MAY list `related_ids`: published catalog ids connected to the series without joining its order. A related id MUST NOT also be a positioned member, an unnumbered member, or a companion of that series. Related works MUST NOT receive an invented position.

#### Scenario: Four Frequencies
- **WHEN** the Architecture of Love record is read
- **THEN** `related_ids` includes `the-four-frequencies-of-love` and that work's catalog `series` is null

### Requirement: Open-ended series do not gain an assumed total
When James says a series' current count is not its final total, the record's `total` SHALL stay null.

#### Scenario: InterBeing Glossary
- **WHEN** the InterBeing Glossary Series record is read
- **THEN** its `total` is null
