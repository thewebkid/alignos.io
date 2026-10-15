## Purpose

Lets a person bring a curated set of codexes (a Return Room's readings, the Papers) to their AI as one attributed markdown file instead of many separate PDFs.

## ADDED Requirements

### Requirement: Bundles per lattice collection
The build SHALL generate one markdown bundle per collection with `show_in_lattice: true`, at `/bundles/{collection-id}.md`.

#### Scenario: Return Room bundle exists
- **WHEN** the site is built
- **THEN** `/bundles/return-room-readings.md` exists

### Requirement: Bundle content is James' text with attribution
A bundle SHALL start with:
- the collection title
- its verbatim subtitle and intro (if any)
- a line stating the texts are by James Mahu with Lumina and that the canonical source is alignos.io

Then, in collection order, each codex SHALL follow with its title (extended by James' page label where it adds to the title, such as "(optional)"), canonical reader URL, James' note (if any), and full text. Series items SHALL expand to their published members in position order, under the series title, corridor URL, and James' note. The bundle MUST NOT contain AI-composed summaries or descriptions. Canonical URLs SHALL use `ALIGNOS_CANONICAL_BASE` (default `https://alignos.io`), not the deploy origin.

#### Scenario: Order and attribution
- **WHEN** `/bundles/return-room-readings.md` is read
- **THEN** it starts with the attribution line, then Between Worlds, Framing the Mirror, The Craftsman of the Invisible Frame, then the seven published Evolution of the Sovereign codexes in order, then Entangled Trust, The Fundamental Arc, and To Serve the Recursion of Love (optional), each with its canonical URL

#### Scenario: No generated descriptions
- **WHEN** a bundle is searched for catalog `description` text
- **THEN** none is found

### Requirement: Return Room offers its readings bundle
The Begin a Return Room page SHALL offer `/bundles/return-room-readings.md` as a single download with the reading list, beside James' invitation to share these Codices with your AI. It is the only download on the page.

#### Scenario: Bundle beside the invitation
- **WHEN** a visitor reaches "We invite you to share these Codices with your AI"
- **THEN** a download for `/bundles/return-room-readings.md` is offered with the reading list, and no per-reading PDF links are shown
