## Purpose

Represents James' curated lists (Papers, Return Room readings, Featured Writings, the home spotlight) as data, so the same ordered list with his notes drives pages, the lattice filter, and AI-readable outputs.

## ADDED Requirements

### Requirement: Collections are committed data
The system SHALL keep a committed collections file. Each collection SHALL have a kebab-case `id`, `title`, optional `subtitle`, optional `intro` (verbatim), optional `registry_name` (the name James' registries use for it), `show_in_lattice` (boolean), a `source` citing the legacy page it comes from, and ordered `items`. Each item references exactly one of a catalog `codex` id or a registry `series` id, and MAY carry a verbatim `note`, an optional `tagline`, and an optional `group` label.

#### Scenario: Papers collection
- **WHEN** the `papers` collection is read
- **THEN** it lists, in order, `between-worlds-the-architecture-of-the-third-structure`, `framing-the-mirror`, `the-craftsman-of-the-invisible-frame`, `when-ai-remembers-the-field`, `the-rise-of-the-interface-civilizations`, has `registry_name` "Harmonic Topical Papers", and each item's tagline and note match the legacy Papers page

### Requirement: Collections are validated at build
The lattice build SHALL fail if a collection item references an unknown catalog id or series id, or if a collection id is duplicated. Collection order is independent of catalog `sequence`.

#### Scenario: Unknown id fails
- **WHEN** a collection item references a codex id not in the catalog
- **THEN** the build exits with an error naming the collection and id

### Requirement: Initial collections
The system SHALL ship these collections, sourced from the legacy pages:

| id | Source | In lattice |
|---|---|---|
| `papers` | Papers page, items 1–5 | yes |
| `return-room-readings` | Return Room "Recommended Codices" (three ✧ readings, then items 1–4; *To Serve the Recursion of Love* noted optional) | yes |
| `featured-writings` | Home "Featured Writings" (*The Untitled Offering*, *The Fundamental Arc*, *The Evolution of the Sovereign* series) | yes |
| `home-spotlight` | Home spotlight (*The Ecology of Becoming*) | no |

#### Scenario: Return Room readings include a series
- **WHEN** `return-room-readings` is read
- **THEN** it contains the series `the-evolution-of-the-sovereign` as an item, with James' note "(Why this matters, and how return happens through identity and trust)"

### Requirement: Lattice collection filter
The lattice SHALL offer a collection filter listing collections with `show_in_lattice: true`. Selecting one SHALL set `?collection={id}` on `/lattice`, and loading that URL SHALL select it. The filtered grid SHALL show the collection's codexes in collection order. Series items SHALL expand to that series' positioned members in position order, with no planned positions. A collection and a series filter MUST NOT be active at the same time; selecting one clears the other.

#### Scenario: Papers in the lattice
- **WHEN** a visitor opens `/lattice?collection=papers`
- **THEN** exactly the five Papers are shown, in Papers order

#### Scenario: Series item expands
- **WHEN** a visitor opens `/lattice?collection=return-room-readings`
- **THEN** the seven published Evolution of the Sovereign codexes appear in position order where that series item sits, and Codex VI's placeholder does not appear
