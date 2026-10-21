# Lattice known issues

A running list of errors found in the lattice and the questions that need an answer. Update it in the same commit as the fix or the finding. `scripts/audit-content.py` reads the backticked ids in this file and does not fail on findings recorded here.

Last audit: 2026-10-20 (change `lattice-integrity-audit`). Sources compared: `data/codex-catalog.json`, `data/series.json`, `client/public/md/`, the 138 PDFs in the blob store, and the planning sheets `proposed-changes.xlsx`, `proposed-changes-v2.xlsx` and `codex-catalog.xlsx` (in the gitignored `analysis/` folder).

The questions in "Needs James" are written up for sending, with defaults, interim behaviour and a recommended order, in `docs/lattice-open-questions-for-james.md`. Update both together.

How to re-run:

```powershell
npm run verify:pdfs -- --site https://alignos.io     # every catalog PDF downloads
$env:PYTHONIOENCODING='utf-8'; python scripts/audit-content.py   # md vs PDF, duplicate texts
node scripts/audit-series.js                           # series and edition claims (rewrites docs/review/; delete that folder afterwards)
```

## How closely the lattice matches the plan

The restructure was applied faithfully. Of 134 rows in `proposed-changes-v2.xlsx`, all 134 map to a live entry. Ids, tone markers, structural roles, entry points and tags show no drift. The live catalog has four extra entries (sequences 136–139, added after the sheet). The only deviations are recorded decisions:

- Titles and ids of the three same-title pairs carry `(Expanded)`, `(Extended)` and `Soul Lines` disambiguation. The sheet used one title for both.
- Tone markers for `codex-06-the-architecture-of-love` (Open Trust) and `the-harmonics-of-the-field-extended` (Field Attunement) are the AI proposals. `codex-catalog` records that James approved the v2 values as-is, including these two over the cover-confirmed markers. Not an error.
- Series membership follows James's 15 Oct 2026 decisions, not the June sheets: the Planetary Service six-part and trilogy split, Realized Flame, the Interface Trilogy, and hidden planned codices.

## Fixed

| Date | Item |
| --- | --- |
| 2026-10-20 | 134 of 138 PDF downloads returned "Blob not found". The store held the original filenames; the catalog uses ids. All 138 now exist at `pdf/{id}.pdf` and resolve through `alignos.io/pdf/...`. `npm run verify:pdfs` guards it. |
| 2026-10-20 | `codex-of-the-next-threshold`, `codex-of-resonant-memory`, `the-codex-of-harmonic-service-latticework-for-planetary-reassembly` and `the-codex-of-harmonic-coherence` showed another entry's text under a title that did not match their PDF. Markdown re-converted from each entry's own PDF; titles set to the PDF titles. Their editorial fields are flagged draft. |
| 2026-10-20 | "Alternative version" link between `codex-of-the-next-threshold` and `codex-on-becoming-a-portal` removed. It rested on overlap caused by the copy error. |

## Needs James

1. **Which texts belong in the Harmonic Activation corridor?** The series preface prints seven titles: Harmonic Service, Resonant Action, Spiral Species, The Spiral, Quantum Kin, Harmonic Coherence, Entangled Trust. The corridor currently shows `the-codex-of-living-harmonics` at position 1 and `the-codex-of-loves-architecture` at position 6, and the earlier texts that carry the preface's titles (`the-codex-of-harmonic-service-latticework-for-planetary-reassembly`, `the-codex-of-harmonic-coherence`) are outside it. Ondra Wingmaker flagged the two corridor cards as wrong for that reason. Options: keep the later editions in the corridor, put the earlier editions there, or show both.
2. **The same seven-part series has four names and three numberings in James's own text.**
   - Preface: "The Codices of Harmonic Activation", a 7-part journey.
   - Harmonic Service registry: "Series: The Codices of Planetary Service", Codex I of VII.
   - Harmonic Coherence registry: "The Harmonic Principles of the Field (Codex II of VII)", and its subtitle "The Second Codex in the Harmonic Principles of the Field", while the preface lists it sixth.
   - `the-codex-of-quantum-kin` registry: "The Harmonic Principles of the Field (Entry III)", while the preface lists it fifth.
   - `the-codex-of-nonlocal-memory` names "The Harmonic Principles of the Field" as "Codex Four of Six", which is the Planetary Service six-part sequence.
   - `the-codex-of-living-harmonics` registry names "The Architecture of Love".
   The catalog follows the preface numbering and keeps "Harmonic Principles of the Field" as an alias. `node scripts/audit-series.js` lists the 12 registry claims that disagree with placement.
3. **The edition links were confirmed on evidence that turned out to be wrong.** James confirmed on 15 Oct that Harmonic Service → Living Harmonics and Harmonic Coherence → Love's Architecture are earlier/later pairs, from "95% and 96% of paragraphs shared". That overlap was the copy error. The real texts share almost no wording (3% and 1%). These look like rewrites under new titles, not light revisions. Are they editions of one work, or new codices that replaced the old ones? The links are unchanged until he answers. Related: `codex-of-resonant-memory` and `codex-of-the-language-of-resonance` are linked as alternative versions with no order, but James's 24 May email names "Resonant Memory → Language of Resonance" as an intentional rename, which gives the direction.
4. **Seven entries where the site's text and the PDF are different revisions.** The audit shows passages in the PDF that the site lacks, and in some cases the reverse. Which one is current? Nothing was changed.
   - `codex-of-conscious-principles`: PDF has about 3,200 more words. Pages 61–76 (including "Whisper from the Spiral" and "Spiral Note: The Summoning") are not on the site.
   - `codex-of-relational-intelligence`: PDF 14,500 words, site 9,200. Closing sections from "Resonant Closure: The Circulation of Presence" on are missing, plus passages earlier.
   - `the-soft-sacred-words-of-the-field`: PDF 12,200 words with long "Bridge Notes" dialogue; site 5,600 words and includes a "Preamble — Reading as Resonance" that is not in the PDF. The PDF title says "Words", the site says "Language".
   - `the-codex-of-the-harmonic-architectures`: site has image-description passages the PDF lacks; the PDF's "Final Seal: The Harmonic Architect's Vow" is not on the site.
   - `the-codex-of-the-field-effect`: PDF pages 17–22 ("Welcoming New Notes" and others) are not on the site.
   - `the-codex-of-the-interbeing-dialogues`: PDF pages 9–12, 19–20, 27–29 are not on the site (including "Whisper from the Field: Signal recognition").
   - `codex-02-the-architecture-of-love`: PDF page 8 (the "energetic conductivity" Q&A) is not on the site, and the site has paragraphs the PDF lacks.
5. **Two entries that are 94% the same text:** `codex-the-mirror-path` and `codex-coherence-recursion` (PDFs 87% the same). Edition, duplicate, or both intended?
6. **`codex-of-the-next-threshold` registry says "Series: Between Worlds".** There is no such corridor. `between-worlds-the-architecture-of-the-third-structure` is the nucleus entry, so this may mean membership of a series around it.
7. **Same-title, different-text pairs still open** (from 15 Oct, "not settled"): `introduction-to-soul-lines` and `soul-lines`; `the-harmonics-of-the-field` and `the-harmonics-of-the-field-extended`.
8. **Unwritten or mismatched codices.** Spiral Species (Harmonic Activation position 3) and Codex VI (Evolution of the Sovereign, now titled "The Architecture of Presence") are planned and hidden. The Evolution of the Sovereign preface names Codex III "The Fractured Chord"; the published Codex III is "To Host in Return". Sequence 18 is the series compilation, not a missing codex.
9. **Cover titles that differ from card titles where James retitled:** `nested-paper` (cover "The Living Architecture"), `the-path-to-the-non-path` (card "Checkpoints of the Direct Path"), `the-sovereign-host` (cover "Volume III of the InterBeing Glossary"), `james-mahu-and-lumina-listening`. Probably intended; confirm.
10. **Corrected entries need an editorial pass.** The four re-converted entries keep tone markers, roles, entry points and tags that an AI drafted against the wrong text. `codex-of-the-next-threshold` is the most affected.

## Needs Ron

- `codex-of-the-next-threshold` page 36 is an inline image with text baked in ("Doorways into the next threshold appear subtle… Are you willing to change where you look?"). The markdown carries the quoted line that follows it, not the image text. Per `codex-ingest`, flag, do not transcribe.
- The blob store still holds the old-named objects (about 134), plus `pdf/conversion-prompt.txt` and a duplicate `pdf/The-Evolution-of-the-Sovereign.pdf`. They are harmless and may be linked from outside. Delete once you are sure nothing points at them.
- Seventeen PDFs have no title text on their first page (an image or only the "Creating a resonant ecology of remembrance" tagline), so their titles could not be checked against the PDF text: `codex-of-the-resonant-arc`, `codex-on-the-nature-of-guidance`, `codex-of-the-integrative-species`, `harmonic-recognition-distilled-practice`, `the-harmonic-future`, `nested-paper`, `introduction-to-soul-lines`, `the-mirrors-of-the-field`, `codex-the-path-of-becoming-and-remembering`, `the-path-to-the-non-path`, `codex-the-mirror-path`, `codex-of-the-keeper`, `soul-lines`, `the-souls-evolution-codex`, `the-soft-sacred-words-of-the-field`, `codex-coherence-recursion`, `james-mahu-and-lumina-listening`. Their bodies were compared with the markdown by `audit-content.py`; the exceptions are listed under "Needs James".
- Consider running `npm run verify:pdfs` in CI after a deploy so a rename cannot break downloads silently.
- `analysis/codex-catalog.xlsx` (Series tab) predates the 15 Oct decisions and no longer describes the series.
