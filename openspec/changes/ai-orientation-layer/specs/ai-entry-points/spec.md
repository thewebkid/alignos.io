## Purpose

Gives AI readers a simple, accurate, attributed way into Alignos: generated llms files, raw markdown for pages and codexes, and discovery tags. It treats the codex text as canonical and AI-assisted metadata as hypothesis.

## ADDED Requirements

### Requirement: llms.txt is generated and accurate
The build SHALL generate `/llms.txt` following the llmstxt.org structure:
- an H1 "Alignos"
- a blockquote summary using James' own words from the home page ("Alignos is a field of remembrance. Not a system to follow, but a resonance to return to.")
- a short orientation section
- link sections

The link sections SHALL include, at minimum:
- **Start here:** Before You Begin…, Begin a Return Room, and FAQ (raw markdown and page URLs).
- **Codexes:** every published codex, with a raw markdown link, a reader URL, and its pull quote as the link note.
- **Series:** each series corridor URL with "n of N written". Planned positions are listed as "not yet written".
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

### Requirement: Orientation states canonicity and metadata status
The orientation text in llms.txt and llms.json SHALL state, in plain factual language:
- the codex texts are by James Mahu with Lumina, and the live site is the canonical source
- tone markers, descriptions, tags, structural roles, and series placements are AI-assisted readings, which are hypotheses rather than source truth
- entries marked draft have not yet been reviewed by the author
- readers should give humans `/codex/{id}` links and attribute quotations

The orientation MUST NOT contain mythopoetic or interpretive copy about the work itself.

#### Scenario: Draft status visible
- **WHEN** an AI reads the llms.json entry for `the-ecology-of-becoming` while it has `needs_review: true`
- **THEN** its `metadataStatus` is `draft`

### Requirement: llms.json is generated
`/llms.json` SHALL be generated at build. It SHALL contain:
- site name "Alignos", base URL, and generation timestamp
- the orientation statements
- endpoints with their actual sizes
- every published codex with `id`, `title`, `subtitle`, `author`, `sequence`, `toneMarker`, `structuralRole`, `series` (`id`, `name`, `position`, `total`), `collections` (ids), `tags`, `pullQuote`, `description`, `metadataStatus`, reader URL, and raw markdown URL
- the series registry (with planned positions), collections, and bundle URLs

The hand-written file SHALL be removed.

#### Scenario: Tone and series present
- **WHEN** llms.json is read
- **THEN** `the-codex-of-the-spiral` has a `toneMarker`, and `series` is `{ id: "the-codices-of-harmonic-activation", position: 4, total: 7, … }`

### Requirement: llms-full.txt carries the full public text
The build SHALL generate `/llms-full.txt` containing the orientation, the guidance pages' text, and every published codex's full markdown. Each codex SHALL be preceded by a header with its title, author, canonical reader URL, and series context. Unpublished or planned works MUST NOT appear except as titled "not yet written" entries in the series listing.

#### Scenario: Codex header
- **WHEN** llms-full.txt is searched for The Fundamental Arc
- **THEN** its text is preceded by its title, "James Mahu with Lumina", and `https://alignos.io/codex/the-fundamental-arc`

### Requirement: Raw markdown is addressable
Each published codex's markdown SHALL be served at `/md/{id}.md`. Each guidance page's markdown SHALL be served at `/pages/{slug}.md`, with `collection` blocks expanded to plain markdown lists and `prompt` blocks kept as quoted text.

#### Scenario: Page markdown
- **WHEN** a client fetches `/pages/faq.md`
- **THEN** it receives the FAQ text as markdown, including the prompts as readable text

### Requirement: Discovery tags
Every page SHALL include a head link to `/llms.txt`. Each reader page SHALL include `<link rel="alternate" type="text/markdown" href="/md/{id}.md">`.

#### Scenario: Reader alternate link
- **WHEN** the static HTML for `/codex/the-fundamental-arc` is fetched
- **THEN** its head contains an alternate markdown link to `/md/the-fundamental-arc.md`

### Requirement: Exports carry attribution
The reader's copy-markdown and download-markdown outputs SHALL begin with the codex title, "James Mahu with Lumina", and the canonical reader URL, and SHALL end with a pointer to `/llms.txt`. They MUST NOT reference `/llms.json` as the entry point.

#### Scenario: Copied markdown
- **WHEN** a visitor copies a codex's markdown
- **THEN** the clipboard text includes the canonical URL near the top and `/llms.txt` at the end
