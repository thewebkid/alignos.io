# Cover Overlay — Visual Design Decisions

Owner: Kimi K3 (overlay design pass). Scope: `client/src/components/CoverOverlay.vue`
and its integration into `CodexCard.vue`. No catalog/build/CDN/model changes.

## Placement rules

| Size | Surface | Title | Subtitle | Tone marker |
|---|---|---|---|---|
| `lattice` | CodexCard grid cover (mobile 2-col → ~260px desktop columns) | Bottom of cover, serif, ivory, 2-line clamp (3 lines ≥640px) | omitted (keeps small covers calm) | Bottom of cover, under the title |
| `compact` | Search-result thumbs (~48–64px wide) | omitted from the thumb — illegible at this size; title stays as real HTML in the adjacent row chrome | omitted | **On the thumb**, bottom-edge signature strip |
| `hero` | Reader cover hero | Bottom of cover, `clamp(1.5rem, 4vw + 0.5rem, 2.5rem)`, full text, balanced wrap | shown when present, ivory serif | Under the subtitle, wider hairline |

All placements are bottom-anchored over a single scrim, so one gradient serves
both text elements and the art keeps its upper two-thirds clean.

## The small-thumb tone-marker rule (the open question)

**The tone marker lives ON the thumb as a bottom-edge "signature strip":
a short warm-dark gradient with the marker in tiny (8px) italic gold serif,
single line, ellipsis-truncated. Always painted — never hover-only.**

Rationale:

- A pill/badge at 48–64px wide reads as UI chrome, not as the codex's voice;
  the italic-serif-with-hairline treatment reads as a signature on the art.
- Markers are short two-word phrases ("Stillpoint", "Devotional Precision";
  longest observed: "Interspecies Remembrance", 24 chars), so even truncated
  ("Interspeci…") the strip is recognizably a tone signature, and the full
  string rides the strip's `title` attribute.
- The strip is part of the overlay component, so any future compact surface
  (dense grids, related-codex rails) inherits the rule by passing
  `size="compact"` — no per-surface re-decision.
- The title is *not* duplicated onto compact thumbs: at 48px wide it would be
  ~6px type. Search rows already render the title as HTML beside the thumb,
  satisfying "title is real HTML" for those surfaces.

On `lattice` cards (including the mobile 2-column grid — the other small-thumb
case) the marker is full text under the title; truncation only kicks in via
ellipsis if a future marker is unusually long.

## Below-card title: dropped

With the title on the cover, the duplicate `.card-title` under the image is
removed from `CodexCard`. The card keeps, below the cover: the series badge
(when the codex belongs to a series) and, on the cover itself, the reading
progress bar. The old 60-character JS truncation went away with it — clamping
is now pure CSS (`line-clamp`), so the full title string stays in the DOM.

The title remains available as: overlay text (visible even when the image
404s, since the overlay is a sibling of the `<img>`), the image `alt`
(unchanged), and the reader's document title.

## Contrast strategy

One default treatment for the whole processed cover set; no per-codex colors:

- **Scrim:** bottom-anchored linear gradient in warm-900 (`rgb(31 27 24)`),
  0.88 alpha at the bottom edge easing to transparent at ~72% height
  (compact strip: 0.90 → transparent at 62%). Warm dark matches the site's
  warm-neutral palette instead of going pure black.
- **Type:** ivory (`#fdfcfa`, warm-50) titles with a soft warm-dark
  `text-shadow`; tone signature in gold-400 (`#e5c254`) — the theme's accent
  family — which holds contrast on the dark scrim.
- **Theme-independent on purpose:** because the overlay always paints its own
  scrim, the ivory/gold/scrim constants are fixed palette values rather than
  `--cl-*` theme variables. A dark scrim under light text is correct in both
  light and dark mode, so the overlay cannot regress when the theme flips.
  Verified against the sample set: light warm (*the-stillpoint-of-love*),
  mid teal/gold (*between-worlds*), dark teal (*framing-the-mirror*).

## Mechanics worth knowing

- `CoverOverlay` is `position: absolute; inset: 0` inside the parent's
  relative cover box; the parent owns the `<img>`. `pointer-events: none` —
  it never intercepts card-link clicks or the progress tooltip.
- Stacking: `<img>` → overlay (`z-index: 2`) → reading-progress bar
  (`z-index: 3`, raised in `CodexCard` so the green bar is not dimmed by the
  scrim).
- `ReaderView` (`size="hero"`) and `SearchView`/`SearchOverlay`
  (`size="compact"`) are intentionally not wired here — Grok passes those
  sizes when he builds those surfaces.
