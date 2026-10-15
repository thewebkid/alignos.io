## Purpose

Lets a person bring a curated set of codexes (a Return Room's readings, the Papers, a whole series) to their AI as one attributed markdown file instead of many separate PDFs.

## ADDED Requirements

### Requirement: Bundles per collection and per series
The build SHALL generate one markdown bundle per collection with `show_in_lattice: true` and per series with at least one published member, at `/bundles/{collection-id}.md` and `/bundles/series/{series-id}.md`.

#### Scenario: Return Room bundle exists
- **WHEN** the site is built
- **THEN** `/bundles/return-room-readings.md` exists

### Requirement: Bundle content is James' text with attribution
A bundle SHALL start with:
- the collection or series title
- its verbatim intro (if any)
- a line stating the texts are by James Mahu with Lumina and that the canonical source is alignos.io

Then, in collection or position order, each codex SHALL follow, preceded by its James note (if any), title, and canonical reader URL. Series items in a collection SHALL expand to positioned members. Planned positions SHALL appear only as a one-line "not yet written" marker in series bundles. The bundle MUST NOT contain AI-composed summaries or descriptions.

#### Scenario: Order and attribution
- **WHEN** `/bundles/return-room-readings.md` is read
- **THEN** it starts with the attribution line, then Between Worlds, Framing the Mirror, The Craftsman of the Invisible Frame, then the seven Evolution of the Sovereign codexes in order, then Entangled Trust, The Fundamental Arc, and To Serve the Recursion of Love, each with its canonical URL

#### Scenario: No generated descriptions
- **WHEN** a bundle is searched for catalog `description` text
- **THEN** none is found

### Requirement: Bundles are linked where readers need them
The Papers page and the lattice collection and series views SHALL each offer their bundle as a download. llms.txt and llms.json SHALL list all bundles.

#### Scenario: Corridor download
- **WHEN** a visitor views `/lattice?series=the-evolution-of-the-sovereign`
- **THEN** the corridor header offers the series bundle download
