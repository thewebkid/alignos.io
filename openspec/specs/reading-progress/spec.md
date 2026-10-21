# reading-progress Specification

## Purpose

Defines what the site remembers about a visitor's reading of each codex — how far they have read and where they are — in a form that survives layout changes and can be merged with progress from another device or site.

## Requirements

### Requirement: Progress is stored as fractions of the codex
For each codex a visitor has started, the site SHALL record three values on the device: the furthest point reached, the current position, and when it was last read. Furthest point and current position SHALL be fractions from 0 to 1 of the codex's scrollable length. The site MUST NOT persist a pixel offset as the resume position.

#### Scenario: Reading forward
- **WHEN** a visitor scrolls a codex to 40% of its length
- **THEN** its furthest point and current position are both recorded as 0.4

#### Scenario: Scrolling back
- **WHEN** a visitor who reached 0.6 scrolls back to 0.2
- **THEN** the furthest point stays 0.6 and the current position becomes 0.2

### Requirement: Completion is 95% of the furthest point
A codex SHALL count as complete when its furthest point is 0.95 or more. Progress shown in the lattice, cards, and stats SHALL be derived from the furthest point.

#### Scenario: Reaching the end
- **WHEN** a visitor's furthest point in a codex reaches 0.95
- **THEN** the codex is shown as complete everywhere progress is shown

### Requirement: A visitor can mark a codex read or unread by hand
The reader SHALL offer Mark as Read and Mark as Unread. Mark as Read SHALL set that codex's furthest point to 1 without changing its saved resume position (or to position 1 if it had none). Mark as Unread SHALL remove that codex's progress so it counts as not started. After Mark as Unread on the open codex, the site MUST NOT write scroll-based progress for that visit, so remaining at the bottom of a skimmed codex does not immediately mark it complete again. Tracking SHALL resume the next time the codex is opened.

#### Scenario: Mark as Read without finishing the scroll
- **WHEN** a visitor whose furthest point is 0.3 chooses Mark as Read
- **THEN** the codex is complete with furthest point 1 and its resume position stays 0.3

#### Scenario: Mark as Unread after a skim
- **WHEN** a visitor who reached 0.95 chooses Mark as Unread while still on the page
- **THEN** the codex is not started, and further scrolling on that visit does not recreate progress

#### Scenario: Mark as Read on an unopened codex
- **WHEN** a visitor opens a never-started codex and chooses Mark as Read
- **THEN** the codex is complete with furthest point 1 and position 1

### Requirement: Resume is independent of layout
A codex being resumed (per the resume rules in scroll-restoration) SHALL open at its saved current position, computed against the codex's scrollable length at the moment of restoring. The resumed point SHALL correspond to the same place in the text regardless of window size, orientation, text scale, or reading font, to within the reflow that layout itself causes.

#### Scenario: Text scale changed
- **WHEN** a visitor leaves a codex halfway through, raises the text scale, and opens it again
- **THEN** it opens halfway through the codex, not at the old pixel offset

#### Scenario: Different window size
- **WHEN** a visitor leaves a codex at 0.3 in a wide window and reopens it in a narrow one
- **THEN** it opens at 0.3 of the codex's length in the narrow window

### Requirement: Older saved progress is normalized
Saved progress in the earlier shape (an integer percent with a pixel position) SHALL be read without loss of the furthest point. The percent SHALL become the furthest point divided by 100. Because a pixel position cannot be converted, the current position SHALL be taken from the furthest point. Malformed entries SHALL be dropped, not crash the site.

#### Scenario: Earlier-shape entry
- **WHEN** stored progress for a codex is `{ scrollPercent: 62, scrollPosition: 14000, lastRead: … }`
- **THEN** the codex reads as furthest point 0.62 and current position 0.62, with the same last-read time

#### Scenario: Corrupt entry
- **WHEN** stored progress for a codex has a non-numeric percent
- **THEN** that entry is ignored and other codices' progress still loads

### Requirement: Merging progress never loses reading
Combining incoming progress with the progress already on the device SHALL apply, per codex: the furthest point is the larger of the two; last read is the later of the two; the current position comes from whichever side was read more recently. A codex present on only one side SHALL be kept as is. Applying the same incoming progress more than once SHALL leave the result unchanged, and the order in which two incoming sets are applied SHALL NOT change the result.

#### Scenario: Incoming is further along
- **WHEN** the device has a codex at furthest 0.3 read on Monday, and incoming has it at furthest 0.8 read on Tuesday at position 0.5
- **THEN** the result is furthest 0.8, position 0.5, last read Tuesday

#### Scenario: Device is more recent but less far
- **WHEN** the device has a codex at furthest 0.4 read Wednesday at position 0.4, and incoming has furthest 0.9 read Tuesday
- **THEN** the result is furthest 0.9, position 0.4, last read Wednesday

#### Scenario: Applied twice
- **WHEN** the same incoming progress is merged twice
- **THEN** the second merge changes nothing
