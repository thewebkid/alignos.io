## Purpose

Lets two editions of the same work coexist in the lattice: both remain readable, the older is marked as an earlier edition and linked to the later one, and lineage stays an optional layer rather than a second card that looks like a duplicate.

## ADDED Requirements

### Requirement: Edition links are recorded in the catalog
A catalog entry that is an earlier edition of another published entry SHALL record the later edition's id. The relationship SHALL be recorded in provenance with the evidence (matching structure, title evolution, cover title), and SHALL be flagged `needs_review` until James confirms which edition is later. An entry MUST NOT be both an earlier edition and a series member with a position. The later edition holds the series position.

#### Scenario: Living Harmonics pair
- **WHEN** the catalog is read
- **THEN** `the-codex-of-harmonic-service-latticework-for-planetary-reassembly` records `the-codex-of-living-harmonics` as its later edition, and the later edition holds position 1 of "The Codices of Harmonic Activation"

#### Scenario: Love's Architecture pair
- **WHEN** the catalog is read
- **THEN** `the-codex-of-harmonic-coherence` records `the-codex-of-loves-architecture` as its later edition, and the later edition holds position 6

#### Scenario: Trans-Species Resonance pair
- **WHEN** the catalog is read
- **THEN** `the-codex-of-trans-species-resonance` records `the-codex-of-trans-species-resonance-expanded` as its later edition, and the later edition holds position 6 of "The Codices of Planetary Service"

### Requirement: Earlier editions stay visible and are marked
Earlier editions SHALL remain in the lattice, search, and reader. Their cards SHALL show an "Earlier edition" marker.

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
