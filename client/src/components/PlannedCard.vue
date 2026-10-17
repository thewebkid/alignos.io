<script setup>
// PlannedCard — a series position James has named but not yet written.
// Shown only inside a selected series corridor. Same footprint as CodexCard,
// but no cover, no link, no description: only his quoted title and subtitle.
defineProps({
  position: {
    type: Number,
    required: true
  },
  total: {
    type: Number,
    default: null
  },
  title: {
    type: String,
    required: true
  },
  subtitle: {
    type: String,
    default: null
  }
})
</script>

<template>
  <div class="planned-card" role="note" :aria-label="`${title}, not yet written`">
    <div class="planned-cover">
      <div class="planned-position">
        Part {{ position }}<template v-if="total"> of {{ total }}</template>
      </div>

      <div class="planned-text">
        <div class="planned-title">&ldquo;{{ title }}&rdquo;</div>
        <div v-if="subtitle" class="planned-subtitle">&ldquo;{{ subtitle }}&rdquo;</div>
      </div>

      <div class="planned-status">Not yet written</div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.planned-card {
  display: flex;
  flex-direction: column;
  border-radius: var(--bs-border-radius-lg);
  overflow: hidden;
  border: 1px dashed var(--cl-border);
  // Ghost of a card: a whisper of the card surface over the page ground,
  // so it sits with the cover cards but clearly isn't one (both themes).
  background: color-mix(in srgb, var(--cl-surface) 45%, transparent);
  cursor: default;
}

.planned-cover {
  aspect-ratio: 2 / 3;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 0.625rem;
  text-align: center;

  @media (min-width: 640px) {
    aspect-ratio: 3 / 4;
    padding: 0.875rem;
  }
}

// Position eyebrow — the same quiet, letterspaced cadence as metadata
// labels elsewhere (series-nav, filter counts)
.planned-position {
  font-size: 0.625rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--cl-text-muted);

  @media (min-width: 640px) {
    font-size: 0.6875rem;
  }
}

.planned-text {
  min-width: 0;
}

// Quoted title of an unwritten book — italic serif at body-text contrast,
// so it never competes with the ivory cover titles around it.
.planned-title {
  font-family: var(--bs-font-serif), serif;
  font-size-adjust: none;
  font-style: italic;
  font-weight: 500;
  font-size: 1.0625rem;
  line-height: 1.3;
  text-wrap: balance;
  color: var(--cl-text);

  @media (min-width: 640px) {
    font-size: 1.125rem;
  }
}

.planned-subtitle {
  margin-top: 0.375rem;
  font-family: var(--bs-font-serif), serif;
  font-size-adjust: none;
  font-style: italic;
  font-size: 0.8125rem;
  line-height: 1.35;
  color: var(--cl-text-muted);

  @media (min-width: 640px) {
    font-size: 0.875rem;
  }
}

// Status — the tone-marker motif (short gold hairline + small italic serif),
// centered, as the card's quiet signing-off.
.planned-status {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.375rem;
  font-family: var(--bs-font-serif), serif;
  font-size-adjust: none;
  font-style: italic;
  font-size: 0.8125rem;
  letter-spacing: 0.04em;
  color: var(--cl-text-muted);

  &::before {
    content: '';
    flex: none;
    width: 1.125rem;
    height: 1px;
    background: var(--cl-accent);
    opacity: 0.75;
  }

  @media (min-width: 640px) {
    font-size: 0.875rem;
  }
}
</style>
