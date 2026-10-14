<script setup>
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import { useReadingProgressStore } from '../stores/readingProgress.js'
import { BTooltip } from 'bootstrap-vue-next'
import { cdnUrl } from '../lib/cdn-config.js'
import CoverOverlay from './CoverOverlay.vue'

const props = defineProps({
  codex: {
    type: Object,
    required: true
  },
  tip: {
    type: String,
    default: null
  }
})

const progressStore = useReadingProgressStore()

const scrollPercent = computed(() => {
  return progressStore.getScrollPercent(props.codex.id)
})

const isComplete = computed(() => scrollPercent.value >= 95)
const isStarted = computed(() => scrollPercent.value > 0)

// Build cover image path from CDN
const coverSrc = computed(() => {
  if (props.codex.coverThumb) return cdnUrl.thumb(props.codex.coverThumb)
  if (props.codex.coverImage) return cdnUrl.cover(props.codex.coverImage)
  return null
})

// Series label — "Name · Part X of Y" when positions are known, else just the name
const seriesLabel = computed(() => {
  const s = props.codex.series
  if (!s?.name) return null
  if (s.position && s.total) return `${s.name} · Part ${s.position} of ${s.total}`
  return s.name
})


</script>

<template>
  <div class="codex-card-shell">
    <BTooltip placement="bottom" custom-class="codex-progress-tip">
      <template #target>
        <RouterLink
          :to="{ name: 'reader', params: { id: codex.id } }"
          class="codex-card"
          :class="{
            'is-complete': isComplete,
            'is-started': isStarted && !isComplete,
            'is-unread': !isStarted
          }"
        >
          <div class="card-cover">
            <img
              v-if="coverSrc"
              :src="coverSrc"
              :alt="codex.title"
              loading="lazy"
              class="cover-image"
            />

            <div v-else class="cover-placeholder">
              <span>{{ codex.title.charAt(0) }}</span>
            </div>

            <CoverOverlay
              :title="codex.title"
              :tone-marker="codex.toneMarker"
              :series-label="seriesLabel"
              size="lattice"
            />

            <div class="progress-bar-container" v-if="isStarted">
              <div class="progress-bar" :style="{ width: scrollPercent + '%' }"></div>
            </div>
          </div>
        </RouterLink>
      </template>
      <div v-if="tip">{{tip.split('|')[0]}}<br/>{{tip.split('|')[1]}}</div>
      <div v-else>
        Not started
      </div>
      <em>~{{codex.readingTime}} minute read</em>
    </BTooltip>
  </div>
</template>

<style lang="scss" scoped>
.codex-card-shell {
  display: contents;
}

.codex-card {
  display: flex;
  flex-direction: column;
  background: var(--cl-surface);
  border-radius: var(--bs-border-radius-lg);
  overflow: hidden;
  text-decoration: none;
  color: inherit;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  box-shadow: 0 2px 8px var(--cl-shadow);

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 24px var(--cl-shadow-lg);
  }

  &.is-unread {
    opacity: var(--cl-card-unread-opacity);

    &:hover {
      opacity: 1;
    }
  }
}

.card-cover {
  position: relative;
  aspect-ratio: 2 / 3;
  overflow: hidden;
  background: var(--cl-surface-hover);

  @media (min-width: 640px) {
    aspect-ratio: 3 / 4;
  }
}

.cover-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s ease;

  .codex-card:hover & {
    transform: scale(1.03);
  }
}

.cover-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, var(--cl-primary), var(--cl-accent));
  color: white;
  font-family: var(--bs-font-serif),serif;
  font-size: 3rem;
  font-weight: 500;
}

.progress-bar-container {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: transparent;
  z-index: 3; // above the CoverOverlay scrim
}

.progress-bar {
  height: 100%;
  background: #10b981;
  transition: width 0.3s ease;
}
</style>

<style lang="scss">
// Global styles for tooltip (not scoped because tip is rendered outside component)
.codex-progress-tip {
  --bs-popover-bg: var(--cl-surface) !important;
  --bs-popover-border-color: var(--cl-border) !important;
  --bs-popover-body-color: var(--cl-text) !important;

  border: 1px solid var(--cl-border) !important;
  box-shadow: 0 4px 12px var(--cl-shadow-lg) !important;
  background-color: var(--cl-surface) !important;
  border-radius: 0.5rem !important;
  max-width: 300px !important;

  // Hide the header if it's showing
  .popover-header {
    display: none !important;
  }

  .popover-body {
    padding: 0.5rem 0.75rem !important;
    background-color: var(--cl-surface) !important;
    color: var(--cl-text) !important;
    font-size: 0.875rem !important;
    border-radius: 0.5rem !important;
    line-height: 1.5 !important;
    &:before{content:''}
  }

  // Arrow positioning for top placement
  &.bs-popover-top,
  &[data-popper-placement^="top"] {
    > .popover-arrow {
      &::before {
        border-top-color: var(--cl-border) !important;
      }

      &::after {
        border-top-color: var(--cl-surface) !important;
      }
    }
  }

  // Arrow positioning for bottom placement
  &.bs-popover-bottom,
  &[data-popper-placement^="bottom"] {
    > .popover-arrow {
      &::before {
        border-bottom-color: var(--cl-border) !important;
      }

      &::after {
        border-bottom-color: var(--cl-surface) !important;
      }
    }
  }

  // Arrow positioning for left placement
  &.bs-popover-start,
  &[data-popper-placement^="left"] {
    > .popover-arrow {
      &::before {
        border-left-color: var(--cl-border) !important;
      }

      &::after {
        border-left-color: var(--cl-surface) !important;
      }
    }
  }

  // Arrow positioning for right placement
  &.bs-popover-end,
  &[data-popper-placement^="right"] {
    > .popover-arrow {
      &::before {
        border-right-color: var(--cl-border) !important;
      }

      &::after {
        border-right-color: var(--cl-surface) !important;
      }
    }
  }
}
</style>
