## Why

James reviewed the staged lattice on 15 Oct 2026 and asked us to proceed. The corridors should stay navigable without turning the writings' history into one perfectly consistent structure, and unwritten works should stay off the site until they arrive.

## What Changes

- Remove unwritten works from the lattice. No "Not yet written" cards, and a corridor header does not say "n of N written". The registry keeps the planned records so the works can be added when they arrive. The AI guide James approved still names those titles, unlinked, and the unwritten sixth Evolution of the Sovereign codex is named *The Architecture of Presence* wherever that record is shown.
- Keep confirmed numbered sequences in order: Planetary Service six and the three-part corridor stay separate, with the trilogy name kept as an editorial label; Architecture of Love stays 01–10; InterBeing stays I–IV; the Interface Trilogy stays the two published works in their current order; the InterBeing Glossary stays open-ended (`total` null).
- Show *The Four Frequencies of Love* as a related work of The Architecture of Love, not as a member and not with an invented position. The three additional InterBeing works stay with that series, unnumbered.
- Preserve original registry series statements as historical metadata when the catalog places a work in a different corridor. Do not create a corridor for every historical name.
- Edition links distinguish verified or author-confirmed chronology from uncertainty. The three pairs James confirmed stay earlier/later. The two pairs whose order is unknown are "Alternative version", with no earlier/later label.
- Evidence-supported placements James confirmed no longer keep an entry in draft. AI-written tone, description, tags, and structural role stay provisional and labeled draft. The site does not wait on those descriptions.
- Investigate sequence 18 from the source manifest and repository history. Do not invent a missing codex.

Copy, credit, Tone, home-first, and the AI orientation statements James marked YES are already on the site and do not change. *The Fundamental Arc* stays a single codex.

## Capabilities

### New Capabilities

- None. James's three relationships map onto the series registry, the corridor view, and edition links. The site's existing Collections (Return Room readings, Papers, Featured Writings) are a different thing and stay as they are.

### Modified Capabilities

- `series-registry`: Planned positions remain recorded and unpublished. Codex VI's recorded title is corrected. Related works are a registry link, not a numbered or unnumbered member. Author-confirmed records drop `needs_review`.
- `series-corridor-view`: A corridor shows published works only. Unwritten positions do not render. Related works are links. Unnumbered members stay unnumbered.
- `codex-editions`: Uncertain pairs use "Alternative version". Confirmed pairs keep earlier/later.
- `codex-catalog`: Draft status covers unreviewed interpretive metadata, not a placement James has confirmed. Registry series statements that differ from the catalog placement are stored as provenance.
- `lattice-build`: Generated series data includes related-work ids. Generated codex data includes alternative-version ids. Planned positions stay in the registry payload and are not treated as published works.
- `reading-bundles`: A series bundle still names a planned position in one unlinked line, using the corrected title.
- `ai-entry-points`: Unwritten titles stay marked and unlinked. The Evolution of the Sovereign line uses *The Architecture of Presence*.

## Impact

- `data/series.json`, `data/codex-catalog.json`, and provenance notes on the affected entries.
- `client/scripts/series-registry.js`, `client/scripts/build-lattice.js`, `client/scripts/build-ai-layer.js`.
- Lattice corridor header and grids, codex cards, and the reader context line.
- Generated `llms.txt`, `llms.json`, and `llms-full.txt` keep unlinked "not yet written" lines, with the corrected Codex VI title.
- `docs/review/james-questions.md` is regenerated so resolved questions are not asked again. Sequence 18's finding is recorded there and in this change.
