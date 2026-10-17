## Purpose

Defines how the Codex Lattice remembers its scope, reading-progress filter, and scroll position between visits, how links set that memory, and how filter changes behave without moving the filter controls.

## ADDED Requirements

### Requirement: Lattice memory
The lattice SHALL remember its scope (Everything, a series, "Not in a series", or a collection), its reading-progress filter, and its scroll position, persisted in the browser across reloads and visits. Opening `/lattice` without a scope in the URL SHALL restore all three, whatever the route of arrival (header link, browser back/forward, reader browse action, home page, search). When a remembered scope is restored, the URL SHALL show it (`?series=` or `?collection=`). A remembered scope that no longer exists SHALL fall back to Everything.

#### Scenario: Return through the header
- **WHEN** a visitor filtered the lattice to a series and "In progress", scrolled down, opened a codex, and then activates **Codex Lattice** in the header
- **THEN** the lattice shows the same series and progress filter at the same scroll position, and the URL includes `?series={id}`

#### Scenario: Reload
- **WHEN** a visitor reloads `/lattice` after scrolling it
- **THEN** the lattice returns to the same scope, progress filter, and scroll position

#### Scenario: First visit
- **WHEN** a visitor with no lattice memory opens `/lattice`
- **THEN** the lattice shows Everything and Any progress at the top

### Requirement: Scoped links overwrite the memory
In-app links that open a scoped lattice (reader series context, home featured series, collection lists) SHALL always replace the remembered state: their scope, the progress filter set to Any progress, and the scroll position at the top. Opening `/lattice` with a scope in the URL (`?series={id}`, `?series=none`, or `?collection={id}`) that differs from the remembered scope SHALL replace the remembered state the same way; this covers links from outside the app (`llms.txt`, bundles, shared URLs). A URL whose scope equals the remembered scope SHALL restore the remembered progress filter and scroll position, so browser back/forward to a scoped lattice returns to where the visitor was.

#### Scenario: Reader series link
- **WHEN** the lattice memory is the Harmonic Activation corridor, Complete, scrolled down, and a visitor activates "The Codices of Harmonic Activation · Part 4 of 7" in the reader
- **THEN** the lattice shows the Harmonic Activation corridor with Any progress at the top, and that becomes the remembered state

#### Scenario: Shared collection URL
- **WHEN** a visitor whose remembered scope is Everything opens `/lattice?collection={id}` from a link outside the site
- **THEN** that collection is shown with Any progress at the top

#### Scenario: Back to a scoped lattice
- **WHEN** a visitor on `/lattice?series={id}` filtered to Unread and scrolled down opens a codex and presses the browser back button
- **THEN** the corridor is shown filtered to Unread at the same scroll position

### Requirement: Reset control
While the scope is not Everything or the progress filter is not Any progress, a reset control SHALL appear immediately to the right of the filter controls. Activating it SHALL set the scope to Everything and the progress filter to Any progress, following the filter-change scroll rule. While both filters are at their defaults, the control MUST NOT be shown. The control SHALL have an accessible name.

#### Scenario: Hidden by default
- **WHEN** the lattice shows Everything and Any progress
- **THEN** no reset control is shown

#### Scenario: Reset a series and progress filter
- **WHEN** a visitor on a series corridor filtered to Unread activates the reset control
- **THEN** the lattice shows Everything with Any progress, the URL has no scope, and the reset control disappears

### Requirement: Filter changes never move the filter bar
Changing the scope, the progress filter, or using the reset control MUST NOT change the filter bar's position on screen. If the filter bar was docked at the top of the content area, the results SHALL scroll so their start is directly under the docked bar. If the filter bar was not docked, the scroll position SHALL stay unchanged. This SHALL hold for result sets of any size, including an empty result.

#### Scenario: Docked, large to small
- **WHEN** the filter bar is docked well down Everything and the visitor picks a series with few codexes
- **THEN** the filter bar stays docked in the same place and the corridor header is visible directly beneath it

#### Scenario: Docked, empty result
- **WHEN** the filter bar is docked and the visitor picks a progress filter that matches nothing
- **THEN** the filter bar stays docked and the empty message is directly beneath it

#### Scenario: Not docked
- **WHEN** the page is scrolled partway through the hero, so the filter bar is not yet docked, and the visitor changes the progress filter
- **THEN** the scroll position and the filter bar's position on screen are unchanged
