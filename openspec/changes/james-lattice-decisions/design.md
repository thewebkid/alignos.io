## Context

The lattice already has a series registry, numbered members, unnumbered members, companions, planned positions, and earlier/later edition links. See `openspec/changes/archive/2026-10-14-series-corridors-and-placeholders/design.md`. James's 15 Oct 2026 reply uses three words for relationships the site already models, plus one the site does not.

The site's Collections (Return Room readings, Papers, Featured Writings) are reading lists from his pages. His word "collections" means something else: related works with no confirmed sequence, shown without numbers. That behavior already exists as unnumbered series members ("Also in this series"). This change does not add a second collections system.

## Goals / Non-Goals

**Goals:**

- Apply his corridor, edition, and review decisions on the existing registry and catalog.
- Keep planned titles in `data/series.json` for the day those works arrive, and keep them out of the lattice UI.
- Record which edition chronologies are verified, which he accepted, and which stay unordered.

**Non-Goals:**

- Renaming the site's Collections, or building a new collection type for unnumbered works.
- Creating a series for every historical registry name.
- Rewriting codex texts, including prefaces that still say "The Function of Presence".
- Clearing draft status on AI-written descriptions, tones, tags, or structural roles.
- Changing copy he already marked YES (R1–R8, R10–R12, R17–R19) or making *The Fundamental Arc* a series.

## Decisions

### D1. Hide cards, keep the AI lines he approved

R14 and the corridor list say to remove the gray "Not yet written" cards. Section 4, which he marked "all good", tells an AI the unwritten titles and does not link them. So:

- The lattice renders no planned card, and the corridor header counts published codices ("6 codices") without "of 7 written".
- `llms.txt`, `llms-full.txt`, and series bundles keep a one-line unlinked "not yet written" marker. Those lines use the registry title.
- The reader still says "Part {n} of {total}" because that numbering is in the published texts. Previous/next already skips the empty slot, so The Spiral's previous is Resonant Action.

*Alternative:* strip the markers from the AI files too. That would retract a listing he approved.

### D2. Codex VI's recorded title

The planned position's title becomes "The Architecture of Presence", which he named as the correction. The subtitle stays the sentence quoted from the earlier preface, and the source note records both wordings. The codex markdown is not edited.

### D3. Related versus unnumbered

- Unnumbered members stay catalog `series` entries with `position: null`, shown under "Also in this series". The three InterBeing works stay there.
- `related_ids` on a series record is a new list of published ids that are linked from the corridor header and are not members. *The Four Frequencies of Love* leaves `series` (set to null) and is the one related id on The Architecture of Love. It remains in the lattice and under "Not in a series".
- Companions stay companions. They are already his "related works" case and already have a header link.

*Alternative:* put Four Frequencies in `companion_ids`. The header would call it a companion, which his registry does not.

### D4. Registry statements are provenance, not new corridors

Entries whose registry names a different series than the catalog placement get `provenance.registry_series` set to that statement (the section 4 conflicts already cited in `docs/review/james-questions.md`). The reader shows "Registry: {statement}" and links it when the statement's series name resolves to a corridor other than the entry's own. No new series is created for names that are not corridors ("Micro-Codices of Return", and the rest of that list).

### D5. Editions

`later_edition_id` stays one-directional. Add `edition_chronology` on the earlier entry:

- `verified` — the text establishes order. Trans-Species Resonance, because the later title says "Expanded".
- `confirmed` — order was inferred and James accepted it on 15 Oct 2026 (R15). Living Harmonics and Love's Architecture.

Both still show "Earlier edition". The field is how the catalog distinguishes the two, which is what he asked.

Unordered pairs get `alternative_ids` on both entries and no `later_edition_id`:

- `codex-of-the-next-threshold` and `codex-on-becoming-a-portal`
- `codex-of-the-language-of-resonance` and `codex-of-resonant-memory`

Cards and readers say "Alternative version" and link both ways. These are not earlier editions, so neither is dropped from a series count. Neither pair is in a series today.

### D6. Review flags

`needs_review` remains the switch for `metadataStatus: draft`, and after this change it means unreviewed interpretive metadata only.

- Placement-only notes on the twenty-five entries: set `needs_review` false and replace the note with a confirmation line citing 15 Oct 2026 and the evidence already in the note.
- Sequences 136–139: keep `needs_review` true. Rewrite the note so a confirmed placement is stated as confirmed and the draft fields are named.
- Series records he settled, including Realized Flame: `needs_review` false. Realized Flame's name is not in his text. Part I and Part II are a numbered sequence the titles support, and he asked for an editorial label in the same situation (the Planetary Service trilogy). The notes say the name is an editorial label applied under that principle.
- The InterBeing Glossary `total` stays null.

### D7. Sequence 18

The number is the series compilation, not a missing codex. In commit `0f0047d`, `LATTICE_URLS` slot 18 is `The-Evolution-of-the-Sovereign.pdf`. Sequence numbers were `index + 1` in that list. The catalog does not include compilation PDFs (`compilation_pdf` on the Evolution of the Sovereign record is that file), and the other works kept their old numbers, so 18 stayed empty. It was already empty in the first committed catalog: 134 entries, sequences 1–135. No row is added to fill it.

### D8. Question list

`scripts/audit-series.js` regenerates `docs/review/james-questions.md` and would ask the settled questions again. Update it so confirmed placements, the corrected title, hidden cards, related works, and alternative versions are reported as decided. The sequence 18 finding is written into that file after the history check.

## Risks / Trade-offs

- [Reader still says "Part 4 of 7" while the third card is gone] → The number is the codex's own. The header no longer announces the hole. The AI file still names the missing title.
- [Realized Flame's name is our label] → Notes cite his editorial-label principle. If he wants a different name, it is a one-field edit.
- ["Registry:" links on alias conflicts send a reader to the other corridor] → The line quotes his registry and does not change placement. Names that are not corridors stay unlinked text.
- [Hiding cards makes the planned records look unused] → They stay in `series.json` and in the AI files, which is how the work is added later without rediscovering the title.

## Migration Plan

Data first (registry, catalog, provenance), then `series-registry.js` and the two builds, then the lattice and reader. Rebuild the lattice and the AI layer. Rollback is a git revert; generated files are rebuilt.

## Open Questions

None that change the specs. Sequence 18's finding is recorded after the history check; it does not add a work either way.
