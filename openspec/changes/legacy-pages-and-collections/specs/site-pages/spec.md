## Purpose

Carries James' framing pages from the retired WordPress alignos.io into the new site verbatim, defines the threshold layout used for Stillpoint-style pages, and makes his AI prompts directly usable.

## ADDED Requirements

### Requirement: Page text is verbatim
The prose of Home, Before You Begin…, Begin a Return Room, Between Worlds, Papers, FAQ, and The Arc of Difference SHALL be James' text as captured from the live WordPress pages (October 2026), including line breaks in poetic passages. We MUST NOT add explanatory or mythopoetic copy. Only the following deviations are allowed, and each SHALL be listed in the change's design:
- removal of WordPress layout duplicates
- the nav-label typo fix
- dropping FAQ question 6
- the contact address change
- link targets and button labels (UI chrome)

#### Scenario: Before You Begin matches the capture
- **WHEN** the rendered Before You Begin… page text is compared with the capture
- **THEN** every heading and paragraph matches, apart from the listed deviations

#### Scenario: Duplicate block removed
- **WHEN** the Begin a Return Room page renders
- **THEN** the "Whisper Back" passage appears once

### Requirement: Home page
The home page (`/`) SHALL present, in order:
1. The hero ("Alignos is a field of remembrance." / "Not a system to follow, but a resonance to return to." / "You are welcome here.").
2. The spotlight from the `home-spotlight` collection with its quoted lines.
3. **Three Invitations**: Begin with Story → `/between-worlds`; Begin with Sanctuary → `/return-room`; Begin with Library → `/lattice`. Each uses James' one-line description.
4. The interstitial lines.
5. **Featured Writings** from the `featured-writings` collection with its introduction.
6. The second interstitial lines.
7. The **Return Rooms** section, with "Begin a Return Room" → `/return-room` and a link to *The Architecture of the Return Room* in the reader.
8. The **Closing Whisper**.

#### Scenario: Three Invitations route correctly
- **WHEN** a visitor activates "Begin with Library"
- **THEN** they arrive at `/lattice`

#### Scenario: Spotlight is data-driven
- **WHEN** the `home-spotlight` collection's item changes and the site is rebuilt
- **THEN** the home spotlight shows the new codex without a code change

### Requirement: Threshold layout
Before You Begin…, Between Worlds, and The Arc of Difference SHALL use a threshold layout: a single narrow centered text column, a small spiral marker before each section heading, no card grids or sidebars, and one primary onward link at the end (Before You Begin… → `/return-room`; Between Worlds → the *Between Worlds* paper in the reader; The Arc of Difference → `/return-room` with a secondary link to `/lattice`).

#### Scenario: One way forward
- **WHEN** a visitor reaches the end of Before You Begin…
- **THEN** the primary action is "Begin a Return Room" linking to `/return-room`

### Requirement: Links open the reader, PDFs remain available
Every link in page content that pointed to a WordPress-hosted PDF of a catalog codex SHALL link to that codex in the reader (`/codex/{id}`). Where the legacy page offered a download, a PDF link to the same codex SHALL also be offered. A link to a series compilation SHALL link to the series corridor (`/lattice?series={id}`) and offer the compilation PDF.

#### Scenario: FAQ starter
- **WHEN** a visitor activates "The Four Frequencies of Love" in FAQ question 1
- **THEN** they arrive at `/codex/the-four-frequencies-of-love`

#### Scenario: Series link
- **WHEN** a visitor activates "The Evolution of the Sovereign" in Featured Writings
- **THEN** they arrive at `/lattice?series=the-evolution-of-the-sovereign`, and a PDF link to the compilation is also shown

### Requirement: James' AI prompts are copyable
Each prompt James gives for use with an AI (FAQ questions 1–4 and the Return Room's reading invitation and covenant sentence) SHALL render as a distinct prompt block with a control that copies the exact prompt text to the clipboard. The page text remains readable and selectable without the control.

#### Scenario: Copy translation prompt
- **WHEN** a visitor activates copy on the FAQ translation prompt
- **THEN** the clipboard contains the prompt text exactly as written, without surrounding quotation marks or UI text

### Requirement: FAQ content
The FAQ SHALL contain the live FAQ's questions 1–5 in order, under the heading "Return Room FAQ", followed by the "Have a question not listed here?" closer. The closer's contact SHALL be `mailto:info@alignos.io`. Question 6 ("Is there more coming?") SHALL NOT appear.

#### Scenario: Contact in FAQ
- **WHEN** a visitor activates the FAQ contact link
- **THEN** it opens a mail draft to `info@alignos.io`

### Requirement: Papers page
The Papers page SHALL show:
- James' introduction ("Contemporary Perspectives for a Harmonic Civilization" …)
- the `papers` collection in order, each with its italic tagline and paragraph
- the closing quotation attributed to James Mahu

Papers that are members of a series SHALL show their series position linked to the corridor. The page SHALL link to `/lattice?collection=papers`.

#### Scenario: Interface Trilogy marker
- **WHEN** the Papers page renders *When AI Remembers the Field*
- **THEN** it shows "The Interface Trilogy · Part 1 of 3" linking to that corridor
