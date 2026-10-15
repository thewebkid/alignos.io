## Why

alignos.io is moving from WordPress to this app, so the reader stops being "AlignOS Reader" beside the real site and becomes Alignos itself. The shell (brand, favicon, nav, footer, routes) still presents a single-purpose reader, and none of the old WordPress URLs will survive the DNS cutover unless we redirect them.

## What Changes

- Replace the inline SVG spiral and the "AlignOS Reader" text with the Alignos brand: `alignos-spiral.png` and `alignos-logo-text.svg` side by side in the top-left of every page, at roughly today's header height, keeping the hover rotation on the spiral.
- Generate a favicon set from `alignos-spiral.png` (`favicon.ico` plus a 180px `apple-touch-icon.png`). Delete `favicon.svg` and the unused `vite.svg`.
- Fix `alignos-logo-text.svg` so it scales (add a `viewBox`) and derive small header-size copies from the high-res masters.
- Rename the written brand to "Alignos" in titles, meta, structured data, and our own UI copy. Verbatim legacy text is unchanged.
- **BREAKING (URL):** `/` becomes the home page; the lattice moves to `/lattice`. `/codex-lattice` redirects to `/lattice`, and in-app links that meant "the lattice" point at `/lattice`.
- Restore the live site's navigation: Codex Lattice · Return Rooms ▾ (Before You Begin…, Begin a Return Room, The Arc of Difference) · Between Worlds · Papers · FAQ. Search and the theme toggle stay.
- Footer keeps the "You are not asked to arrive complete. Only to return willing." line and uses `info@alignos.io` as the only contact.
- Add permanent redirects from the WordPress site's URLs (retired pages, `wp-content/uploads/*.pdf` links, `/ripple/{slug}` posts) to their new homes so shared links survive the cutover.
- Pages behind the new nav entries are built in `legacy-pages-and-collections`. Until then, the routes exist as placeholders so the shell can ship first.

## Capabilities

### New Capabilities
- `site-shell`: Brand lockup, favicon, written brand name, primary navigation, footer, and the top-level route map (home vs lattice).
- `legacy-url-redirects`: Permanent redirects from the retired WordPress alignos.io URLs (pages, uploaded PDFs, ripple posts) to the new site.

### Modified Capabilities
<!-- None. Codex-id redirects in asset-identity are unchanged; this adds a separate redirect family. -->

## Impact

- `client/src/components/AppHeader.vue`, `AppFooter.vue`, `client/src/router/index.js`, `client/index.html`, `client/vite.config.js` (`includedRoutes`), in-app links to `/` in `ReaderView.vue` and `SearchView.vue`.
- `client/public/`: new favicon and header assets; delete `favicon.svg` and `vite.svg`; edit `alignos-logo-text.svg`.
- `vercel.json` gains a second redirect family (WordPress URLs). The existing `/codex/{old}` redirects stay.
- New data file for the legacy URL map, plus a one-time capture of the WordPress ripple/post sitemap.
- Styling stays in the existing SCSS theme (`client/src/assets/scss/`). Nothing from the WordPress theme is imported except the logo.
