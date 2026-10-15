## Why

The site is meant to be read by a sovereign *and* their AI companion, but its machine entry point is stale. `llms.json` is hand-written, says 133/134 codexes, has no tone, series, or collection data, and there is no `llms.txt` on this site. James' guidance sets the frame: AI is "an orientation layer… not an authority", "AI-generated metadata is hypothesis, not source truth", public material may be AI-readable "provided attribution remains clear and the live websites remain the canonical source", and the Return Room asks people to "upload these PDFs to your AI". This change makes that simple and honest.

## What Changes

- Generate `llms.txt` at build in the llmstxt.org shape:
  - James' own opening lines as the summary
  - a short factual orientation (what is canonical, how to cite, that AI-assisted metadata is a hypothesis)
  - links to the guidance pages, every codex (raw markdown and reader URLs, with the pull quote as the note), series corridors (planned positions marked "not yet written"), collections, bundles, and the API
- Generate `llms-full.txt`: guidance pages plus every published codex's full text, each with title, attribution, and canonical URL.
- Replace the hand-written `llms.json` with a generated one:
  - accurate counts and endpoints
  - per-codex tone marker, series, collections, and `metadataStatus` (`draft` when `needs_review`, else `reviewed`)
  - the series registry, including planned positions
  - collections and bundles
- Generate **reading bundles**: one markdown file per lattice collection and per series (e.g. `/bundles/return-room-readings.md`), concatenating James' collection notes and each codex's full text with attribution and canonical links. The Return Room page links its bundle next to "upload these PDFs to your AI".
- Expose raw page markdown at `/pages/{slug}.md` for the guidance pages, so AI readers get the same text humans see.
- Codex copy/download exports (already in the reader) carry attribution, canonical URL, and a pointer to `/llms.txt` instead of `/llms.json`.
- Discovery tags in the document head: `llms.txt` on every page; on reader pages, `rel="alternate"` to the codex's raw markdown.
- Footer AI link switches to `/llms.txt`.
- No in-site chatbot. "A Return Room is not a website feature."

## Capabilities

### New Capabilities
- `ai-entry-points`: `llms.txt`, `llms-full.txt`, generated `llms.json`, raw page and codex markdown, head discovery tags, and export attribution.
- `reading-bundles`: Generated per-collection and per-series markdown bundles for bringing a set of codexes to an AI in one file.

### Modified Capabilities
- `lattice-build`: Published codex metadata carries attribution and a metadata review status.
- `site-pages`: The Begin a Return Room page offers its readings bundle.

## Impact

- `client/scripts/build-lattice.js` (or a sibling `build-ai-layer.js` run in `build:lattice`) writes `client/public/llms.txt`, `llms-full.txt`, `llms.json`, `bundles/*.md`, `pages/*.md`.
- Delete the hand-written `client/public/llms.json`; the generated outputs are added to `client/.gitignore` like the existing generated lattice files.
- `client/src/lib/markdown-export.js`, `ReaderView.vue` (head tags), `client/index.html`, `AppFooter.vue`, return-room page markdown.
- API endpoints unchanged in shape; meta gains `author`, `canonicalUrl`, `metadataStatus`.
- Depends on all three prior changes (pages, collections, series registry, redirects/brand).
