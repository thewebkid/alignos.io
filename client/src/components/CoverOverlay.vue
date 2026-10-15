<script setup>
// CoverOverlay — HTML title + tone-marker overlay for text-free cover art.
//
// Absolutely positioned to fill its (position: relative) parent; the parent
// owns the <img>. The overlay paints its own warm-dark scrim, so contrast is
// guaranteed on light AND dark covers without per-codex color hints, and the
// treatment is constant across light/dark theme modes.
//
// Sizes:
//   lattice — CodexCard grid cover: title (serif, clamped) rides the top;
//             tone signature + optional series line anchor the bottom
//   compact — tiny search thumbs: tone signature only (title lives in row chrome)
//   hero    — reader cover: full title + subtitle + tone signature
defineProps({
  title: {
    type: String,
    required: true
  },
  subtitle: {
    type: String,
    default: null
  },
  toneMarker: {
    type: String,
    default: null
  },
  seriesLabel: {
    type: String,
    default: null
  },
  editionLabel: {
    type: String,
    default: null
  },
  size: {
    type: String,
    default: 'lattice',
    validator: (v) => ['lattice', 'compact', 'hero'].includes(v)
  }
})
</script>

<template>
  <div class="cover-overlay" :class="`cover-overlay--${size}`">
    <!-- Title block — lattice & hero. Compact thumbs are too small for
         legible title type; the title rides beside them as row chrome. -->
    <div v-if="size !== 'compact'" class="overlay-text">
      <div class="overlay-title">{{ title }}</div>
      <div v-if="subtitle && size === 'hero'" class="overlay-subtitle">{{ subtitle }}</div>
    </div>

    <!-- Bottom stack — tone signature, then the series line (lattice only),
         which nudges the tone marker up off the bottom edge -->
    <div class="overlay-foot">
      <!-- Tone signature — rendered at EVERY size, never hover-only -->
      <div v-if="toneMarker" class="tone-marker" :title="toneMarker">
        <span class="tone-marker-rule" aria-hidden="true"></span>
        <span class="tone-marker-text">{{ toneMarker }}</span>
      </div>

      <div v-if="size === 'lattice' && seriesLabel" class="series-line" :title="seriesLabel">
        {{ seriesLabel }}
      </div>

      <div v-if="size === 'lattice' && editionLabel" class="series-line edition-line">
        {{ editionLabel }}
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.cover-overlay {
  // Palette anchors (values from assets/scss/_variables.scss):
  //   ivory  = $warm-50  (#fdfcfa) — title text
  //   gold   = $gold-400 (#e5c254) — tone signature, reads on dark scrim in both themes
  //   scrim  = $warm-900 (31,27,24) — warm dark, matches the site's warm neutrals
  --cov-ivory: #fdfcfa;
  --cov-gold: #e5c254;
  --cov-scrim: 31, 27, 24;

  position: absolute;
  inset: 0;
  z-index: 2; // above the <img>; CodexCard's progress bar sits at z-index 3
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  pointer-events: none; // never intercept card-link clicks or hover tooltips
  text-align: left;
}

.overlay-text {
  min-width: 0;
}

.overlay-title {
  font-family: var(--bs-font-serif), serif;
  font-weight: 500;
  color: var(--cov-ivory);
  text-shadow: 0 1px 6px rgba(var(--cov-scrim), 0.55);
  margin: 0;
}

// Tone marker — an atmospheric signature, not a badge: a short gold hairline
// followed by small italic serif. Always rendered when toneMarker exists.
.tone-marker {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  min-width: 0;
}

.tone-marker-rule {
  flex: none;
  width: 1.125rem;
  height: 1px;
  background: var(--cov-gold);
  opacity: 0.75;
}

.tone-marker-text {
  font-family: var(--bs-font-serif), serif;
  font-style: italic;
  letter-spacing: 0.05em;
  color: var(--cov-gold);
  text-shadow: 0 1px 4px rgba(var(--cov-scrim), 0.5);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  min-width: 0;
}

// Series line — quiet metadata tucked under the tone signature (lattice only).
// No chip or background: just small ivory sans on the scrim. Long labels
// ("… · Part n of N") wrap to a second line so the part suffix is never
// clipped away; the full label also rides the element's title attribute.
.series-line {
  margin-top: 0.25rem;
  letter-spacing: 0.04em;
  color: var(--cov-ivory);
  opacity: 0.85;
  text-shadow: 0 1px 4px rgba(var(--cov-scrim), 0.5);
  line-height: 1.35;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

// Earlier-edition marker — a quiet echo of the tone signature: small gold
// italic serif, distinct from the ivory series line without needing a chip.
.edition-line {
  font-family: var(--bs-font-serif), serif;
  font-style: italic;
  letter-spacing: 0.05em;
  color: var(--cov-gold);
  opacity: 0.9;
}

// -----------------------------------------------------------------------------
// lattice — CodexCard grid cover (mobile 2-col up to ~260px desktop columns)
// -----------------------------------------------------------------------------
.cover-overlay--lattice {
  justify-content: space-between; // title rides the top; tone + series anchor the bottom
  padding: 0.625rem;
  background:
    // faint top scrim — keeps the ivory title legible over bright cover art
    linear-gradient(
      to bottom,
      rgba(var(--cov-scrim), 0.52) 0%,
      rgba(var(--cov-scrim), 0.22) 24%,
      transparent 46%
    ),
    linear-gradient(
      to top,
      rgba(var(--cov-scrim), 0.88) 0%,
      rgba(var(--cov-scrim), 0.52) 34%,
      rgba(var(--cov-scrim), 0.16) 58%,
      transparent 75%
    );

  .overlay-title {
    font-size: 1.3rem;
    line-height: 1.25;
    text-shadow: 0 0 1px black;
    display: -webkit-box;
    -webkit-line-clamp: 3;
    -webkit-box-orient: vertical;
    overflow: hidden;
    text-align: center;
  }

  .tone-marker {
    margin-top: 0.3rem;
  }

  .tone-marker-text {
    font-size: 0.95rem;
  }

  .series-line {
    font-size: 0.625rem;
  }

  @media (min-width: 640px) {
    padding: 0.875rem;

    .overlay-title {
      font-size: 1.4rem;
    }

    .tone-marker-text {
      font-size: 0.95rem;
    }

    .series-line {
      font-size: 0.6875rem;
    }
  }
}

// -----------------------------------------------------------------------------
// compact — small thumbs (search results, dense grids; ~48–64px wide).
// THE small-thumb rule: the tone marker stays on the thumb as a bottom-edge
// signature strip — always painted, single line, ellipsis-truncated. The full
// marker is on the strip's title attribute; the catalog title lives in the
// adjacent row chrome, so it is not duplicated at illegible sizes.
// -----------------------------------------------------------------------------
.cover-overlay--compact {
  padding: 0.125rem 0.25rem 0.1875rem;
  background: linear-gradient(
    to top,
    rgba(var(--cov-scrim), 0.9) 0%,
    rgba(var(--cov-scrim), 0.5) 42%,
    transparent 62%
  );

  .tone-marker {
    margin-top: 0;
    gap: 0;
  }

  .tone-marker-rule {
    display: none; // no room for the flourish at 48px wide
  }

  .tone-marker-text {
    font-size: 0.95rem;
    letter-spacing: 0.03em;
  }
}

// -----------------------------------------------------------------------------
// hero — reader cover hero: full title, optional subtitle, tone signature
// -----------------------------------------------------------------------------
.cover-overlay--hero {
  padding: 1.5rem;
  background: linear-gradient(
    to top,
    rgba(var(--cov-scrim), 0.9) 0%,
    rgba(var(--cov-scrim), 0.55) 32%,
    rgba(var(--cov-scrim), 0.18) 55%,
    transparent 72%
  );

  .overlay-title {
    font-size: clamp(1.5rem, 4vw + 0.5rem, 2.5rem);
    line-height: 1.15;
    text-wrap: balance;
  }

  .overlay-subtitle {
    margin-top: 0.375rem;
    font-family: var(--bs-font-serif), serif;
    font-size: 1.0625rem;
    line-height: 1.35;
    color: var(--cov-ivory);
    opacity: 0.88;
    text-shadow: 0 1px 6px rgba(var(--cov-scrim), 0.55);
  }

  .tone-marker {
    margin-top: 0.625rem;
  }

  .tone-marker-rule {
    width: 1.75rem;
  }

  .tone-marker-text {
    font-size: 0.95rem;
    letter-spacing: 0.08em;
  }

  @media (min-width: 768px) {
    padding: 2.25rem;

    .overlay-subtitle {
      font-size: 1.1875rem;
    }
  }
}
</style>
