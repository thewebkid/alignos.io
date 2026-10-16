## Purpose

Lets James review the staged site from pages on the site itself, with links to what each item is about, while keeping the review and the staging copy out of search and out of the production site.

## ADDED Requirements

### Requirement: Review pages on staging builds
When the build runs with `ALIGNOS_REVIEW=1`, the site SHALL serve the review document at `/review` and the question list at `/review/questions`, pre-rendered like the other pages, from `docs/review/alignos-2-review.md` and `docs/review/james-questions.md`. Without that setting, neither route SHALL exist and the build output MUST NOT contain the documents' text.

#### Scenario: Staging build
- **WHEN** the site is built with `ALIGNOS_REVIEW=1`
- **THEN** `/review` and `/review/questions` are pre-rendered and show the documents' text

#### Scenario: Production build
- **WHEN** the site is built without `ALIGNOS_REVIEW`
- **THEN** `/review` falls through to the home redirect, and no file in the build output contains the review document's opening sentence

### Requirement: Review pages are unlisted
Review pages SHALL carry a `noindex` robots meta tag. They MUST NOT appear in the site menu, the footer, `llms.txt`, `llms.json`, `llms-full.txt`, or `/pages/*.md`.

#### Scenario: Not offered to AI readers
- **WHEN** a staging build's `llms.txt` is read
- **THEN** it contains no link to `/review`

### Requirement: Review links resolve on the site
Links in the review pages SHALL be site-relative and navigate within the site. In the question list, each codex named by title SHALL link to its reader page and each series heading SHALL link to its corridor. Notes addressed to maintainers (how the file is generated) MUST NOT be visible on the page.

#### Scenario: Codex link in the question list
- **WHEN** James opens `/review/questions` and selects *The Harmonic Being Called Earth* in the catalog-review section
- **THEN** the reader opens `/codex/the-harmonic-being-called-earth`

#### Scenario: Corridor link
- **WHEN** James selects the heading "The Evolution of the Sovereign" in the corridors section
- **THEN** the lattice opens at `/lattice?series=the-evolution-of-the-sovereign`

### Requirement: Non-production hosts are not indexed
Responses served on any `*.vercel.app` host SHALL include `X-Robots-Tag: noindex`. Responses on custom domains, including alignos.io, MUST NOT include it.

#### Scenario: Staging host
- **WHEN** `https://alignos-omega.vercel.app/` is requested
- **THEN** the response carries `X-Robots-Tag: noindex`

#### Scenario: Live domain
- **WHEN** alignos.io serves the site after cutover
- **THEN** its responses carry no `X-Robots-Tag` from this rule
