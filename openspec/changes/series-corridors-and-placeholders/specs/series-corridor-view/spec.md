## Purpose

Defines how readers see a series as a corridor: a lattice filter that shows members in order with unwritten positions as quiet placeholders, and series context inside the reader.

## ADDED Requirements

### Requirement: Lattice series filter
The lattice SHALL offer a series filter listing every registry series by canonical name. Selecting a series SHALL set `?series={series-id}` on `/lattice`, and loading `/lattice?series={series-id}` SHALL select it. While a series is selected, the lattice SHALL show a short header (series name, how many positions are published out of the total, and a link to any companion text or compilation PDF), then the corridor. The reading-progress filters SHALL continue to work within the corridor.

#### Scenario: Deep link to a corridor
- **WHEN** a visitor opens `/lattice?series=the-codices-of-harmonic-activation`
- **THEN** the Harmonic Activation corridor is shown with header "The Codices of Harmonic Activation" and "6 of 7 written"

#### Scenario: Clearing the filter
- **WHEN** the visitor clears the series filter
- **THEN** the URL drops `series` and the full lattice returns

### Requirement: Corridor order and placeholders
A selected corridor SHALL list positioned members and planned positions in position order, followed by unplaced members under an "Also in this series" heading, and then companion texts. A planned position SHALL render as a card with the same footprint as a codex card, showing the position ("Part 3 of 7"), the quoted title and subtitle, and the label "Not yet written". It has no cover image, no link to a reader, and no generated description.

#### Scenario: Placeholder in sequence
- **WHEN** the Harmonic Activation corridor is shown
- **THEN** the third card is "The Codex of the Spiral Species", labelled "Not yet written", between Resonant Action and The Spiral

#### Scenario: Placeholder is not a link
- **WHEN** a visitor activates a planned card
- **THEN** no navigation occurs

### Requirement: Planned positions stay out of the main grid
The unfiltered lattice, search results, and collection views MUST NOT show planned positions. Placeholders appear only inside a selected series corridor.

#### Scenario: All filter
- **WHEN** the lattice is shown with no series selected
- **THEN** no "Not yet written" card is present and the count equals the number of published codexes

### Requirement: Reader series context
When the open codex is a positioned member of a series, the reader SHALL show the series name and "Part {position} of {total}", linked to that series' corridor. Previous/next navigation SHALL follow series position order, skipping planned and unplaced entries. It SHALL show the neighbor on each side when one exists.

#### Scenario: Middle of a corridor
- **WHEN** a visitor reads The Codex of the Spiral (position 4 of 7)
- **THEN** the reader shows "The Codices of Harmonic Activation · Part 4 of 7", previous is The Codex of Resonant Action, and next is The Codex of Quantum Kin

#### Scenario: First member
- **WHEN** a visitor reads the position-1 member of a series
- **THEN** there is no previous link and the next link is the next positioned member

### Requirement: Cards use canonical series names
Codex cards and the reader SHALL label series using the registry's canonical name, never an alias.

#### Scenario: Alias not shown
- **WHEN** a member's legacy series name was "Harmonic Activation"
- **THEN** its card's series line reads "The Codices of Harmonic Activation · Part n of 7"
