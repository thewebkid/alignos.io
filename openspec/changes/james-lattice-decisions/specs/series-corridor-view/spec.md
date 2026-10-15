## MODIFIED Requirements

### Requirement: Lattice series filter
The lattice SHALL offer a series filter listing every registry series by canonical name. Selecting a series SHALL set `?series={series-id}` on `/lattice`, and loading `/lattice?series={series-id}` SHALL select it. While a series is selected, the lattice SHALL show a short header (series name, the count of published codices in the corridor, and a link to any companion text, related work, or compilation PDF), then the corridor. The header MUST NOT mention unwritten works. The reading-progress filters SHALL continue to work within the corridor.

#### Scenario: Deep link to a corridor
- **WHEN** a visitor opens `/lattice?series=the-codices-of-harmonic-activation`
- **THEN** the Harmonic Activation corridor is shown with header "The Codices of Harmonic Activation" and "6 codices", and the header does not say "of 7" or "not yet written"

#### Scenario: Clearing the filter
- **WHEN** the visitor clears the series filter
- **THEN** the URL drops `series` and the full lattice returns

#### Scenario: Works outside every series
- **WHEN** a visitor chooses "Not in a series" (`/lattice?series=none`)
- **THEN** the lattice shows only codexes that are neither series members (positioned or unplaced) nor earlier editions of a series member, under the header "Not in a series" with their count, and the progress filters count within that set

### Requirement: Corridor order and placeholders
A selected corridor SHALL list positioned members in position order, then unnumbered members under an "Also in this series" heading, then companion texts. Planned positions MUST NOT render as cards.

#### Scenario: Placeholder in sequence
- **WHEN** the Harmonic Activation corridor is shown
- **THEN** Resonant Action is followed by The Spiral, and no card reads "The Codex of the Spiral Species" or "Not yet written"

#### Scenario: Placeholder is not a link
- **WHEN** a visitor views a corridor that has a planned position
- **THEN** that position has no card and no link

#### Scenario: Unnumbered members
- **WHEN** the Codices of the InterBeing corridor is shown
- **THEN** Codex I–IV appear in order, and *What Is an InterBeing?*, *Between the Whole and the Relational*, and *The Mirror and the Bridge* appear under "Also in this series" with no position numbers

### Requirement: Planned positions stay out of the main grid
The lattice, including a selected series corridor, search results, and collection views, MUST NOT show planned positions.

#### Scenario: All filter
- **WHEN** the lattice is shown with no series selected
- **THEN** no "Not yet written" card is present and the count equals the number of published codexes

#### Scenario: Corridor
- **WHEN** a visitor opens The Evolution of the Sovereign corridor
- **THEN** no card is titled "The Architecture of Presence" or "The Function of Presence"

### Requirement: Reader series context
When the open codex is a positioned member of a series, the reader SHALL show the series name and "Part {position} of {total}", linked to that series' corridor. Previous/next navigation SHALL follow series position order, skipping planned and unplaced entries. It SHALL show the neighbor on each side when one exists.

#### Scenario: Middle of a corridor
- **WHEN** a visitor reads The Codex of the Spiral (position 4 of 7)
- **THEN** the reader shows "The Codices of Harmonic Activation · Part 4 of 7", previous is The Codex of Resonant Action, and next is The Codex of Quantum Kin

#### Scenario: First member
- **WHEN** a visitor reads the position-1 member of a series
- **THEN** there is no previous link and the next link is the next positioned member

## ADDED Requirements

### Requirement: Related works are linked from the corridor
A selected corridor SHALL link each related work from its header. The related work MUST NOT appear in the numbered order or under "Also in this series".

#### Scenario: Four Frequencies
- **WHEN** a visitor opens `/lattice?series=the-architecture-of-love`
- **THEN** the header links to *Codex: The Four Frequencies of Love*, and that codex is not among the ten numbered works
