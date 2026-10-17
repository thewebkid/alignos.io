# James site feedback

Response to James's walkthrough before launch. This is a plan, not an OpenSpec change. His items 2, 4, 5, 6, 10, 11, 12, and 13 are praise and need no code.

Until the DNS flip, pushes to main show on the regular Vercel URL, and James reviews there. Pass 1 is the launch gate he asked for (item 7, the font). Pass 2 can land before or after DNS.

## Pass 1: launch gate

- [x] Reading font. One token, `--cl-font-reading`, set to the Source Sans 3 stack in [client/src/assets/scss/main.scss](../client/src/assets/scss/main.scss). Codex text, threshold-page prose and blockquotes in [PageView.vue](../client/src/views/PageView.vue), the Return Room prompt in [PromptBlock.vue](../client/src/components/PromptBlock.vue), collection taglines, the footer quote, and the home spotlight quote, interstitials, and closing lines use it. Headings stay Cormorant Garamond. `index.html` loads Source Sans 3 once.
- [x] Indigo dark is the default (item 1). [useTheme.js](../client/src/composables/useTheme.js) falls back to `dark` when nothing is stored. An inline script in [index.html](../client/index.html) sets the theme before CSS, so a first visit does not flash light. A saved preference still wins.
- [x] Pages open at the top (item 8). The router transition's `after-leave` in [App.vue](../client/src/App.vue) sets `.main-content` to `scrollTop = 0`. It runs after the old view unmounts, so the lattice and the reader save their positions first and restore them afterwards.

## Pass 2: reading settings

- [x] Store. [client/src/stores/readingSettings.js](../client/src/stores/readingSettings.js) holds `font`, `scale`, `glossary`, and `pace` in `localStorage` (`alignos-reading`) and writes `data-glossary`, `--cl-font-reading`, and `--cl-reading-scale` on `<html>`. It also saves the resolved font stack and stylesheet URL, which the first-paint script applies. Theme stays in `useTheme`. Settings are per device and browser.
- [x] Panel. [ReadingSettings.vue](../client/src/components/ReadingSettings.vue) opens under an Aa button in the header, which replaces the theme toggle, and as a bottom sheet below `lg`. The glossary popup and the codex menu open it too. It is a popover rather than a modal, so the text behind it reflows live. Rows: theme, font, size, glossary, pace, and a progress summary with a reset that asks first.
- [x] Glossary modes (item 9). `injectLinks` numbers each use of a term (`data-use`), and an alias continues its term's count. Always, First two, and Off are CSS on `data-glossary`. Hover still shows the underline, and clicking opens the popup in every mode. The default is Always.
- [x] Fonts. Source Sans 3 (default), Georgia, Cormorant Garamond, Atkinson Hyperlegible Next, and Encode Sans, for reading text only. Atkinson and Encode load on demand, and the picker previews them with an `Aa`-only subset. `font-size-adjust` evens out their apparent size against Source Sans 3.
- [x] Pace (item 4). Unhurried 150, Typical 200, Brisk 275 words per minute. Lattice card times follow it, and the reader header shows the minutes left. The build-time `readingTime` stays for the catalog.

## Pass 2: lattice filters

- [x] The progress chips and the native select (both said "All", item 3) are now a scope dropdown and a progress dropdown with a filter icon, plus an "n of m" count.
- [x] Continue reading shelf: codices in progress, most recent first, shown only with Everything and Any progress, and hidden when empty.
- [x] One `.cl-dropdown` menu style shared by Return Rooms, both lattice dropdowns, and the codex menu (item 6).

## Found along the way

- [x] The glossary entry regex ended in `\Z`, which JavaScript reads as a literal "Z", so the last entry was dropped. "Relational Constellation of the Return Room" now has a definition (37 terms, up from 35). The parser also normalizes CRLF line endings, so a Windows checkout parses like Vercel.
- [x] The same end-of-file bug was in [client/scripts/build-lattice.js](../client/scripts/build-lattice.js). JavaScript has no `\Z`, so a section that closed a codex was skipped. In this corpus that was the registry: 4 codices had one, and 44 do now. Stillpoints, field notes, interludes, whispers, and seals were already being kept, because none of them close a file. A unit test covers a section at the end of a file, including Windows line endings, and the Living Glossary's registry.

## Spec and tests

- [x] [openspec/specs/site-shell/spec.md](../openspec/specs/site-shell/spec.md) names the Aa control and adds a reading-settings requirement.
- [x] Unit tests for glossary use counts, the last-entry fix, and the settings store. The Playwright journeys pass unchanged.

## Open

- Whether Cormorant is comfortable as reading text on a 13" laptop, even with size adjustment.
- Which width of Encode Sans to use. Only the normal width is used today, though the full width range loads.
- Encode Sans has no italic, so italic passages in it are slanted by the browser.
