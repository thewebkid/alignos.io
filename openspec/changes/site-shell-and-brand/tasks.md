## 1. Brand assets

- [ ] 1.1 Add `viewBox="0 0 3631 897"` to `client/public/alignos-logo-text.svg` and remove its fixed `width`/`height`; confirm it renders uncropped at 26px tall
- [ ] 1.2 Write `scripts/generate-favicons.js` (sharp) to produce `client/public/favicon.ico` (16/32/48) and `client/public/apple-touch-icon.png` (180) from `alignos-spiral.png`, plus header derivatives `client/public/brand/alignos-spiral-72.png` and `-108.png`
- [ ] 1.3 Run the script and commit the outputs; delete `client/public/favicon.svg` and `client/public/vite.svg`
- [ ] 1.4 Rename `client/public/pdf/The-Evolution-of-the-Sovereign.pdf` → `the-evolution-of-the-sovereign.pdf`

## 2. Header and footer

- [ ] 2.1 Replace the inline SVG and "AlignOS Reader" text in `AppHeader.vue` with the spiral `<img srcset>` + wordmark `<img>` lockup (accessible name "Alignos"), keeping the hover rotation behind `prefers-reduced-motion: no-preference`
- [ ] 2.2 Convert `navItems` to `{ name, to, children? }` with the spec's order and labels; render Return Rooms as a dropdown on desktop and an indented list in the mobile collapse; parent active when a child route is active
- [ ] 2.3 Update `AppFooter.vue`: keep quote and `mailto:info@alignos.io`, point the AI link at `/llms.json` (switched to `/llms.txt` by `ai-orientation-layer`), keep the Coherence Across Scales link, drop the redundant external `alignos.io` link
- [ ] 2.4 Kimi K3 (`kimi-k3-max`) visual pass on header + footer using only existing SCSS tokens: lockup size and alignment, dropdown styling, mobile menu, light/dark contrast check of the gray wordmark; record any token adjustments in this design

## 3. Routes and metadata

- [ ] 3.1 Rename route `browse` → `lattice` at `/lattice`; add routes for `/`, `/before-you-begin`, `/return-room`, `/between-worlds`, `/papers`, `/faq`, `/arc-of-difference` pointing at a minimal pending view until `legacy-pages-and-collections` fills them
- [ ] 3.2 Replace hard-coded `to="/"` / `router.push('/')` lattice links in `ReaderView.vue` and `SearchView.vue` with `{ name: 'lattice' }`
- [ ] 3.3 Derive `includedRoutes` in `vite.config.js` from the route table plus codex routes (removes stale `/faq`, `/about`)
- [ ] 3.4 Update `index.html`: favicon links, `theme-color` unchanged, title/description/JSON-LD to "Alignos"; set per-route titles to `{Page} | Alignos` (home: `Alignos`)
- [ ] 3.5 Sweep UI copy for "AlignOS"/"Align OS" in chrome and meta (not in verbatim legacy text or codex bodies) and change to "Alignos"

## 4. Legacy URL redirects

- [ ] 4.1 Write `scripts/capture-legacy-urls.js`: read page sitemap and PDF links from `analysis/legacy-pages/`, fetch the WordPress post/ripple sitemap, match PDFs and ripple slugs to catalog ids, write `data/legacy-urls.json` with an `unmatched` section
- [ ] 4.2 Resolve every `unmatched` row by hand (or mark `retired`) and remove the section; commit `data/legacy-urls.json`
- [ ] 4.3 Extend `scripts/generate-redirects.js` to merge static rules, provenance id redirects, and `legacy-urls.json`; de-duplicate by source; fail on an `unmatched` section or unknown catalog id; print totals
- [ ] 4.4 Add the page rules from the spec (`/codex-lattice/` → `/lattice`, `/contact/` → `/faq`, `/newsletter/`, `/login/`, `/lostpassword/` → `/`) and regenerate `vercel.json`

## 5. Verify

- [ ] 5.1 `npm run build` succeeds; `client/dist` contains static HTML for every route in the route map
- [ ] 5.2 Preview locally: lockup, nav (desktop + mobile), active states, footer, favicon in a tab, reader "back to lattice" goes to `/lattice`
- [ ] 5.3 Spot-check five redirect rows (one per kind plus a `-1` PDF variant) with `vercel dev` or against the generated config
- [ ] 5.4 `openspec validate site-shell-and-brand` passes
