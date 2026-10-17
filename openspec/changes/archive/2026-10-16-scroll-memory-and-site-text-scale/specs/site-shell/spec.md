## MODIFIED Requirements

### Requirement: Reading settings
The **Aa** control SHALL open reading settings: theme (Light, Indigo, Auto), reading font, text size, glossary underlines (Always, First two, Off), and reading pace (Unhurried, Typical, Brisk). Changes SHALL apply immediately and persist in the browser. Without a saved choice, the theme SHALL be Indigo (dark), the font Source Sans 3, glossary underlines Always, and the pace Typical (200 words per minute). Glossary terms SHALL open their definition when clicked in every glossary mode. The panel SHALL also open from the glossary popup and the codex menu.

Text size SHALL scale all text on every page (headings, body text, navigation, buttons, cards, and controls), not only codex and page prose, and no text SHALL be scaled twice. The reading font SHALL be the body font of every page: all text that is not set in the heading face SHALL use it. Headings SHALL keep the heading face (Cormorant Garamond) at their normal apparent size whatever reading font is chosen. Every reading font SHALL render body text at the same apparent size as Source Sans 3. Both settings SHALL apply before first paint.

#### Scenario: First visit
- **WHEN** a visitor with no saved settings loads any page
- **THEN** the page renders in the Indigo theme without first painting the light theme

#### Scenario: Glossary underlines after the second use
- **WHEN** the glossary setting is First two and a term appears three times in a codex
- **THEN** only the first two uses are underlined, and clicking the third opens its definition

#### Scenario: Pace changes reading times
- **WHEN** the pace is Unhurried
- **THEN** lattice reading times and the reader's minutes-left line use 150 words per minute

#### Scenario: Larger text outside the reader
- **WHEN** the text size is set to the largest option
- **THEN** the lattice hero, filter controls, codex cards, header navigation, and footer text are all larger than at the default size

#### Scenario: Prose is not scaled twice
- **WHEN** the text size is 1.25
- **THEN** codex body text is 1.25 times its default size, not about 1.56 times

#### Scenario: Font reaches the interface
- **WHEN** the reading font is Atkinson Hyperlegible
- **THEN** the navigation links, lattice filter labels, and codex card text use Atkinson Hyperlegible, and page and codex headings still use Cormorant Garamond

#### Scenario: Headings keep their size
- **WHEN** the reading font changes from Source Sans 3 to Georgia
- **THEN** heading sizes on the page do not change

#### Scenario: Saved size on reload
- **WHEN** a visitor with text size 1.25 saved loads any page
- **THEN** the first paint is already at the larger size
