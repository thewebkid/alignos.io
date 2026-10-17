# scroll-restoration Specification

## Purpose
Defines where the page is scrolled after every navigation: the top by default, a codex's saved position only while it is being read, and the lattice's own remembered position.
## Requirements
### Requirement: Navigation starts at the top
Every navigation that changes the path SHALL show the new page scrolled to the top, except a codex being resumed and the lattice (see Lattice memory). This SHALL hold when both pages are served by the same view (for example `/faq` → `/papers`, or one codex → another), and for links, header navigation, and browser back/forward alike. A navigation that changes only the query string of the current page MUST NOT reset the scroll position by itself.

#### Scenario: Between two standard pages
- **WHEN** a visitor scrolled halfway down `/faq` activates the header link to `/papers`
- **THEN** `/papers` is shown scrolled to the top

#### Scenario: Between two threshold pages
- **WHEN** a visitor scrolled down `/between-worlds` navigates to `/arc-of-difference`
- **THEN** `/arc-of-difference` is shown scrolled to the top

#### Scenario: Back to a page
- **WHEN** a visitor goes from `/faq` (scrolled down) to `/papers` and presses the browser back button
- **THEN** `/faq` is shown scrolled to the top

#### Scenario: Query-only change
- **WHEN** the lattice's filter changes `?series=` without changing the path
- **THEN** the scroll position is governed by the lattice's filter-change rule, not reset to the top

### Requirement: Codex resumes only while being read
Opening a codex SHALL restore its saved scroll position if and only if the codex has been started (any reading progress is recorded) and is not complete (furthest progress below 95%). A codex that was never started, or that is complete, SHALL open at the top. The restored position SHALL be reached even when the codex text finishes loading after navigation.

#### Scenario: Never opened
- **WHEN** a visitor opens a codex with no recorded progress
- **THEN** it opens at the top

#### Scenario: Partly read
- **WHEN** a visitor who scrolled a codex to 40% leaves and later opens it again
- **THEN** it opens at the position where they left off

#### Scenario: Finished
- **WHEN** a visitor who reached 95% or more of a codex opens it again
- **THEN** it opens at the top

#### Scenario: Finished, then re-read part of it
- **WHEN** a visitor finished a codex, returned, scrolled to 40%, and left
- **THEN** opening it again starts at the top

#### Scenario: Text loads late
- **WHEN** a partly read codex is opened before its text has loaded
- **THEN** once the text is shown, the view is at the saved position, not cut short

### Requirement: Codex-to-codex navigation
Moving from one codex directly to another (previous/next, edition links, cross-reference links in the text) SHALL apply the codex resume rule to the new codex. Scroll position left over from the previous codex MUST NOT be recorded as reading progress for the new codex.

#### Scenario: Next in series
- **WHEN** a visitor halfway through codex A activates "next" to codex B, which they have never opened
- **THEN** codex B opens at the top and has no recorded progress until the visitor scrolls it

#### Scenario: Cross-reference to a partly read codex
- **WHEN** a visitor activates a cross-reference link to a codex they had read to 30%
- **THEN** that codex opens at their saved position

