## Purpose

Lets a visitor carry their reading progress to alignos.io as a single link — from the legacy reader site at `alignos.cosmiccreation.net`, or from one of their own devices to another — without accounts, files, or any server storing their data.

## ADDED Requirements

### Requirement: Handoff link
A handoff SHALL be a link to `https://alignos.io/import` whose URL fragment carries a versioned handoff document. The document SHALL identify itself as Alignos progress, state its format version, its source (`reader` or `alignos.io`), the lattice it was written against, when it was exported, the per-codex progress, an optional theme, and an optional return path. The progress and theme MUST travel only in the fragment, never in the path or query, so they are not sent to any server. The link SHALL use a compressed encoding where the browser supports it and an uncompressed encoding otherwise; `/import` SHALL accept both.

#### Scenario: Data stays in the browser
- **WHEN** a visitor follows a handoff link
- **THEN** the request sent to alignos.io contains only the path `/import`, with no progress data

#### Scenario: Browser without compression support
- **WHEN** a handoff link is created in a browser that lacks built-in compression
- **THEN** it uses the uncompressed encoding, and `/import` reads it the same way

#### Scenario: Unknown format version
- **WHEN** `/import` receives a document whose format version it does not know
- **THEN** it changes nothing and tells the visitor the link could not be read

### Requirement: Retired codex IDs resolve
Every codex ID in an incoming document SHALL be resolved to a current codex ID before merging. A current ID SHALL resolve to itself. A retired ID SHALL resolve through the recorded ID changes in codex provenance, following successive changes to the current ID. An ID that resolves to no current codex SHALL be skipped and counted, not stored. The lattice build SHALL fail if a retired ID is also a current ID, or if a recorded ID change leads to no current codex.

#### Scenario: Reader ID with a trailing number
- **WHEN** an incoming document has progress for `the-codex-of-the-interbeing-lattice-42`
- **THEN** it is merged as progress for `the-codex-of-the-interbeing-lattice`

#### Scenario: Unchanged ID
- **WHEN** an incoming document has progress for a codex whose ID never changed
- **THEN** it is merged under that same ID

#### Scenario: Unknown ID
- **WHEN** an incoming document has progress for an ID that matches no codex, current or retired
- **THEN** that entry is skipped and the other entries still merge

#### Scenario: Retired ID reused
- **WHEN** a codex is given an ID that provenance records as retired
- **THEN** the lattice build fails and names the ID

### Requirement: Arrival applies the handoff
On arriving at `/import` with a readable document, the site SHALL merge its progress into the device's progress using the reading-progress merge rule, without asking first. An incoming theme SHALL be applied only if the device has no theme saved. The site SHALL remove the fragment from the address bar before any page view is recorded for analytics, so that reloading or sharing the resulting URL carries no data. The incoming document SHALL be validated: percentages and positions outside 0–1 SHALL be clamped, and entries with unreadable dates or values SHALL be skipped.

#### Scenario: First arrival from the reader
- **WHEN** a visitor with no progress on alignos.io follows a reader handoff link carrying 37 codices
- **THEN** all 37 codices show their progress on alignos.io

#### Scenario: Theme already chosen here
- **WHEN** the device already has a saved theme and the incoming document carries a different one
- **THEN** the device keeps its own theme

#### Scenario: Reload after arrival
- **WHEN** a visitor reloads the page after arriving through a handoff link
- **THEN** the address bar shows no fragment and nothing is merged again

#### Scenario: Out-of-range values
- **WHEN** an incoming entry claims a furthest point of 4.2
- **THEN** it is stored as 1

### Requirement: Welcome summary and return
After merging a document with any progress, `/import` SHALL show a short summary: how many codices are complete, how many are in progress, and the title of the most recently read codex. Its primary action SHALL take the visitor to the document's return path, with retired codex paths resolved to their current paths and the reader's home mapped to the lattice. A return path that is missing, unrecognized, or not a same-site path SHALL fall back to the lattice. A document with no progress SHALL skip the summary and go straight to the return path.

#### Scenario: Continue where they were
- **WHEN** a visitor who tapped the handoff while on the reader's `/codex/the-codex-of-listening-121` chooses "Continue reading"
- **THEN** they arrive at `/codex/the-codex-of-listening` at their saved position

#### Scenario: Reader home
- **WHEN** the handoff was made from the reader's home page
- **THEN** "Continue reading" goes to `/lattice`

#### Scenario: No progress to carry
- **WHEN** a reader visitor with no progress follows the handoff from `/search`
- **THEN** they land on alignos.io `/search` with no summary shown

#### Scenario: Foreign return path
- **WHEN** a document's return path is `//example.com/x`
- **THEN** "Continue reading" goes to `/lattice`

### Requirement: Unreadable or missing handoff
If `/import` is opened without a fragment, it SHALL offer a box where the visitor can paste a handoff link, and applying a pasted link SHALL behave exactly as following it. If the fragment or a pasted link cannot be read, the site SHALL change nothing, say so plainly, and offer a way to the lattice.

#### Scenario: Pasted link
- **WHEN** a visitor opens `/import` directly and pastes a handoff link copied on another device
- **THEN** its progress is merged and the welcome summary is shown

#### Scenario: Damaged link
- **WHEN** a handoff link was truncated in transit
- **THEN** `/import` reports that the link could not be read and the device's progress is unchanged

### Requirement: Carry my reading
The reading settings panel SHALL offer "Carry my reading", which opens a dialog that produces a handoff link with source `alignos.io`, holding all of the device's progress, its saved theme if any, and the current page as the return path. The dialog SHALL say how many codices the link carries and SHALL offer: the system share sheet where the browser provides one, copying the link, and a QR code of the link when the link is short enough to scan reliably from a screen. When it is too long, the dialog SHALL say so in place of the code and point to share or copy. With no progress on the device, the dialog SHALL say there is nothing to carry yet and offer no link.

#### Scenario: Phone to laptop
- **WHEN** a visitor on a phone chooses "Carry my reading" and shares the link to themselves, then opens it on a laptop
- **THEN** the laptop shows the phone's progress merged with its own

#### Scenario: Laptop to phone
- **WHEN** a visitor scans the dialog's QR code with a phone camera
- **THEN** the phone opens the handoff link on alignos.io and merges the progress

#### Scenario: Too much for a QR code
- **WHEN** a visitor with progress in nearly every codex opens "Carry my reading"
- **THEN** the dialog explains the link is too long for a code and offers share and copy

#### Scenario: Nothing yet
- **WHEN** a visitor who has never opened a codex chooses "Carry my reading"
- **THEN** the dialog says there is nothing to carry yet and shows no link or QR code

### Requirement: Legacy reader hands off
The legacy reader site SHALL link only to its configured alignos.io origin, which SHALL be `https://alignos.io` in every build except local development. Every handoff link it creates SHALL hold all of the visitor's current progress, their saved theme if any, and the path they are on. It SHALL operate in one of three modes, chosen by deployment configuration:
- **off:** no handoff UI.
- **prompt:** on the first visit, a dialog that names how many codices the visitor has read and completed (or, with no progress, simply says Alignos has a new home) and offers to take their reading to alignos.io or decline. On later visits, a banner above the content offers the same handoff and can be closed for the rest of the session. The reader stays fully usable throughout.
- **forward:** every visit immediately follows a handoff link for the current page.

The reader site MUST NOT be replaced by a server-side redirect, since that would leave visitors' progress unreachable.

#### Scenario: First visit in prompt mode
- **WHEN** a visitor who has read 37 codices, 12 to the end, opens the reader after the prompt deploy
- **THEN** a dialog names those counts and offers to take their reading to alignos.io

#### Scenario: Declined, then returned
- **WHEN** that visitor declines the dialog and comes back the next day
- **THEN** no dialog appears, a banner offers the handoff, and closing it hides it until the next session

#### Scenario: Carry later, after reading more
- **WHEN** a visitor hands off, keeps reading on the reader, then hands off again
- **THEN** alignos.io ends up with the combined progress and nothing is lowered

#### Scenario: Forward mode
- **WHEN** forward mode is on and a visitor opens the reader's `/codex/bridge-between-chords-63`
- **THEN** they arrive at alignos.io `/codex/bridge-between-chords` with their progress merged

#### Scenario: Local development
- **WHEN** the reader runs in local development
- **THEN** its handoff links point at the local alignos.io dev server
