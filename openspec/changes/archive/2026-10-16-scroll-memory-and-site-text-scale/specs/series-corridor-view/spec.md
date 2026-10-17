## MODIFIED Requirements

### Requirement: Lattice series filter
The lattice SHALL offer a series filter listing every registry series by canonical name. Selecting a series SHALL set `?series={series-id}` on `/lattice`, and loading `/lattice?series={series-id}` SHALL select it. Unless that series is already the remembered lattice scope, loading it SHALL also reset the reading-progress filter to Any progress, open at the top of the lattice, and become the remembered lattice state (see Lattice memory). While a series is selected, the lattice SHALL show a short header (series name, how many positions are published out of the total, and a link to any companion text or compilation PDF), then the corridor. The reading-progress filters SHALL continue to work within the corridor. The filter can be cleared from the corridor header or from the lattice reset control.

#### Scenario: Deep link to a corridor
- **WHEN** a visitor whose remembered lattice scope is Everything opens `/lattice?series=the-codices-of-harmonic-activation`
- **THEN** the Harmonic Activation corridor is shown with header "The Codices of Harmonic Activation" and "6 of 7 written", with Any progress, at the top of the lattice

#### Scenario: Clearing the filter
- **WHEN** the visitor clears the series filter
- **THEN** the URL drops `series` and the full lattice returns

#### Scenario: Works outside every series
- **WHEN** a visitor chooses "Not in a series" (`/lattice?series=none`)
- **THEN** the lattice shows only codexes that are neither series members (positioned or unplaced) nor earlier editions of a series member, under the header "Not in a series" with their count, and the progress filters count within that set

#### Scenario: Corridor is remembered
- **WHEN** a visitor selects a series corridor, opens one of its codexes, and returns to `/lattice` from the header
- **THEN** the same corridor is shown and the URL includes `?series={series-id}`
