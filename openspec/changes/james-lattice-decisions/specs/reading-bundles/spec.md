## MODIFIED Requirements

### Requirement: Bundles per series
The build SHALL generate one markdown bundle per series with at least one published member, at `/bundles/series/{series-id}.md`, in the same format as collection bundles: the series name, an attribution line naming James Mahu with Lumina and alignos.io as the canonical source, then each published member in position order with its title, canonical reader URL, and full text. A planned position SHALL appear only as a one-line "not yet written" marker, with no body and no reader link, using the registry title. The bundle MUST NOT contain AI-composed summaries or descriptions.

#### Scenario: Series bundle order
- **WHEN** `/bundles/series/the-evolution-of-the-sovereign.md` is read
- **THEN** it lists the published codices in position order, and the position-6 line reads "The Architecture of Presence" marked "not yet written", with no body and no reader link
