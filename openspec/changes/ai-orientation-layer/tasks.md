## 1. Build metadata

- [ ] 1.1 `build-lattice.js`: add `author`, `canonicalUrl` (from `ALIGNOS_CANONICAL_BASE`, default `https://alignos.io`), and `metadataStatus` to full and meta lattice entries
- [ ] 1.2 Confirm API endpoints pass the new fields through unchanged

## 2. Generator

- [ ] 2.1 Extend `client/scripts/build-ai-layer.js` (created by `legacy-pages-and-collections` with collection bundles); add new outputs to `client/.gitignore`
- [ ] 2.2 Generate `pages/{slug}.md` from page markdown (prompt → blockquote, collection → linked list with notes)
- [ ] 2.3 Generate series bundles `bundles/series/{series-id}.md` for series with published members, in the collection bundles' format; planned positions as one-line markers; no AI-written fields
- [ ] 2.4 Generate `llms.json` (orientation, endpoints with measured sizes, codex entries per spec, series registry, collections, bundles); delete hand-written `client/public/llms.json`
- [ ] 2.5 Generate `llms.txt` (H1, James' quoted summary, orientation, Start here / Codexes / Series / Collections & bundles / API / Optional sections; counts computed)
- [ ] 2.6 Generate `llms-full.txt` (orientation, guidance pages, every codex with header); print size

## 3. Site integration

- [ ] 3.1 `index.html`: `rel="llms"` and `rel="alternate"` to `/llms.txt`; drop JSON meta; update the AI comment
- [ ] 3.2 Reader pages: `rel="alternate" type="text/markdown"` to `/md/{id}.md`
- [ ] 3.3 `markdown-export.js`: attribution header with canonical URL; trailing pointer to `/llms.txt`
- [ ] 3.4 Footer AI link → `/llms.txt`
- [ ] 3.5 Lattice collection and series headers: bundle download (pages carry no downloads beyond the Return Room bundle from `legacy-pages-and-collections`)
- [ ] 3.6 Verify the reader's PDF link resolves by catalog id (it currently derives from `originalFileName`)

## 4. Verify

- [ ] 4.1 Build; llms.txt lists 138 codexes, series with "n of N written", planned positions unlinked
- [ ] 4.2 llms.json validates as JSON; spot-check `the-codex-of-the-spiral` (tone, series 4/7) and `the-ecology-of-becoming` (`metadataStatus: draft`)
- [ ] 4.3 `bundles/series/the-evolution-of-the-sovereign.md` lists members in position order with Codex VI as a "not yet written" marker; contains no catalog description text
- [ ] 4.4 Fetch `/pages/faq.md`, `/md/the-fundamental-arc.md`, and a reader page head from `vite preview`
- [ ] 4.5 Ask a fresh AI session to read `/llms.txt` from the preview and answer "where should I begin with a Return Room?"; confirm it cites `/codex/` links and doesn't treat draft metadata as fact
- [ ] 4.6 `openspec validate ai-orientation-layer --strict` passes
