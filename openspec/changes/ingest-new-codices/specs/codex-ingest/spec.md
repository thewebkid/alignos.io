## Purpose

Defines how a newly published James Mahu work (PDF) becomes a published lattice entry without losing fidelity to the source text, and while keeping AI-drafted metadata distinguishable from authored content.

## ADDED Requirements

### Requirement: Markdown is a verbatim, content-only rendering of the PDF
Each ingested codex SHALL have `client/public/md/{id}.md` whose text matches the source PDF verbatim, including wording, punctuation, capitalization, emphasis, ornament glyphs, and intentional line breaks. The file MUST NOT contain YAML frontmatter, an inlined cover image, page numbers, or running headers.

#### Scenario: Poetic line breaks survive
- **WHEN** the PDF prints a stanza or short-line passage (lines set with soft returns, no paragraph spacing)
- **THEN** the markdown preserves each line as a hard break rather than joining them into one paragraph

#### Scenario: Paragraph spacing survives
- **WHEN** the PDF sets consecutive lines with paragraph spacing between them
- **THEN** the markdown separates them with a blank line (separate paragraphs), never hard breaks within one paragraph, including across page boundaries

#### Scenario: Word wraps are joined
- **WHEN** a PDF line ends only because it reached the right margin
- **THEN** the markdown joins it with the next line using a single space

#### Scenario: No identity in markdown
- **WHEN** the markdown is read by the lattice build
- **THEN** it contains no frontmatter and no cover `<img>`, and identity comes only from the catalog

### Requirement: Print-only content is removed
The markdown SHALL omit content that exists only because the PDF is a standalone, shareable document: cover page text, tables of contents, "Note to Readers" and other cross-promotion blocks (e.g. pointers to Alignos.io or CoherenceAcrossScales.org), running headers, page numbers, page references, and download/print instructions. Removal SHALL be the only permitted deviation from the source text, and each removal SHALL be reported during ingestion.

#### Scenario: Promo block is removed
- **WHEN** the PDF contains a "Note to Readers" page pointing to Alignos.io or CoherenceAcrossScales.org
- **THEN** none of that page's text appears in the markdown

#### Scenario: TOC is removed but informs structure
- **WHEN** the PDF contains a table of contents
- **THEN** the TOC text does not appear in the markdown, and the sections it lists are the `##` headings

#### Scenario: Fidelity is provable
- **WHEN** the markdown is word-diffed against the PDF text (minus running headers and page numbers)
- **THEN** every difference is either a reported print-only removal or a house-style formatting addition (the `#` title, a numeral period, a speaker colon)

### Requirement: Ingested entries carry provenance-labelled metadata
Each ingested catalog entry SHALL take `title`, `subtitle`, `author`, and `pull_quote` verbatim from the source. Any field drafted by an AI (`tone_marker`, `structural_role`, `entry_point`, `tags`, `description`) SHALL be marked with `needs_review: true` and a `review_notes` string naming which fields are AI-drafted hypotheses pending James' review.

#### Scenario: Pull quote is verbatim
- **WHEN** a consumer searches the codex markdown for the entry's `pull_quote`
- **THEN** the exact string is found

#### Scenario: AI-drafted fields are flagged
- **WHEN** a consumer reads an ingested entry whose tone marker was drafted by an AI
- **THEN** `needs_review` is `true` and `review_notes` names `tone_marker` as an AI-drafted hypothesis

#### Scenario: Enumerated fields use existing vocabularies
- **WHEN** an ingested entry is validated
- **THEN** `structural_role` and `entry_point` are values already used in the catalog, and any `tone_marker` not already in the catalog is called out in `review_notes`

### Requirement: Ingestion records provenance
Each ingested codex SHALL have an `added` row in `data/codex-provenance.json` recording the date and source (URL or email), and a catalog `provenance` block whose `old_cover_filename` names the source PDF.

#### Scenario: Source is traceable
- **WHEN** a reader asks where an ingested codex came from
- **THEN** the provenance row gives the live-site URL or the email date it was received

### Requirement: The codex id is the asset identity
Each codex `id` SHALL be the kebab-case form of its source title (lowercase, words joined by `-`, no trailing number artifacts; e.g. `THE-FUNDAMENTAL-ARC.pdf` → `the-fundamental-arc`), and every asset SHALL use that id as its basename:

| Asset | Path |
|---|---|
| Markdown | `client/public/md/{id}.md` |
| PDF | `client/public/pdf/{id}.pdf` |
| Cover | `client/public/covers/{id}.jpg` |
| Thumbnail | `client/public/thumb/{id}.jpg` |
| Original cover (with text) | `blobs/originals/{id}.jpg` |

The catalog entry SHALL reference those same paths (`assets.markdown`, `assets.pdf`, `cover.url`, `cover.thumb_url`), and no published asset folder SHALL contain a file whose basename is not a catalog id.

#### Scenario: All four assets share the id
- **WHEN** a codex with id `the-fundamental-arc` is published
- **THEN** `md/the-fundamental-arc.md`, `pdf/the-fundamental-arc.pdf`, `covers/the-fundamental-arc.jpg`, and `thumb/the-fundamental-arc.jpg` all exist and the catalog points at them

#### Scenario: Source filenames are normalized
- **WHEN** a source PDF is named with spaces, capitals, or underscores (e.g. `The Ecology of Becoming.pdf`)
- **THEN** it is renamed to `{id}.pdf` and no file with the original name remains in `client/public/pdf/`

### Requirement: Covers are free of baked-in text
Published covers and thumbnails SHALL contain no text baked into the image. Title, subtitle, and tone marker are rendered only as HTML overlays so the page stays translatable. The cover SHALL be extracted from the PDF, kept with its text in `blobs/originals/{id}.jpg`, scrubbed of all text to produce `covers/{id}.jpg`, and the thumbnail SHALL be generated from the scrubbed cover.

#### Scenario: Thumb derives from the scrubbed cover
- **WHEN** a thumbnail is generated
- **THEN** its source is `covers/{id}.jpg` (text-free), never the original

#### Scenario: No text-free cover yet
- **WHEN** an ingested codex has no text-free cover available
- **THEN** the original is saved to `blobs/originals/{id}.jpg`, no cover or thumb containing text is published, and the ingestion reports the cover as pending text removal

### Requirement: Ingested codexes publish through the standard lattice build
Each ingested codex SHALL have a unique `id` and `sequence` and SHALL appear in the generated lattice, the metadata endpoint, and the SSG reader routes.

#### Scenario: Lattice includes new entries
- **WHEN** `npm run build:lattice` runs after ingestion
- **THEN** the build succeeds and `codex-lattice-meta.json` contains each new id exactly once

#### Scenario: Reader route exists
- **WHEN** the site is built with SSG
- **THEN** `/codex/{id}` is emitted for each ingested id