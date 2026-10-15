## Context

- `client/public/llms.json` is hand-written (Jan 2026). It says "134"/"133", has no tone, series, or collection data, and its key topics are AI-chosen.
- `index.html` points AI readers to it via a comment, `<link rel="llms">`, and `<meta name="llms">`.
- The old reader (`c:\src\alignos\client\public\llms.txt`) had a decent llms.txt, but it was hard-coded to `alignos.cosmiccreation.net` and hand-maintained.
- `client/public/md/{id}.md` already serves raw codex markdown (138 files).
- API: `/api/codex-lattice-meta`, `/api/codex-lattice`, `/api/codex/{id}` serve the generated JSON.
- `markdown-export.js` builds copy/download payloads and ends them with `LLMs: {origin}/llms.json`.
- Generated build outputs are git-ignored (`client/.gitignore`), and `npm run build` runs `build:lattice` before `vite-ssg build`.
- By the time this change lands, `data/series.json`, `data/collections.json`, page markdown in `client/src/content/pages/`, and the site shell all exist.

## Goals / Non-Goals

**Goals:**
- Everything machine-facing is generated from the same data the site uses, so it can't drift.
- Our words are limited to navigation and provenance facts. Anything about the work itself is James' text (quotes, notes, codex bodies).

**Non-Goals:**
- An in-site chatbot, embeddings, or a RAG index. Per James, a RAG index is regenerable rather than root, and it isn't needed for staging.
- An AI-companion page for humans. `llms.txt` plus the FAQ prompts cover it for now.
- Translations.

## Decisions

### D1. One generator script, run inside `build:lattice`
`client/scripts/build-ai-layer.js` runs after `build-lattice.js` and reads:
- the generated lattice
- `generated/series.json` and `generated/collections.json`
- page markdown

It writes `client/public/llms.txt`, `llms-full.txt`, `llms.json`, `bundles/**.md`, and `pages/*.md`. All outputs are git-ignored. Keeping it separate from `build-lattice.js` keeps that script focused on the lattice.

### D2. Canonical base URL is fixed, not the deploy origin
`ALIGNOS_CANONICAL_BASE` defaults to `https://alignos.io`. Machine outputs always cite canonical URLs, even on preview deployments, because James wants the live site to stay canonical. Relative links are used only for in-site navigation.

### D3. Orientation text is a short, fixed, factual template
It's written once in the generator and lists the canonicity, attribution, metadata-hypothesis, and draft-status facts from the spec. It contains no description of what Alignos "is" beyond James' quoted home lines. Changes go through review like code.

### D4. Codex notes in llms.txt use the pull quote, not the description
Pull quotes are James' sentences. Descriptions are AI-written atmosphere, which James approved, but they're still hypothesis. `llms.json` carries both, with `metadataStatus`. Bundles carry neither.

### D5. Page markdown for machines
`pages/{slug}.md` is produced from `client/src/content/pages/{slug}.md`:
- `prompt` blocks become blockquotes.
- `collection` blocks become numbered lists of `[Title](canonical reader URL)` with James' notes.

Home isn't exported (D2 of `legacy-pages-and-collections`). llms.txt links to it as a URL.

### D6. llms-full.txt size
At roughly 3 MB (138 codexes), the file is large but in line with common llms-full practice. llms.txt states its size and recommends `/md/{id}.md` or bundles for focused reading. The size is computed and printed at build.

### D7. Head tags
- Keep `<link rel="llms">`, pointing at `/llms.txt`, for continuity.
- Add `<link rel="alternate" type="text/plain" title="llms.txt" href="/llms.txt">`.
- Reader pages add the markdown alternate through the existing per-route head handling.
- Remove the `<meta name="llms">` pointing at JSON, and update the HTML comment to name `/llms.txt`.

### D8. Export attribution header
`markdownForExport` prepends:
```
# {title}
James Mahu with Lumina · {canonicalUrl}
```
That sits above the cover `<img>`; the body follows. The clipboard payload's trailing line becomes `LLMs: {canonicalBase}/llms.txt`, and it no longer opens with the browser URL (the header carries the canonical one). The download ends with the same pointer, so copy and download are one text, and `client/scripts/attribute-md.js` writes that text over `dist/md/{id}.md` after the build, so a codex fetched on its own carries its byline (sources in `public/md` are untouched; the dev server serves them raw). The header is always written; 135 of 138 bodies already open with `# {title}`, so the body's leading H1 is dropped when it matches the title, and headings don't repeat.

## Risks / Trade-offs

- [Machine outputs advertise canonical URLs that 404 before DNS cutover] → Accepted for staging: the URLs are correct once cutover happens, and preview testing uses relative paths. Note it in the staging handoff.
- [Draft metadata gets quoted by AIs as fact] → `metadataStatus` plus the orientation statement. Bundles exclude AI-written fields entirely.
- [Bundle size for long series] → Per-series bundles are bounded by series length (largest ~10 codexes). Sizes are printed at build.
- [Old `llms.json` consumers] → The path stays the same with a richer shape. Existing endpoint keys (`endpoints.metadata`, etc.) are preserved.

## Migration Plan

This lands last. Remove the hand-written `llms.json` in the same commit that adds generation, so there's no gap. Rollback is a git revert, which restores the static file.
