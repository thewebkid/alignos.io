## MODIFIED Requirements

### Requirement: Edition links are recorded in the catalog
A catalog entry that is an earlier edition of another published entry SHALL record the later edition's id and whether the chronology is verified by the text or accepted from inference. The relationship SHALL be recorded in provenance with the evidence. An entry MUST NOT be both an earlier edition and a series member with a position. The later edition holds the series position. A pair whose order is uncertain MUST NOT use `later_edition_id`.

#### Scenario: Living Harmonics pair
- **WHEN** the catalog is read
- **THEN** `the-codex-of-harmonic-service-latticework-for-planetary-reassembly` records `the-codex-of-living-harmonics` as its later edition, the chronology is recorded as accepted from inference, and the later edition holds position 1 of "The Codices of Harmonic Activation"

#### Scenario: Love's Architecture pair
- **WHEN** the catalog is read
- **THEN** `the-codex-of-harmonic-coherence` records `the-codex-of-loves-architecture` as its later edition, the chronology is recorded as accepted from inference, and the later edition holds position 6

#### Scenario: Trans-Species Resonance pair
- **WHEN** the catalog is read
- **THEN** `the-codex-of-trans-species-resonance` records `the-codex-of-trans-species-resonance-expanded` as its later edition, the chronology is recorded as verified by the expanded title, and the later edition holds position 6 of "The Codices of Planetary Service"

### Requirement: Earlier editions stay visible and are marked
Earlier editions SHALL remain in the lattice, search, and reader. Their cards SHALL show an "Earlier edition" marker. An alternative version MUST NOT show that marker.

#### Scenario: Marker on card
- **WHEN** the lattice renders an earlier edition
- **THEN** its card shows "Earlier edition" and the card still opens the reader

### Requirement: Readers can cross between editions
The reader for an earlier edition SHALL show a notice linking to the later edition. The reader for a later edition SHALL offer a link to its earlier edition(s) without interrupting the text (for example, near the series context or the end of the codex).

#### Scenario: From earlier to later
- **WHEN** a visitor opens `/codex/the-codex-of-harmonic-coherence`
- **THEN** a notice states it is an earlier edition and links to `/codex/the-codex-of-loves-architecture`

#### Scenario: From later to earlier
- **WHEN** a visitor opens `/codex/the-codex-of-loves-architecture`
- **THEN** a link to the earlier edition is available

## ADDED Requirements

### Requirement: Uncertain pairs are alternative versions
When two published texts appear to be versions of the same work and their order is uncertain, each SHALL record the other's id as an alternative version. Neither SHALL be marked earlier or later. Both SHALL remain readable, and each card and reader SHALL link to the other as "Alternative version".

#### Scenario: On Becoming a Portal
- **WHEN** the catalog entries `codex-of-the-next-threshold` and `codex-on-becoming-a-portal` are read
- **THEN** each lists the other as an alternative version and neither has `later_edition_id`

#### Scenario: Language of Resonance
- **WHEN** the catalog entries `codex-of-the-language-of-resonance` and `codex-of-resonant-memory` are read
- **THEN** each lists the other as an alternative version and neither has `later_edition_id`

#### Scenario: Marker on an alternative
- **WHEN** the lattice renders either portal text
- **THEN** its card shows "Alternative version" and does not show "Earlier edition"
