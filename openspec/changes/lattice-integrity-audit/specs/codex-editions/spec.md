## ADDED Requirements

### Requirement: An earlier edition shows its own title and its own text
An entry linked as an earlier edition SHALL carry the title printed in its own PDF and cover, and its markdown SHALL be converted from its own PDF. It MUST NOT display the later edition's title or text. The edition notice and "Earlier edition" marker are what connect the two.

#### Scenario: Harmonic Service is not shown as Living Harmonics
- **WHEN** a visitor opens `/codex/the-codex-of-harmonic-service-latticework-for-planetary-reassembly`
- **THEN** the title is "The Codex of Harmonic Service", the text is the Harmonic Service PDF's text, and a notice links to `/codex/the-codex-of-living-harmonics`

#### Scenario: Harmonic Coherence is not shown as Love's Architecture
- **WHEN** a visitor opens `/codex/the-codex-of-harmonic-coherence`
- **THEN** the title is "The Codex of Harmonic Coherence" and the text is its own PDF's text

### Requirement: Edition and alternative links rest on real shared text
An edition or alternative-version link SHALL record evidence taken from the two entries' PDF-derived markdown. When two entries' texts share almost no wording, the link SHALL record that the relationship comes from James's own statement (for example a rename), or SHALL NOT exist. Overlap measured on markdown that was copied from another entry SHALL NOT count as evidence.

#### Scenario: Different works are not alternative versions
- **WHEN** two entries' markdown, converted from their own PDFs, share no wording and no statement by James relates them
- **THEN** neither entry lists the other in `alternative_ids`

#### Scenario: Next Threshold and On Becoming a Portal
- **WHEN** the catalog is read
- **THEN** `codex-of-the-next-threshold` and `codex-on-becoming-a-portal` have no `alternative_ids`
