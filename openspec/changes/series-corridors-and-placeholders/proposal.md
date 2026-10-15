## Why

James calls series "developmental corridors", but the catalog stores a series as a free-text name on each entry, so corridors fragment:
- Harmonic Activation is split across two names, has three of its seven positions set, and is missing its third codex.
- Evolution of the Sovereign has no slot for its unwritten Codex VI.
- The two new Papers belong to an "Interface Trilogy" whose third paper doesn't exist yet.
- Two codexes appear twice in the lattice as near-identical editions under the same title.

We want James to see these corridors whole, including the gaps, so the staged site invites him to fill them rather than hiding them.

## What Changes

- Add a series registry (`data/series.json`) recording:
  - each series' canonical name, alternate names found in James' registries, total, and position order
  - companion texts and any compilation PDF
  - planned (unwritten) positions, with titles and subtitles quoted from James' own text
- Rebuild Harmonic Activation from James' printed preface as "The Codices of Harmonic Activation", seven positions:
  1. Harmonic Service / Living Harmonics
  2. Resonant Action
  3. *The Codex of the Spiral Species* (planned)
  4. The Spiral
  5. Quantum Kin
  6. Harmonic Coherence / Love's Architecture
  7. Entangled Trust
- "The Harmonic Principles of the Field" and "Harmonic Activation" become recorded alternate names. *The Codex of Harmonic Reality* becomes the series' companion glossary, not a numbered member.
- Add planned positions for *Codex VI: The Function of Presence* (Evolution of the Sovereign, position 6 of 8) and *The Architecture of Listening* (Interface Trilogy, position 3 of 3).
- Add an "Interface Trilogy" series for *When AI Remembers the Field* (1) and *The Rise of the Interface Civilizations* (2).
- Audit every series against the current catalog. Fix only what James' own registries state. Unknown positions stay unknown and go on the question list.
- Mark edition pairs:
  - The older text gets an "Earlier edition" marker linked to the later one, and both stay visible.
  - Series positions use the later edition.
  - Pairs confirmed so far: Living Harmonics (seq 75/76) and Love's Architecture (seq 106/48). The audit checks for more, e.g. Resonant Memory / Language of Resonance.
- Lattice gains a series filter that shows a corridor in position order. Planned positions appear as quiet "Not yet written" cards. The main "All" grid never shows planned positions.
- Reader shows the series name and position, linked to the corridor. Earlier/later edition links appear as an optional lineage layer.
- Rewrite the four new codexes' descriptions (seq 136–139) in the voice of the approved 134 (Grok 4.7 high, few-shot from approved entries). They stay `needs_review`.
- Produce `docs/review/james-questions.md`: the planned positions, edition pairs, unplaced members (e.g. *The Codex of Nonlocal Memory*), unknown orders, and every `needs_review` entry, for Ron to send to James.

## Capabilities

### New Capabilities
- `series-registry`: Canonical series records: names, alternate names, totals, ordering, companions, compilation assets, and planned positions.
- `series-corridor-view`: How a series is shown: lattice series filter, ordered corridor with planned cards, reader series context.
- `codex-editions`: Marking and linking earlier/later editions of the same work without hiding either.

### Modified Capabilities
- `codex-catalog`: Catalog count reflects the current corpus. Planned works are never catalog entries. Series references must resolve to the registry. AI-drafted metadata stays flagged until reviewed.
- `lattice-build`: Generated output carries series ids, registry-resolved series metadata, and edition links; the build validates series references.
- `asset-identity`: Series compilation PDFs are named by series id.

## Impact

- New `data/series.json`. Edits to `data/codex-catalog.json` (series references, positions, edition links, four descriptions) and `data/codex-provenance.json` (series renames, edition links).
- `client/scripts/build-lattice.js`, generated lattice JSON, `client/src/lib/codex.js`, `CodexLattice.vue`, `CodexCard.vue` / `CoverOverlay.vue` (edition marker), `ReaderView.vue` (series context, edition links). New planned-position card component.
- `client/src/lib/series-detector.js` (hard-coded series list) is retired from runtime use, since the registry replaces it.
- New `scripts/audit-series.js` and `docs/review/james-questions.md`.
- Downstream: `legacy-pages-and-collections` links to series by id; `ai-orientation-layer` publishes the registry, including planned positions.
