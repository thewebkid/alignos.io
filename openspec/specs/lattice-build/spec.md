# lattice-build Specification

## Purpose
Defines how the generated lattice JSON and Codex objects are produced from the catalog plus markdown content, so the app and public API publish catalog metadata without parsing identity from markdown.
## Requirements
### Requirement: Lattice generation is catalog-driven
The lattice build SHALL join each catalog entry to its markdown body by catalog `id`. It SHALL extract body-only features from markdown (glossary terms, registry section, special sections, word count) and MUST NOT parse identity, tone marker, series, or cover filename from markdown headings, filenames, or inlined cover `<img>` tags.

#### Scenario: Generated meta includes catalog fields
- **WHEN** `codex-lattice-meta.json` is generated
- **THEN** each entry includes at least `id`, `title`, `subtitle`, `sequence`, `series`, `structuralRole`, `toneMarker`, `tags`, `description`, `entryPoint`, `pullQuote`, `coverImage`, thumbnail URL, `wordCount`, and `readingTime`

#### Scenario: Cover path comes from catalog
- **WHEN** a markdown file still contains an old Azure cover `<img>` tag
- **THEN** the generated lattice `coverImage` is the catalog cover path, not the markdown image src

### Requirement: Markdown remains content-only
Published markdown files SHALL NOT require YAML frontmatter. Identity metadata MUST live in the catalog. Markdown MAY still contain a Codex Registry section used for body extraction.

#### Scenario: Build succeeds without frontmatter
- **WHEN** a markdown file has no YAML frontmatter and is named `{catalog-id}.md`
- **THEN** the lattice build includes that codex using catalog metadata and the markdown body

### Requirement: Codex objects expose catalog metadata
The in-app Codex model SHALL expose catalog fields to views (`toneMarker`, `description`, `structuralRole`, `entryPoint`, `pullQuote`, `tags`) so cards, reader, search, and API consumers can read them without a second lookup.

#### Scenario: Card can read tone marker from the Codex
- **WHEN** the lattice grid renders a CodexCard
- **THEN** `codex.toneMarker` is the catalog/v2 value for that id

### Requirement: Public API uses the rebuilt lattice
`GET /api/codex-lattice`, `GET /api/codex-lattice-meta`, and `GET /api/codex/{id}` SHALL serve the catalog-driven generated JSON. Unknown new ids return 404. Old ids are handled by redirects (see asset-identity), not by dual publication of both ids in the lattice array.

#### Scenario: New id is served
- **WHEN** a client requests `/api/codex/between-the-whole-and-the-relational`
- **THEN** the response is 200 with that catalog entry's published object

#### Scenario: Old id is not a second lattice row
- **WHEN** the lattice array is loaded
- **THEN** it contains the new id only, not a duplicate row for the old id

