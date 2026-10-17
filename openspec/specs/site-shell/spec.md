# site-shell Specification

## Purpose
Defines the Alignos site shell: the brand lockup, favicon, written brand name, primary navigation, footer, and the top-level route map that every page shares.
## Requirements
### Requirement: Brand lockup in the header
Every page SHALL show the Alignos brand in the top-left of the header: the spiral mark (`alignos-spiral.png`) and the wordmark (`alignos-logo-text.svg`) side by side, linking to the home page (`/`). The lockup SHALL be about the same height as the previous header logo (spiral about 36px tall on desktop), and the wordmark SHALL scale without cropping. The header MUST serve reduced-size derivatives of the spiral, not the full-resolution master. The lockup SHALL have the accessible name "Alignos". The previous inline SVG spiral and the "AlignOS Reader" text MUST NOT appear.

#### Scenario: Lockup renders on a reader page
- **WHEN** a visitor opens `/codex/the-fundamental-arc`
- **THEN** the header's top-left shows the spiral image followed by the "alignos" wordmark, and activating it navigates to `/`

#### Scenario: Header asset is not the master
- **WHEN** the header loads on a 2x display
- **THEN** the spiral image requested is a derivative sized for the header (not the 624px master)

#### Scenario: Spiral hover respects reduced motion
- **WHEN** a visitor hovers the brand lockup
- **THEN** the spiral rotates as it does today, unless the visitor has `prefers-reduced-motion: reduce`, in which case it does not animate

#### Scenario: Wordmark scales instead of cropping
- **WHEN** the wordmark is rendered at header height
- **THEN** the full word "alignos" (including the gold dot) is visible and proportionally scaled

### Requirement: Favicon derives from the spiral
The site SHALL serve a favicon generated from `alignos-spiral.png`: `favicon.ico` (containing at least 16, 32, and 48px images) and a 180px `apple-touch-icon.png`, both linked from the document head. The site MUST NOT link an SVG favicon, and `favicon.svg` and `vite.svg` SHALL be removed.

#### Scenario: Browser tab shows the spiral
- **WHEN** any page is loaded
- **THEN** the document head links `/favicon.ico` and `/apple-touch-icon.png`, and no `image/svg+xml` icon link is present

### Requirement: Written brand name is "Alignos"
Page titles, meta descriptions, structured data, and UI chrome written by us SHALL use "Alignos". Page titles SHALL follow `{Page title} | Alignos`, and the home page title SHALL be `Alignos`. The strings "AlignOS Reader" and "Align OS" MUST NOT appear in UI chrome or metadata. Text quoted verbatim from James' legacy pages or codexes is exempt.

#### Scenario: Lattice page title
- **WHEN** a visitor opens `/lattice`
- **THEN** the document title is `Codex Lattice | Alignos`

#### Scenario: Legacy quotation is untouched
- **WHEN** a page quotes legacy text that spells the name differently
- **THEN** the quoted text keeps its original spelling

### Requirement: Route map
The site SHALL serve these routes:

| Path | Page |
|---|---|
| `/` | Home |
| `/lattice` | Codex Lattice |
| `/codex/{id}` | Reader |
| `/search` | Search |
| `/before-you-begin` | Before You Begin… |
| `/return-room` | Begin a Return Room |
| `/between-worlds` | Between Worlds |
| `/papers` | Papers |
| `/faq` | FAQ |
| `/arc-of-difference` | The Arc of Difference |

In-app links that lead to the lattice (reader "back"/"browse" actions, search empty states) SHALL go to `/lattice`. Unknown paths SHALL go to the home page.

#### Scenario: Lattice has moved
- **WHEN** a visitor opens `/lattice`
- **THEN** the Codex Lattice grid is shown

#### Scenario: Reader returns to the lattice
- **WHEN** a reader on `/codex/{id}` uses the browse/back-to-lattice action
- **THEN** they arrive at `/lattice`, not `/`

### Requirement: Every route is pre-rendered
Every route in the route map, including each published `/codex/{id}`, SHALL be pre-rendered to static HTML at build time, so its content is readable without running JavaScript. Routes that are not in the route map MUST NOT be pre-rendered, except the review pages that staging builds add (`staging-review`).

#### Scenario: Static HTML for a page
- **WHEN** `client/dist/papers.html` (or equivalent) is fetched from the build output
- **THEN** it contains the page's heading and body text in the HTML

### Requirement: Primary navigation
The header navigation SHALL show, in order: **Codex Lattice** (`/lattice`), **Return Rooms** (a menu with **Before You Begin…** → `/before-you-begin`, **Begin a Return Room** → `/return-room`, **The Arc of Difference** → `/arc-of-difference`), **Between Worlds** (`/between-worlds`), **Papers** (`/papers`), **FAQ** (`/faq`), followed by the reading-settings control (**Aa**) and search. The active item SHALL be highlighted, and Return Rooms SHALL be highlighted when any of its children is active. On narrow screens the same items appear in the collapsed menu, with Return Rooms' children listed beneath it.

#### Scenario: Return Rooms menu
- **WHEN** a visitor opens the Return Rooms menu
- **THEN** it lists Before You Begin…, Begin a Return Room, and The Arc of Difference in that order

#### Scenario: Parent highlighted for child page
- **WHEN** the current route is `/before-you-begin`
- **THEN** the Return Rooms nav item is shown as active

#### Scenario: Mobile menu
- **WHEN** the viewport is below the navbar breakpoint and the menu is opened
- **THEN** all nav items, including the three Return Rooms children, are reachable

### Requirement: Reading settings
The **Aa** control SHALL open reading settings: theme (Light, Indigo, Auto), reading font, text size, glossary underlines (Always, First two, Off), and reading pace (Unhurried, Typical, Brisk). Changes SHALL apply immediately and persist in the browser. Without a saved choice, the theme SHALL be Indigo (dark), the font Source Sans 3, glossary underlines Always, and the pace Typical (200 words per minute). Glossary terms SHALL open their definition when clicked in every glossary mode. The panel SHALL also open from the glossary popup and the codex menu.

#### Scenario: First visit
- **WHEN** a visitor with no saved settings loads any page
- **THEN** the page renders in the Indigo theme without first painting the light theme

#### Scenario: Glossary underlines after the second use
- **WHEN** the glossary setting is First two and a term appears three times in a codex
- **THEN** only the first two uses are underlined, and clicking the third opens its definition

#### Scenario: Pace changes reading times
- **WHEN** the pace is Unhurried
- **THEN** lattice reading times and the reader's minutes-left line use 150 words per minute

### Requirement: Footer
Every page SHALL end with a footer that shows the line "You are not asked to arrive complete. Only to return willing." and a contact link `mailto:info@alignos.io`. The footer MUST NOT reference `contact@alignos.io`, a contact form, or a newsletter. The footer SHALL link to the machine-readable entry point for AI readers (`/llms.txt`) and to Coherence Across Scales.

#### Scenario: Contact link
- **WHEN** a visitor activates the footer's contact link
- **THEN** it opens a mail draft to `info@alignos.io`

