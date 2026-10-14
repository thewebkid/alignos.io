---
name: codex-ingest
description: >-
  Convert a James Mahu / Lumina codex PDF into alignos.io house-style markdown with
  verbatim text, correct paragraph vs. poetic line-break structure, and all
  print-only content (TOC, Note to Readers promos, running headers, page numbers,
  cover/title furniture, baked-in cover titles) removed. Use when ingesting a new
  codex or paper PDF, re-converting one, fixing spacing/line breaks in a codex md,
  or auditing a codex for print-only content.
---

# Codex Ingest

James writes each PDF as a standalone, shareable transmission. The HTML codex is a
different medium: it keeps **every word of the transmission, verbatim**, and drops
everything that only exists because the work is a printable document.

Fidelity standard: `client/public/pdf/conversion-prompt.txt` (January 2026). Never
paraphrase, correct, modernize, or "fix" James' text — including apparent typos or
repeated section titles. The only text that may be removed is print-only content.

## Asset identity

The kebab-case id (e.g. `THE-FUNDAMENTAL-ARC.pdf` → `the-fundamental-arc`) is the
basename for every asset:

| Asset | Path |
| --- | --- |
| PDF | `client/public/pdf/{id}.pdf` |
| Markdown | `client/public/md/{id}.md` |
| Cover (text-free) | `client/public/covers/{id}.jpg` |
| Thumb (from cover) | `client/public/thumb/{id}.jpg` |
| Original cover with text | `blobs/originals/{id}.jpg` (gitignored; `fd -I`) |

Covers must have **no baked-in text** — the HTML overlay renders title and tone
marker so the page stays translatable (`cover.title_overlay: true` in the catalog).
Ron prepares covers; if only a text-bearing cover exists, flag it, don't ship it.

## Workflow

1. **Geometry pass** (deterministic — paragraph structure is a fact of the PDF, not a judgment):

   ```powershell
   $env:PYTHONIOENCODING='utf-8'
   python .cursor/skills/codex-ingest/scripts/codex_pdf_to_md.py client/public/pdf/{id}.pdf <scratch>/{id}.md --title "Catalog Title"
   ```

   Write to a scratch folder first, never straight over an existing md. Produces
   `{id}.md` plus `{id}.report.md`.

2. **Read the report.** It lists what was auto-removed (cover page, TOC page, Note to
   Readers, running header, footers), heading tiers, merged numeral headings, tables /
   same-row text, possible promo lines, inline images, and hard breaks that had no
   U+200B marker (each one needs a look against the rendered page).

3. **Judgment pass** (AI): compare against rendered pages
   (`page.get_pixmap(dpi=90).save(...)`, then view the PNG) for anything flagged:
   - Tables → markdown tables (cell text verbatim, reading order fixed).
   - Registry at the end → `- **Label:** value` bullets when values are single-line
     (see `framing-the-mirror.md`); multi-line values stay as `**Label:**` + lines.
   - Dialogue → `**Speaker:**` on its own line (`**Sovereign:**`, `**Lumina:**`, `**You said:**`).
   - Any print-only content the script didn't catch (checklist below).

4. **Fidelity proof**:

   ```powershell
   python .cursor/skills/codex-ingest/scripts/word_diff.py client/public/pdf/{id}.pdf <scratch>/{id}.md
   ```

   Every reported chunk must be one of: the added `# Title`, a print-only removal, a
   numeral period (`II` → `II.`), or a speaker colon. Anything else is a defect. When
   re-converting an existing codex, also diff old md vs. new md — word counts should match.

5. **Install and publish**: copy into `client/public/md/{id}.md`, confirm the catalog
   `pull_quote` is still an exact substring (`rg -F "<quote>" client/public/md/{id}.md`),
   then `npm run build:lattice` in `client/`.

## How the PDF geometry maps to markdown

James' PDFs come from Google Docs (Nunito). Measured, consistent across codices:

| PDF signal | Meaning | Markdown |
| --- | --- | --- |
| Gap ≈ 14 pt between lines | new paragraph | blank line |
| Gap ≈ 2 pt, line ends with invisible U+200B | soft return (poetic break) | `two spaces + newline` |
| Gap ≈ 2 pt, no marker, next word wouldn't fit | word wrap | join with a space |
| Page boundary | same rules: marker → break, full line → wrap, else paragraph | — |
| Nunito Light | body | plain |
| Nunito Regular/Medium/SemiBold (upright, body size) | emphasis | `**bold**` |
| Nunito Light Italic | emphasis | `*italic*` |
| Nunito Regular/Medium Italic (heavier than body) | strong emphasis | `***bold italic***` |
| Larger all-italic lines | epigraph / subtitle | `*italic*` paragraph, not a heading |
| Bare numeral (`II`) above a title | section label | `## II. Title` (corpus convention) |
| Wide thin drawn line | divider | `---` |
| `●` (ArialMT) | bullet | `- ` |

Heading levels: if the PDF has a TOC, its entries are the `##` sections (the TOC is
the author's outline even though the page itself is print-only); other heading sizes
step down from `###`. Without a TOC, sizes map to `##`/`###`/`####` largest-first.
There is exactly one `#` — the catalog title. An interior title page that repeats it
becomes `## Codex: …` (as in `framing-the-mirror.md`).

## Print-only checklist

Remove (and list in your summary what was removed):

- **Cover page** — full-page image page; any title text on it.
- **Table of contents** — "Contents" pages, entries with page numbers.
- **Note to Readers / cross-promotion** — e.g. "Over 100 Codices can be found on
  Alignos.io … CoherenceAcrossScales.org … In particular: *The Inversion Dialogues*".
  The site itself is the context; these point outward from a standalone PDF.
- **Running headers** (small text repeated at the top of every page) and **page
  numbers / "Page N" footers**.
- **Page references** — "see page 12", "on the following pages"; flag rather than
  silently delete if the sentence carries meaning beyond the reference.
- **Download / print / share instructions** aimed at the PDF reader.
- **Baked-in titles in images** — cover art must be text-free (Ron handles the
  image; you flag it). Inline images with text: flag for Ron.

Keep (these are the transmission, not furniture):

- Frontispiece poems and epigraphs before the first section.
- Registry / Codex Registry, Stillpoints, Field Notes, Whispers, closing seals.
- Glyphs (❖ ✧ ◉ ✦) in headings and standalone glyph lines.
- James' own titles even if odd (e.g. two sections both titled "The Mirror That
  Remembers") — flag for James, never fix.

When unsure whether something is print-only, ask Ron rather than deleting it.

## Notes

- Do **not** use or modify `C:\src\pyscripts\pdf_to_md.py` (shared with CAS; built for
  the Inversion Dialogues layout — it treats every codex line as a paragraph and keeps
  headers/page numbers).
- New catalog metadata (tone marker, structural role, entry point, pull quote) is
  AI hypothesis: mark `needs_review: true` and record provenance in
  `data/codex-provenance.json`.
- Verify asset identity after adding files: every catalog id has md/pdf/covers/thumb
  with the id basename and catalog paths match.
