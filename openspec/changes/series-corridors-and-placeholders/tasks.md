## 1. Registry and catalog data

- [ ] 1.1 Create `data/series.json` with records for every current catalog series plus The Interface Trilogy, per design D1/D3/D4 (canonical name, aliases, total, companions, compilation PDF, planned positions with quoted titles/subtitles and sources, `needs_review`/notes)
- [ ] 1.2 Update catalog series references to canonical names: Harmonic Activation members (positions 1, 2, 4, 5, 6, 7 per D3), Nonlocal Memory as unplaced member, seq 65 out of membership (companion), seq 137/136 to The Interface Trilogy 2/3 and 1/3, Evolution of the Sovereign renamed; set `needs_review` + notes on every changed entry
- [ ] 1.3 Append provenance rows for series renames, position changes, and companion reassignment
- [ ] 1.4 Add a validation script (or extend the build) for registry rules: unique ids/names/aliases, positions within total, no collisions between members and planned positions, catalog names resolve

## 2. Series audit

- [ ] 2.1 Write `scripts/audit-series.js`: per series list members/positions, gaps, null positions, alias names found in markdown registries, conflicting numbering; edition-pair candidates by normalized title and H2/H3 heading similarity
- [ ] 2.2 Run the audit; apply only fixes stated in James' text (cite source in registry/provenance); leave unknowns null
- [ ] 2.3 Generate `docs/review/james-questions.md` from the audit (planned positions, unplaced members, null positions, alias/numbering conflicts, edition pairs, all `needs_review` entries incl. seq 18 vacancy)

## 3. Editions

- [ ] 3.1 Diff seq 75 vs 76 and 106 vs 48; confirm direction against cover evidence (D5); record outcome in provenance
- [ ] 3.2 Set `later_edition_id` on the earlier entries (and any further pairs confirmed by 2.1), clear their series membership, flag `needs_review`

## 4. Build

- [ ] 4.1 `build-lattice.js`: load registry, resolve/validate series, emit `series.id`, ordered positioned sibling list (including self), `laterEditionId` / derived `earlierEditionIds`; write `client/src/generated/series.json`
- [ ] 4.2 Update `Codex` model (`codex.js`) for `series.id`, ordered siblings, edition fields; remove `series-detector.js` and its exports from `lib/index.js`
- [ ] 4.3 Rebuild; confirm 138 entries, series JSON present, no validation errors

## 5. UI

- [ ] 5.1 Lattice: series select driven by `?series=`; corridor header (name, "n of total written", companion/compilation links); corridor ordering with unplaced and companion sections; progress chips still apply
- [ ] 5.2 `PlannedCard.vue` matching `CodexCard` footprint (position, quoted title/subtitle, "Not yet written", non-interactive)
- [ ] 5.3 Earlier-edition marker on cards; reader notice on earlier editions; "Earlier edition" link on later editions
- [ ] 5.4 Reader: series line "{name} · Part n of N" linked to the corridor; fix previous/next to use ordered siblings
- [ ] 5.5 Kimi K3 (`kimi-k3-max`) visual pass on corridor header, planned card, edition marker/notice within existing SCSS tokens

## 6. Descriptions

- [ ] 6.1 Spawn a `grok-4.7-high` subagent to rewrite descriptions for seq 136–139 in the approved v2 register (10 approved examples as few-shot; no new claims; keep `needs_review: true`; append review note)
- [ ] 6.2 Review the rewrites against examples and codex text; commit to catalog; rebuild

## 7. Verify

- [ ] 7.1 `/lattice?series=the-codices-of-harmonic-activation` shows 1, 2, [planned 3], 4, 5, 6, 7, then Nonlocal Memory under "Also in this series", then the Harmonic Reality companion
- [ ] 7.2 Evolution of the Sovereign corridor shows planned Codex VI and links the compilation PDF; Interface Trilogy shows planned position 3
- [ ] 7.3 Unfiltered lattice and search show 138 codexes and no planned cards; earlier editions show their marker
- [ ] 7.4 Reader prev/next correct at first, middle, and last positions
- [ ] 7.5 `openspec validate series-corridors-and-placeholders --strict` passes
