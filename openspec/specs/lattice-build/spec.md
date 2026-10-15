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

### Requirement: Build resolves series through the registry
The lattice build SHALL read the series registry, fail when a catalog series reference does not resolve (see codex-catalog), and publish each codex's series as `{ id, name, position, total }` using the canonical record. It SHALL also publish the registry itself (with planned positions, aliases, companions, and compilation PDF) as generated JSON for the app and API.

#### Scenario: Unresolved series fails the build
- **WHEN** a catalog entry names a series not in the registry
- **THEN** the build exits with an error naming the entry and the series

#### Scenario: Series published
- **WHEN** the build completes
- **THEN** the generated series JSON contains "The Codices of Harmonic Activation" with its planned position 3

### Requirement: Series siblings are in position order
The build SHALL publish, for each positioned series member, the ordered list of positioned member ids in its series (including itself) so previous/next navigation can be derived without re-sorting. Unplaced members and earlier editions SHALL NOT appear in that list.

#### Scenario: Ordered siblings
- **WHEN** the generated entry for The Codex of the Spiral is read
- **THEN** its ordered series list is positions 1, 2, 4, 5, 6, 7 of Harmonic Activation, with the Spiral itself included

### Requirement: Build publishes edition links
The build SHALL publish `laterEditionId` on earlier editions and `earlierEditionIds` on later editions.

#### Scenario: Reverse link derived
- **WHEN** the catalog records only the earlier → later link
- **THEN** the generated later edition lists the earlier edition in `earlierEditionIds`

### Requirement: Published metadata carries attribution and review status
Each generated lattice entry (full and meta) SHALL include `author` (from the catalog), `canonicalUrl` (`{base}/codex/{id}`, with the production base URL configurable at build), and `metadataStatus` (`draft` when the catalog entry has `needs_review: true`, otherwise `reviewed`). The API endpoints SHALL serve these fields unchanged.

#### Scenario: Meta endpoint shows status
- **WHEN** a client requests `/api/codex-lattice-meta`
- **THEN** each entry includes `author`, `canonicalUrl`, and `metadataStatus`

#### Scenario: Base URL is configurable
- **WHEN** the build runs with a preview base URL configured
- **THEN** `canonicalUrl` values still use the production base `https://alignos.io` unless the canonical base is explicitly overridden

