## 1. Sequence 18

- [x] 1.1 Search catalog history, filename manifests, and composer batches for sequence 18 and record the finding in this change and in the question list. Do not add a codex.

## 2. Registry and catalog

- [x] 2.1 Correct the Evolution of the Sovereign planned title to "The Architecture of Presence", add Architecture of Love `related_ids`, and clear series `needs_review` with confirmation notes. Leave the InterBeing Glossary `total` null.
- [x] 2.2 Remove The Four Frequencies of Love from series membership. Add `alternative_ids` on the two unordered pairs and `edition_chronology` on the three confirmed earlier editions.
- [x] 2.3 Store `provenance.registry_series` on the section 4 conflicts. Clear `needs_review` where only placement or edition direction was unconfirmed. Keep it on entries whose interpretive metadata is still an AI draft, and rewrite those notes.

## 3. Build

- [x] 3.1 Validate and publish `relatedIds` and `alternativeVersionIds` from `series-registry.js`. A related id is not a member.
- [x] 3.2 Pass the new fields through the lattice build and the Codex model.
- [x] 3.3 Use the corrected planned title in series bundles, `llms.txt`, and `llms-full.txt`.

## 4. Lattice and reader

- [x] 4.1 Stop rendering planned cards. Corridor header counts published codices and links related works.
- [x] 4.2 Show "Alternative version" on cards and in the reader. Show a registry line when `registry_series` differs from the catalog series.

## 5. Specs and question list

- [x] 5.1 Update the series-registry and series-corridor-view purpose sentences so they no longer say the gaps are shown in the lattice.
- [x] 5.2 Teach `scripts/audit-series.js` the decided cases and regenerate `docs/review/james-questions.md`.

## 6. Check

- [x] 6.1 Rebuild the lattice and the AI layer. Confirm Harmonic Activation has no placeholder card, Four Frequencies is a related link, the two portal texts say "Alternative version", and the Evolution bundle names "The Architecture of Presence".
