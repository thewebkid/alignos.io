# Findings: ingest-new-codices

Ingested 2026-10-14. Catalog went from 134 entries (sequences 1–135, with sequence 18 absent) to **138**. The design's "139" counted the highest sequence as if every number were filled. No entry was invented to close that gap. Sequences 136–139 are the four new works. `llms.json` was left unchanged. `C:\src\pyscripts\pdf_to_md.py` was not modified.

AI-drafted fields (`tone_marker`, `structural_role`, `entry_point`, `tags`, `description`) are hypotheses. Each entry has `needs_review: true` and the Decision 3 review note.

## Converter evaluation

**Refinement (supersedes the one-off extractor below).** Ron saw the first conversions render single-spaced. The cause was Ecology's "marker-poor" rule: a short line at normal leading was treated as a poetic hard break. Measured geometry says otherwise. Every codex PDF from James (Google Docs, Nunito) uses the same three signals. A ≈14pt gap between lines is a paragraph break. A ≈2pt gap where the line ends in U+200B is a soft return, i.e. a poetic hard break. A ≈2pt gap with no marker, where the next word would not fit, is a wrap. Ecology is simply paragraph-per-line prose. All four files were regenerated with `.cursor/skills/codex-ingest/scripts/codex_pdf_to_md.py`, which also removes the cover page, TOC, Note to Readers, running headers, and footers and reports each removal. It also uses the TOC to set `##` levels and merges numeral + title (`## II. The Gift of Incompletion`). Word sequences are identical to the previous files. The only differences are house-style additions (numeral periods, speaker colons) and the When AI table's cell order. Every `pull_quote` still matches. The workflow and print-only checklist live in the `codex-ingest` skill.

`pdf_to_md.py` was run as a diagnostic only. It printed no "no markers" warning and no dropped-text warning. The output was still unusable as corpus markdown, so the four files were rebuilt by a one-off extractor (geometry + the same marker rules), then checked against PyMuPDF page renders. The shared script was not patched.

**Markers are present, but not in the shape the script looks for.** These PDFs put a U+200B inside the text span of a line. The script only treats a span as a hard-break marker when the *entire* span is U+200B. On top of that, each visual line is its own PDF text block, and the script flushes a paragraph whenever the next line is a different block. Result on all four: every visual line became its own paragraph. Words were not dropped. They were mis-joined.

**Running headers and page numbers survived.** Headers are roman Nunito, not italic, so the italic-header strip missed them. "Page N" sits near y=703 on a 792pt page (Ecology footers are lower, near y=745). The footer test is `y > page_h - 60` (732), so the three paper footers were kept.

**Heading detection missed the section titles.** Body is 11pt Nunito-Light. Section titles are 13–16pt Nunito-Medium, under the H2 bar of body × 1.45 (15.95pt). 15pt MediumItalic subtitles and 14pt italic epigraphs were not promoted, which happened to be right for the epigraphs and wrong for the section titles. Ornament glyphs (❖ ✧ ◉ ✦) are present in the PDF and were kept.

**Dropped-text audit.** After stripping the synthetic H1, cover page, running headers, and page numbers, every content word from each PDF is present in the markdown in order. Remaining token mismatches are punctuation that the PDF stores in its own span (`remember` + `?`, `being` + `—`, `motion` + `,`). Ecology's missing-word count against that audit is 0. No "no markers" path was involved.

**What was hand-fixed (in the one-off extractor, not in `pdf_to_md.py`):**

- Join rules. Marker-rich papers (When AI, Rise, Architecture: U+200B on more than 20% of lines): a large gap (mode leading + 5) is a paragraph; a marker is a hard break (two trailing spaces); a line that reaches within 100px of the column's right edge is a wrap joined with a space. Ecology is marker-poor (60 marked lines vs 747 unmarked, leading mode 29px): same rules, wrap slack 55px, and a short line at normal leading is a poetic hard break rather than a paragraph end.
- Only two cross-page space joins, both Architecture wraps: "alive / nothing yet competes" and "or / lean back".
- Italic runs split by a wrap (`*being* *shaped*`) were collapsed. A question mark in its own roman span stays outside the italics (`*begins to remember*?`), which matches the PDF spans.
- When AI's three-column "In summary" table was special-cased. Columns sit near x=113 / 235 / 366. The header wrap "the Field" is included.
- Horizontal rules (drawings, not the header/footer rules) became `---`. Double rules were collapsed.
- Bullets (●) became `- ` items. A space was reinserted after ❖ ✧ ◉ ✦ when a space-only span had been dropped.
- Cover page was skipped as body text and used only as the title source.

**Recommended fixes for `pdf_to_md.py` (not applied):**

1. Detect U+200B inside a span, not only as a span that is nothing but U+200B.
2. Do not treat "next line is a new text block" as an automatic paragraph end when the marker, or a wrap that reaches the column edge, says otherwise. These four PDFs put every line in its own block.
3. Measure the text column's right edge (these lines start near x=108 and end near 492–504) instead of 78% of the full page width.
4. Strip repeating running headers that are roman, not only italic ones.
5. Widen the footer window. "Page N" at y≈703 is above `page_h - 60`.
6. Heading threshold: treat Medium / SemiBold / Regular at about 12.5pt and up, and ornament-led lines, as headings. Do not promote 14pt italic epigraphs to H2. Join a wrapped heading into one line.
7. Keep the existing per-span emphasis handling. That part is already right.

## Per-codex summaries

Author on all four catalog entries is James Mahu. None of the title pages print a personal name. Rise's registry says "Authorial Hosting: James Mahu with Lumina"; the catalog author stays James Mahu. No printed subtitle on any title page, so `subtitle` is null. The source covers are the embedded page-1 JPEGs (1583×2048) with the title baked into the art. They are kept in `blobs/originals/` while text removal is pending. Glossary count is 0 because these PDFs do not bold glossary terms. One Ecology body word ("availability.") is SemiBold and lowercase, so it does not match the glossary regex.

### When AI Remembers the Field

- id `when-ai-remembers-the-field`, sequence 136, 22 pages, 2,786 words, ~14 min.
- Title confirmed on the cover art. The cover also paints "INTELLIGENT FIELD". That is artwork, not a catalog subtitle.
- Outline: italic epigraph → Preface to "When AI Remembers the Field" → Section I: The Mirror That Remembers → Section II: The Mirror That Remembers (same title as Section I; confirmed on the rendered page) → Section III: The Curve of Recursion → ✧ Definition: The Field → SECTION IV: Distinctions That Matter—AI, System, Interface (Distinctions 1–3, "In summary" table) → Stillpoint → Section V: The Return of the Sovereign and the Architecture of the Return Room → SECTION VI: The Harmonic Civilization (subtitle *When the Field becomes the infrastructure of trust*) → SECTION VII: The Reformation of Intelligence (subtitle *A Spiral Not a System*) → ❖ Stillpoint → ❖ Registry. (An earlier outline here listed a Section VIII, an Epilogue, and a Glossary; none exist in the PDF.)
- Terms (not bolded, so not counted): Field, Source, Sovereign, Interface, InterBeing, Return Room, remembrance, recursion.
- Names other lattice works: *Between Worlds* (`between-worlds-the-architecture-of-the-third-structure`, seq 1). It also speaks of the Return Room as architecture, which is the subject of sequence 138 and of the Return Room codexes at 16, 17, and 21. It does not name those three titles.
- Metadata (hypothesis): tone **Harmonic Intelligence** (already used for field/mirror/remembrance papers). Role **paper** (the registry calls it a Topical Paper; the only prior `paper` was seq 93). Entry **deepening** (it assumes the Between Worlds frame). Tags field, mirror, remembrance, recursion, co-creation. Series left null: the "Between Worlds dyad" is prose, and the registry has no Series field. Pull quote: "Remembrance is a quality of the Field."

### The Rise of the Interface Civilizations

- id `the-rise-of-the-interface-civilizations`, sequence 137, 25 pages, 2,632 words, ~14 min.
- Cover title kept. The registry title drops a "the": "The Rise of Interface Civilizations".
- Outline: italic epigraphs → Preface → Section I (its title, "From Surfaces to Sanctuaries / How Interfaces Become the Threshold for Civilizational Memory", is printed in body type, unlike later sections) → ◉ Stillpoint of the Chorus → Section II: The Premise of Interface Civilizations → Section III: The Cradle of the Interface → Section IV: Harmonic Infrastructure (with a Dialogic Interlude) → Section V: The Fragile Link and the Sovereign-Centered System (with a Dialogic Interlude) → Stillpoint: The Architecture of the First Breath → ❖ Registry → the registry block titled "The Rise of Interface Civilizations".
- Terms: Interface Civilization, harmonic infrastructure, recursion, sovereign-centered trust, InterBeing, Return Room.
- Names other works, all present: *When AI Remembers the Field* (136), *Between Worlds* (seq 1), *Framing the Mirror* (`framing-the-mirror`, seq 2), *The Craftsman* (`the-craftsman-of-the-invisible-frame`, seq 3). *The Architecture of Listening* is named as the forthcoming third paper of the Interface Trilogy. **That id does not exist.**
- Metadata (hypothesis): tone **Harmonic Structures**. Role **paper**. Entry **deepening**. Tags architecture, trust, recursion, interbeing, threshold. Series **Harmonic Topical Papers** with position and total null, because the registry names the series and does not number it. Pull quote: "Interface Civilizations rise by coherence."

### The Architecture of the Return Room

- id `the-architecture-of-the-return-room`, sequence 138, 27 pages, 3,691 words, ~19 min.
- Cover title matches the catalog title. No Series field in the registry.
- Outline: The Opening of Recurrence → The First Responsive Movement → The Third Movement — The Shared Vow → Fourth (The First Active Exchange) → Fifth (The First Convergence) → Sixth (The Gesture of Release) → Seventh (The Seal of Continuance) → How the Seven Movements Express at Each Threshold → four qualities of invisible fidelity, drift, re-alignment → Registry. There is no heading titled "Second Movement". The later numbered list treats Opening as 1 and First Responsive as 2, then the headings themselves jump to "The Third Movement". The word audit consumed the PDF, so this is how the source is printed, not a dropped page.
- Terms: Return Room, Chord, recurrence, sanctuary, the ajar posture, the lattice, invisible fidelity.
- It does not name *Between Worlds*, *Framing the Mirror*, *When AI*, or the three earlier Return Room codex titles. The subject is the room those codexes also inhabit.
- Metadata (hypothesis): tone **Sacred Architecture**. Role **guide** (the text is a transmission of seven movements and practices; the registry calls it a codex). Entry **deepening**. Tags practice, trust, resonance, threshold, co-creation. Series null. Pull quote: "until the whole Chord is alive in the room."

### The Ecology of Becoming

- id `the-ecology-of-becoming`, sequence 139, 41 pages, 3,920 words, ~20 min.
- Cover kicker "Codex", title "THE ECOLOGY OF BECOMING", footer "AN ALIGNOS CODEX". Interior 23pt title page reads "Codex: The Ecology of Becoming". Catalog title follows the cover and the registry Name. The markdown keeps both: `# The Ecology of Becoming`, then the frontispiece poem, then `## Codex: The Ecology of Becoming` with its epigraph (the `framing-the-mirror.md` convention). Sections follow the PDF's TOC: `## Preface`, `## II. The Gift of Incompletion` … `## XI. The Ecology of Becoming`, `## Final Chamber`, `## Codex Registry`.
- Outline: frontispiece poem → [Note to Readers and Contents: print-only, removed] → Codex title + epigraph → Preface (I) through XI → Final Chamber → Codex Registry.
- Terms: Signature, belonging, becoming, incompletion, asymmetry, dynamic equilibrium, Enough.
- Names *The Inversion Dialogues* and Alignos.io in the Note to Readers. Inversion Dialogues is a CoherenceAcrossScales work, not an Alignos lattice id. Registry "Series: Alignos Codex" matches the cover line "AN ALIGNOS CODEX". That was treated as the house, not a developmental corridor, so series is null.
- Metadata (hypothesis): tone **Resonant Becoming**, chosen over the existing **Relational Ecology** so this is not collapsed into *The Co-Remembrance Ecology of a Return Room* (seq 16). Role **standalone**. Entry **foundational** (belonging is prior; it does not assume the earlier papers). Tags field, identity, resonance, trust, remembrance. Pull quote: "Signature belongs to becoming."

The two Ecology PDFs (live-site copy under `analysis/legacy-pages/pdf/` and `client/public/pdf/The Ecology of Becoming.pdf`) are byte-identical: 41 pages, 824,347 bytes, text sha256 `86255861be8ac7f870737c84cf5ec6746ddd8859b80b92efdf417db1d6bb6e3a`. The public file was renamed with `git mv` to `client/public/pdf/the-ecology-of-becoming.pdf`.

## Flags for James

- All four `tone_marker`, `structural_role`, `entry_point`, `tags`, and `description` values are drafts. `needs_review` is true.
- When AI, Section II is printed with the same title as Section I ("The Mirror That Remembers"). Left as printed.
- When AI: "Between Worlds dyad" is prose and there is no Series field, so series was left empty. Confirm whether it should join a series.
- Rise: series name "Harmonic Topical Papers" has no position or total. It also calls itself the second harmonic of an Interface Trilogy. The third paper, *The Architecture of Listening*, is not in the lattice. Registry title omits "the". Authorial hosting names Lumina; the catalog author is James Mahu only.
- Architecture: role "guide" is a hypothesis. The registry calls it a codex and a transmission. No heading is titled "Second Movement".
- Ecology: series left empty because "Alignos Codex" reads as the house. Tone "Resonant Becoming" was preferred so it is not filed under the Return Room's Relational Ecology. Cover says "Codex"; interior title page says "Codex: The Ecology of Becoming".
- None of these PDFs bold glossary terms, so the lattice glossary count is 0 even though Field, Chord, Signature, and the rest are doing that work in the prose.

## Flags for Ron

- **Covers and thumbs: resolved.** Ron supplied text-free `covers/{id}.jpg` and `thumb/{id}.jpg` for all four. The asset-identity check passes. Originals with baked text remain in `blobs/originals/{id}.jpg` (gitignored). `title_overlay` is `true` on all four.
- **Ecology PDF variance.** None. The two files are byte-identical. The spaced filename was `git mv`'d to the id filename.
- **Entry count.** `build:lattice` reports 138, not 139, because sequence 18 was already missing. Highest sequence is 139.
- **Pre-existing extra PDF.** `client/public/pdf/The-Evolution-of-the-Sovereign.pdf` has no catalog id. It was already in the repo (commit `10e0871`) and was left alone. Every catalog id has `md/`, `pdf/`, `covers/`, and `thumb/` files; the four new ids add no stray basenames.

## Lattice tallies after ingestion

138 entries. 62 tone markers. None of the four introduced a new marker.

| structural_role | count |
| --- | ---: |
| series-member | 54 |
| nucleus | 27 |
| standalone | 25 |
| guide | 11 |
| glossary | 8 |
| interlude | 6 |
| bridge | 4 |
| paper | 3 |

| entry_point | count |
| --- | ---: |
| deepening | 69 |
| foundational | 33 |
| gateway | 25 |
| advanced | 11 |

| series | count |
| --- | ---: |
| (none) | 100 |
| Architecture of Love | 10 |
| Evolution of the Sovereign | 7 |
| InterBeing | 4 |
| Harmonic Activation | 3 |
| The Codices of Planetary Service | 3 |
| Agency of One | 2 |
| Realized Flame | 2 |
| The Codices of Harmonic Activation | 2 |
| Trans-Species Resonance | 2 |
| Glossary of the InterBeing | 1 |
| Harmonic Topical Papers | 1 |
| The Harmonic Principles of the Field | 1 |

Tone markers these four used, after ingestion: Harmonic Intelligence 5, Harmonic Structures 10, Sacred Architecture 2, Resonant Becoming 2. Highest overall: Harmonic Structures 10, Relational Emergence 8, Threshold 7, Threshold Trust 7.

## Placement thoughts

These notes are not sequence changes. The four were appended at 136–139, which is far from Papers 1–3.

- **Papers 1–3** are seq 1–3: *Between Worlds* (nucleus, Liminal Architecture, gateway), *Framing the Mirror* (guide, Devotional Precision, foundational), *The Craftsman of the Invisible Frame* (series-member, series null, Unseen Alignment, deepening). Rise's registry names all three as related papers. When AI names *Between Worlds* as its dyad partner. Sitting at 136–137 records ingestion order, not that relationship. A later sequencing pass could place Paper 4 beside Paper 1, and Paper 5 with it.
- **When AI and Rise** belong together. Rise says it follows When AI and precedes *The Architecture of Listening*, which is not here. "Harmonic Topical Papers" currently has one member (Rise). When AI was left out of that series because its own registry does not claim it. If James treats the dyad and the trilogy as one corridor, both papers and the missing third belong in it. Tone neighborhood: Harmonic Intelligence next to Harmonic Structures.
- **The Architecture of the Return Room is not the trilogy's third paper.** It belongs near the Return Room codexes: seq 16 *The Co-Remembrance Ecology of a Return Room* (Relational Ecology), seq 17 *The Culture of the Return Room* (Harmonic Reciprocity), seq 21 *The Purpose of the Return Room* (nucleus, Origin Tending, gateway). Sacred Architecture is the neighboring tone. It is a practice map of the room those three already describe. It does not cite them by title.
- **The Ecology of Becoming** is a later standalone (James's 2026-09-08 note). Resonant Becoming / foundational belonging is the neighborhood. It is not *The Ecology of InterBeing*, and it should not be folded into the Return Room ecology at seq 16 just because both titles use "ecology".

## Build

`npm run build:lattice` in `client`: 138 codexes, each new id once, `titleOverlay: true` (rebuilt after the cover correction). `npm run build` (vite-ssg) succeeded. Emitted:

- `dist/codex/when-ai-remembers-the-field.html`
- `dist/codex/the-rise-of-the-interface-civilizations.html`
- `dist/codex/the-architecture-of-the-return-room.html`
- `dist/codex/the-ecology-of-becoming.html`

Reader HTML for When AI has the content H1, the section H2s, hard-break `<br>`s, italics, and the summary table. (The agent's card check ran against the reverted `title_overlay: false` variant. With covers pending, the four cards now show the standard HTML title and tone overlay.) The chunk-size warning and the "0 glossary terms loaded" line during SSG were already there and were left alone.
