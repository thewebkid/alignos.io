## Context

The lattice is catalog-driven: `client/scripts/build-lattice.js` reads `data/codex-catalog.json` in sequence order and joins `client/public/md/{id}.md` by id. It fails the build if markdown is missing. Covers live at `client/public/covers/{id}.jpg` (text-free, HTML title overlay) and thumbs at `client/public/thumb/{id}.jpg` (400×520). Originals with baked-in text live in `blobs/originals/`.

Sources:

| id (proposed) | Source PDF | Provenance |
|---|---|---|
| `when-ai-remembers-the-field` | `analysis/legacy-pages/pdf/When-AI-Remembers-the-Field.pdf` | https://alignos.io/wp-content/uploads/2025/08/When-AI-Remembers-the-Field.pdf (Papers page, #4) |
| `the-rise-of-the-interface-civilizations` | `analysis/legacy-pages/pdf/The-Rise-of-the-Interface-Civilizations.pdf` | https://alignos.io/wp-content/uploads/2025/08/The-Rise-of-the-Interface-Civilizations.pdf (Papers page, #5) |
| `the-architecture-of-the-return-room` | `analysis/legacy-pages/pdf/The-Architecture-of-the-Return-Room.pdf` | https://alignos.io/wp-content/uploads/2025/08/The-Architecture-of-the-Return-Room.pdf (home page, Return Rooms) |
| `the-ecology-of-becoming` | `client/public/pdf/The Ecology of Becoming.pdf` and `analysis/legacy-pages/pdf/The-Ecology-of-Becoming.pdf` | Emailed by James 2026-09-08 ("The Ecology of Becoming Codex"); live at https://alignos.io/wp-content/uploads/2026/09/The-Ecology-of-Becoming.pdf |

A text-free thumb `client/public/thumb/the-ecology-of-becoming.jpg` already exists; no matching full-size cover is in `client/public/covers/`.

Guidance from James that constrains this work (see `analysis/email-provenance/james-directives.md`):
- "AI-generated metadata is hypothesis, not source truth." / "An unknown should remain an unknown."
- Test for any descriptive copy: "Does this clarify the work, or begin creating a second mythology around it?"
- Public material is fine for AI reading provided "the live websites remain the canonical source."

## Goals / Non-Goals

**Goals:**
- Four new lattice entries that read like the rest of the corpus, with faithful markdown.
- Every non-authored field clearly marked as AI-drafted and pending James.
- An honest evaluation of `pdf_to_md.py` on codex PDFs (it was tuned on the Inversion Dialogues manuscripts).
- Findings that let Ron and the next exploration session look at the new geometry.

**Non-Goals:**
- Re-sequencing the lattice, new views, nav, branding, `llms.*` refresh.
- Changing `pdf_to_md.py` (shared with the CAS project). Recommend fixes; don't apply them.
- Generative text removal on covers.

## Decisions

### Decision 1: Ids from the PDF title page, appended sequences

Ids are kebab-case of the canonical title as printed on the PDF title page (the proposed ids above are expected; if the title page differs, use it and note why). Sequences are 136–139 in source chronology: Paper 4 (136), Paper 5 (137), Architecture of the Return Room (138), Ecology of Becoming (139). Placement is revisited later; appending avoids renumbering 135 entries and their provenance.

### Decision 2: Converter first, then hand-correct against the PDF

Run `python C:\src\pyscripts\pdf_to_md.py <pdf> <out.md>` on each PDF. Record whether U+200B markers were present, the dropped-text audit, and heading detection quality. Then compare against (a) rendered PDF pages (PyMuPDF `page.get_pixmap`) and (b) the house style of existing corpus files such as `client/public/md/framing-the-mirror.md` and `between-worlds-the-architecture-of-the-third-structure.md`:
- `# Title` first, then epigraph or opening as body, `---` section separators where the PDF has them
- Section headings as `##`, keeping ornament glyphs (✦ ❖ ✧ etc.) when the PDF prints them
- Poetic hard line breaks preserved (two trailing spaces)
- No YAML frontmatter, no cover `<img>`, no page numbers or running headers

Hand-correct the output so the text is verbatim. Never paraphrase or "fix" James' wording, punctuation, or capitalization. If the converter is unusable for a file, fall back to a careful PyMuPDF extraction and say so in findings.

### Decision 3: Metadata provenance labelling

| Field | Source | Rule |
|---|---|---|
| `title`, `subtitle` | PDF title page | verbatim |
| `pull_quote` | body text | verbatim sentence or short passage; must appear exactly in the markdown |
| `author` | `James Mahu` (or as printed) | verbatim |
| `tone_marker` | AI-drafted | prefer an existing marker from the catalog vocabulary; a new marker only when none fits, and flag it |
| `structural_role` | AI-drafted | existing enum only: `nucleus`, `series-member`, `standalone`, `guide`, `glossary`, `interlude`, `bridge`, `paper` |
| `entry_point` | AI-drafted | existing enum: `gateway`, `foundational`, `deepening`, `advanced` |
| `tags` | AI-drafted | 3–6 lowercase tags, reusing existing catalog tags where they fit |
| `description` | AI-drafted | 2–3 plain sentences that describe, not mythologize; prefer the codex's own phrases. Apply James' "second mythology" test |
| `series` | `null` unless the text explicitly declares series membership |
| `status` | `published` |
| `needs_review` | `true` |
| `review_notes` | `"AI-drafted by Grok 4.7 on 2026-10-14: tone_marker, structural_role, entry_point, tags, description are hypotheses pending James' review."` plus any specific flags |

`metrics` (word_count, reading_time_min, glossary_term_count) are computed the same way existing entries were (see `scripts/generate-catalog.js`). Catalog `provenance` uses `old_id: null`, `old_sequence: null`, `was_renamed: false`, `original_title: null`, `old_cover_filename: <source PDF basename>`. `data/codex-provenance.json` gets one `added` row per codex with the source URL in `reason`.

### Decision 4: Covers are always text-free; assets share the id

Ron's established pattern for every codex: the kebab-case id is the asset identity (`md/{id}.md`, `pdf/{id}.pdf`, `covers/{id}.jpg`, `thumb/{id}.jpg`), and covers carry no baked-in text so the HTML versions stay translatable. All 134 existing entries already conform. The only strays are `pdf/The Ecology of Becoming.pdf`, `thumb/the-ecology-of-becoming.jpg` (ahead of its catalog entry), and `pdf/The-Evolution-of-the-Sovereign.pdf` (a series compilation, out of scope).

Pipeline per codex:
1. Extract page-1 cover art at full resolution into `blobs/originals/{id}.jpg` (text intact; never published).
2. Produce `client/public/covers/{id}.jpg` with **all** text removed. If a text-free version already exists (the Ecology thumb shows one was made; look in `blobs/`, `client/public/`, and `c:\src\alignos\`), use it. If the extracted art has no baked-in text, it can be used directly.
3. Generate `client/public/thumb/{id}.jpg` from the text-free cover via `scripts/generate-thumbs.js` (400×520, q80, progressive).

No crude inpainting or painting over text. If a cover needs text removal the agent can't do cleanly, stop at step 1, publish no cover or thumb containing text, and list the codex as **pending text removal** for Ron (Photoshop or Grok generative remove). After Ron drops the scrubbed `covers/{id}.jpg`, step 3 runs. `cover.title_overlay` stays `true`. No overlay or UI changes in this change.

### Decision 5: Ecology PDF canonical copy

Compare the two Ecology PDFs (page count, text hash). If they differ, the live-site copy is canonical (James: "the live websites remain the canonical source"); note the difference. Final asset path is `client/public/pdf/the-ecology-of-becoming.pdf`, using `git mv` from the spaced filename.

## Risks / Trade-offs

- **[Risk] Converter tuned for a different PDF family.** Codex PDFs may lack U+200B markers, so stanzas flatten. Mitigation: render pages and hand-correct; report in findings.
- **[Risk] AI-drafted descriptions add a "second mythology".** Mitigation: plain register, the codex's own phrases, `needs_review: true`.
- **[Risk] Text removal blocks the cover.** Mitigation: the rest of ingestion completes; the card falls back to its overlay on a missing image (verified in `codex-lattice-restructure` 7.2) until Ron supplies the scrubbed cover.
- **[Trade-off] Appended sequences put Papers 4–5 far from Papers 1–3.** Accepted for now; re-sequencing is a later geometry discussion.
