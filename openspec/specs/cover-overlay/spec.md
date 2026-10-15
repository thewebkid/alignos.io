# cover-overlay Specification

## Purpose
Replaces baked-in cover typography with HTML/CSS overlays so text-free cover art can show catalog titles and tone markers at every card size, including small thumbnails.
## Requirements
### Requirement: Titles are HTML, not pixels
Wherever a cover or thumbnail is shown as a card or hero, the catalog title SHALL be rendered as real HTML text over (or immediately associated with) the image. The image itself MUST remain text-free art. Screen readers MUST receive the title via the overlay text and/or the image `alt` text.

#### Scenario: Title remains if the image fails
- **WHEN** a cover image 404s or is slow to load
- **THEN** the catalog title is still visible as HTML

#### Scenario: Title is not only in the bitmap
- **WHEN** a user inspects a lattice card
- **THEN** the title exists in the DOM as text, not solely as pixels inside the JPEG

### Requirement: Tone markers are present at every card size
Every cover/thumbnail surface SHALL expose the catalog `toneMarker` to the user. Placement, truncation, and whether the marker sits on the image, on a scrim, beside the title, or in chrome around a small thumb is a visual design decision — but the marker MUST NOT be omitted on small thumbnails.

#### Scenario: Small thumbnail still shows a tone marker
- **WHEN** a compact thumbnail is rendered (search result, dense grid, or a card narrower than the default lattice column)
- **THEN** the tone marker is visible in the UI without opening the reader

#### Scenario: Reader hero shows title and tone marker
- **WHEN** the reader view displays the cover
- **THEN** both the catalog title and tone marker are visible as HTML associated with the cover

### Requirement: Overlay remains readable
Overlay text SHALL maintain readable contrast against the cover art (via scrim, gradient, type color, or equivalent). Optional per-codex color hints MAY exist later; until then the overlay system MUST use a default treatment that works across the processed cover set.

#### Scenario: Light text on a light cover is still readable
- **WHEN** a cover is predominantly light
- **THEN** the overlay title remains readable without requiring a per-codex color override

### Requirement: Duplicate chrome is not required below the card
If the overlay already presents the title on the image, the card SHALL be allowed to omit a second identical title below the image, provided the title remains available as HTML. Series name, reading time, and progress MAY remain in card chrome. This layout choice is owned by the overlay design pass.

#### Scenario: Title appears once at the chosen location
- **WHEN** the overlay design places the title on the cover image
- **THEN** the card does not also require a redundant second title string in the same visual cluster unless the design pass explicitly keeps both for small sizes

