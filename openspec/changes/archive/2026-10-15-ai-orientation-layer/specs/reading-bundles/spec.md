## ADDED Requirements

### Requirement: Bundles per series
The build SHALL generate one markdown bundle per series with at least one published member, at `/bundles/series/{series-id}.md`, in the same format as collection bundles: the series name, an attribution line naming James Mahu with Lumina and alignos.io as the canonical source, then each published member in position order with its title, canonical reader URL, and full text. Planned positions SHALL appear only as a one-line "not yet written" marker. The bundle MUST NOT contain AI-composed summaries or descriptions.

#### Scenario: Series bundle order
- **WHEN** `/bundles/series/the-evolution-of-the-sovereign.md` is read
- **THEN** it lists Codex I through VIII in order, with Codex VI as a "not yet written" marker and no body

### Requirement: Bundles are linked in the lattice and listed for machines
The lattice collection and series views SHALL each offer their bundle as a download. llms.txt and llms.json SHALL list all bundles. Pages other than the Return Room MUST NOT offer bundle downloads.

#### Scenario: Corridor download
- **WHEN** a visitor views `/lattice?series=the-evolution-of-the-sovereign`
- **THEN** the corridor header offers the series bundle download
