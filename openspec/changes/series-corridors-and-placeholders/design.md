## Context

- Catalog entries carry `series: { name, position, total }` as free text. Current series names and problems:
  - **Evolution of the Sovereign**: 7 of 8; position 6 missing (Codex VI).
  - **Harmonic Activation**: seq 64/66/104 at positions 4/2/7.
  - **The Codices of Harmonic Activation**: seq 65 (glossary), seq 95; no positions.
  - **The Harmonic Principles of the Field**: seq 60 only.
  - **The Codices of Planetary Service**: seq 31/57/58; positions null.
  - **Trans-Species Resonance**: seq 59/77; positions null.
  - **Harmonic Topical Papers**: seq 137; null/null.
  - Architecture of Love, InterBeing, Realized Flame, Agency of One, Glossary of the InterBeing: complete as far as the audit CSV shows.
- The series preface printed in seq 65 (`the-codex-of-harmonic-reality-…md`, lines 46–52) lists the Harmonic Activation corridor in order:
  1. Harmonic Service
  2. Resonant Action
  3. Spiral Species (*"Understanding evolution as a function of conscious recursion"*)
  4. The Spiral
  5. Quantum Kin
  6. Harmonic Coherence
  7. Entangled Trust
- Codex registries in seq 64/66/95/104 instead say "The Harmonic Principles of the Field", with numbering that doesn't always match (Quantum Kin "Entry III"; Resonant Action "II of VII", titled "Harmonic Motion").
- Edition pairs found by heading comparison:
  - **Living Harmonics.** Seq 75 (`the-codex-of-harmonic-service-latticework-…`) and seq 76 (`the-codex-of-living-harmonics`) both open "# The Codex of Living Harmonics" with the same section sequence. Seq 75's cover carried "Harmonic Service".
  - **Love's Architecture.** Seq 106 (`the-codex-of-harmonic-coherence`) and seq 48 (`the-codex-of-loves-architecture`) likewise. Seq 106's cover carried "Harmonic Coherence".
  - James (May 24) called the renames intentional; older names have "archaeological value" and "should gradually be reconciled".
- The registry in seq 137 states the Interface Trilogy: When AI Remembers the Field (1), The Rise of the Interface Civilizations (2), "the forthcoming *The Architecture of Listening*" (3). "Harmonic Topical Papers" is its registry series label for the topical-paper family.
- Build: `build-lattice.js` groups siblings by `series.name` in sequence order and excludes self from `siblingIds`. `ReaderView` looks up the current id in that list, so "previous" never appears and "next" is always the first sibling. That bug is fixed here.
- `client/src/lib/series-detector.js` hard-codes series lists. It is exported from `lib/index.js`, but no view uses it.

## Goals / Non-Goals

**Goals:**
- Corridors that show James exactly what exists, what is missing, and what we inferred.
- No invented content: every name, order, title, and subtitle is quoted from James' text and cited.

**Non-Goals:**
- Writing or summarizing missing works.
- A dedicated `/series/{id}` page. The lattice filter is enough for staging.
- Tone-marker views or registry browsing. Those are possible later lattice-view work.
- Hiding earlier editions. That's James' call after staging.

## Decisions

### D1. Registry as `data/series.json`; catalog keeps its `series` shape
The catalog keeps `series: { name, position, total }`, so cards, overlay, and API shapes don't churn. `name` must now equal a canonical registry name, and the build adds `series.id`.
- *Alternative:* replace catalog `series` with a `series_id` reference. Cleaner, but it touches every consumer for no visible gain now.

Record shape:
```json
{
  "id": "the-codices-of-harmonic-activation",
  "name": "The Codices of Harmonic Activation",
  "aliases": ["Harmonic Activation", "The Harmonic Principles of the Field"],
  "total": 7,
  "companion_ids": ["the-codex-of-harmonic-reality-why-the-field-is-not-a-simulation"],
  "compilation_pdf": null,
  "planned": [
    { "position": 3, "title": "The Codex of the Spiral Species",
      "subtitle": "Understanding evolution as a function of conscious recursion",
      "source": "Series preface, the-codex-of-harmonic-reality-…md L46–52" }
  ],
  "source": "Series preface printed in the companion glossary",
  "needs_review": true,
  "review_notes": "Merged catalog names …; registries use 'The Harmonic Principles of the Field' with differing numbering …"
}
```

### D2. Planned positions live only in the registry
Making them catalog entries would break the "catalog = published corpus" invariant, the asset-identity rules (no md/pdf/cover), counts in `llms.json`, search, and the build's markdown requirement. The registry is the natural home, and the corridor view is the only place they render.

### D3. Harmonic Activation mapping
| Pos | Catalog id | Note |
|---|---|---|
| 1 | `the-codex-of-living-harmonics` (76) | later edition of seq 75 |
| 2 | `the-codex-of-resonant-action` (66) | |
| 3 | planned: The Codex of the Spiral Species | |
| 4 | `the-codex-of-the-spiral` (64) | |
| 5 | `the-codex-of-quantum-kin` (95) | registry says "Entry III" → review note |
| 6 | `the-codex-of-loves-architecture` (48) | later edition of seq 106 |
| 7 | `the-codex-of-entangled-trust` (104) | |
| companion | `the-codex-of-harmonic-reality-…` (65) | stays `structural_role: glossary` |
| unplaced | `the-codex-of-nonlocal-memory` (60) | registry names the alias series |

Seq 75 and 106 drop their series membership and become earlier editions (D5).

### D4. Other registry records
- **The Evolution of the Sovereign.** Canonical name taken from the home page and compilation PDF title. Alias "Evolution of the Sovereign". Total 8; planned position 6 "Codex VI: The Function of Presence", with subtitle from the Codex VI references in the other seven registries. `compilation_pdf: "the-evolution-of-the-sovereign.pdf"`, renamed by `site-shell-and-brand`. Its id doubles as the compilation basename.
- **The Interface Trilogy.** Total 3; members 136 (1) and 137 (2); planned 3 "The Architecture of Listening", with no subtitle because none is stated. Seq 137 moves off "Harmonic Topical Papers". That label is recorded as the Papers collection's registry name in `legacy-pages-and-collections`, not as a series.
- **All other catalog series** get a record. Positions and totals are fixed only where a registry or preface states them (task 2.1 audit). The rest stay null and go on the question list.

### D5. Editions: `later_edition_id` on the earlier entry; build derives the reverse
- Which text is "later" is our inference from the cover titles and James' rename note, so both pairs are `needs_review`.
- Task 3.1 diffs each pair. If the diff contradicts the cover evidence, the pair goes to James with no default.
- The audit also checks pairs by normalized title and section-heading similarity (≥ 0.8 Jaccard on H2/H3 headings), for example Resonant Memory / Language of Resonance.
- Marker UI: a small "Earlier edition" tag on the card (outside the cover art, alongside the existing progress affordances) and a notice at the top of the reader. The later edition gets a quiet "Earlier edition: {title}" link beside the series context.

### D6. Lattice filter UI
- A series `<select>` (or Bootstrap dropdown) sits beside the existing progress chips, driven by `?series=`.
- The corridor header and placeholder card (`PlannedCard.vue`) match the `CodexCard` footprint: no cover; a quiet surface in existing `--cl-*` tokens with position, quoted title and subtitle, and "Not yet written".
- The Kimi K3 (`kimi-k3-max`) visual pass covers the placeholder card, edition marker, and corridor header within the existing SCSS.

### D7. Descriptions rewritten by Grok 4.7 high
A `grok-4.7-high` subagent rewrites descriptions for seq 136–139.
- **Inputs:** each codex's markdown, plus 10 approved v2 descriptions chosen across roles and tones as register examples.
- **Constraints:** no new claims beyond the text; similar length to the examples; second-person and atmospheric where the examples are.
- The agent leaves `needs_review: true` and appends a review note. I review the output before it's committed, against the approved examples and the codex text.

### D8. The James question list is generated, then hand-edited
`scripts/audit-series.js` writes the mechanical parts (planned positions, unplaced members, null positions, alias conflicts, edition pairs, `needs_review` entries) to `docs/review/james-questions.md`. Ron adds framing before sending. The file is committed so it can be diffed after James replies.

## Risks / Trade-offs

- [Edition direction is wrong] → It's flagged for review. Swapping is a two-field data edit plus a rebuild.
- [Merging Activation and Principles is wrong (they may be distinct corridors)] → Aliases are recorded rather than discarded, `needs_review` explains the merge, and splitting later is a registry edit.
- [Placeholders read as promises] → They show only James' quoted title and "Not yet written", and only inside a corridor. Nothing is composed.
- [Retiring `series-detector.js` breaks an import] → Grep shows no view uses it. Remove the exports from `lib/index.js` along with it.

## Migration Plan

Data-first: registry and catalog edits, then the build, then the UI. Each step rebuilds the lattice and keeps the site working. Rollback is a git revert of data and UI; generated files are rebuilt.
