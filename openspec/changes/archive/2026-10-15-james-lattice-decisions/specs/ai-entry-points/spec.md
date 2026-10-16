## MODIFIED Requirements

### Requirement: llms.txt is generated and accurate
The build SHALL generate `/llms.txt` following the llmstxt.org structure:
- an H1 "Alignos"
- a blockquote summary using James' own words from the home page ("Alignos is a field of remembrance. Not a system to follow, but a resonance to return to.")
- a short orientation section
- link sections

The link sections SHALL include, at minimum:
- **Start here:** Before You Begin…, Begin a Return Room, and FAQ (raw markdown and page URLs).
- **Codexes:** every published codex, with a raw markdown link, a reader URL, and its pull quote as the link note.
- **Series:** each series corridor URL with the count of published codices. Planned positions are listed as "not yet written" and are not links.
- **Collections and bundles.**
- **API:** the existing JSON endpoints and `/llms.json`.
- **Optional:** `/llms-full.txt`.

All counts SHALL be computed from the catalog at build time.

#### Scenario: Counts match the catalog
- **WHEN** the catalog has 138 published entries
- **THEN** llms.txt lists 138 codex links and states 138, with no hard-coded count elsewhere

#### Scenario: Planned position is labelled
- **WHEN** llms.txt lists The Codices of Harmonic Activation
- **THEN** "The Codex of the Spiral Species" appears marked "not yet written" with no link

#### Scenario: Corrected unwritten title
- **WHEN** llms.txt lists The Evolution of the Sovereign
- **THEN** the unwritten position is "The Architecture of Presence" marked "not yet written", and "The Function of Presence" does not appear

### Requirement: llms-full.txt carries the full public text
The build SHALL generate `/llms-full.txt` containing the orientation, the guidance pages' text, and every published codex's full markdown. Each codex SHALL be preceded by a header with its title, author, canonical reader URL, and series context. Unpublished or planned works MUST NOT appear except as titled "not yet written" entries in the series listing, using the registry title, with no body.

#### Scenario: Codex header
- **WHEN** llms-full.txt is searched for The Fundamental Arc
- **THEN** its text is preceded by its title, "James Mahu with Lumina", and `https://alignos.io/codex/the-fundamental-arc`

#### Scenario: Unwritten title in the full file
- **WHEN** llms-full.txt lists The Evolution of the Sovereign
- **THEN** "The Architecture of Presence" appears as "not yet written" with no body
