<script setup>
/**
 * GlossaryPopover - Shows glossary term definitions on click
 *
 * Uses a single popover that updates based on which term is clicked.
 * Works with terms injected by GlossaryManager.injectLinks()
 */
import { ref, computed, inject, onMounted, onUnmounted, nextTick } from 'vue'
import { BPopover } from 'bootstrap-vue-next'
import {track} from '../lib/tracker.js';

const props = defineProps({
  /** CSS selector for the content container to watch */
  contentSelector: {
    type: String,
    default: '.codex-content'
  }
})

const glossaryManager = inject('glossaryManager')

// Popover state
const isVisible = ref(false)
const targetElement = ref(null)
const currentTerm = ref(null)

// Get term definition
const termData = computed(() => {
  if (!currentTerm.value || !glossaryManager) return null
  return glossaryManager.getTerm(currentTerm.value)
})

// Event delegation handler for clicks on glossary terms
const handleClick = (e) => {
  const term = e.target.closest('.glossary-term.has-definition')
  if (!term) return

  e.preventDefault()
  e.stopPropagation()

  const termKey = term.dataset.term
  if (!termKey) return

  // Toggle if clicking the same term
  if (isVisible.value && targetElement.value === term) {
    isVisible.value = false
    targetElement.value = null
    currentTerm.value = null
  } else {
    // Show popover for clicked term
    targetElement.value = term
    currentTerm.value = termKey;
    track('livingGlossary', {term: termKey})

    // Use nextTick to ensure the target is set before showing
    nextTick(() => {
      isVisible.value = true
    })
  }
}

// Close popover when clicking outside
const handleDocumentClick = (e) => {
  if (!isVisible.value) return

  const popover = document.querySelector('.glossary-popover')
  const term = e.target.closest('.glossary-term.has-definition')


  // Close if clicking outside both the popover and any glossary term
  if (!popover?.contains(e.target) && !term) {
    isVisible.value = false
    targetElement.value = null
    currentTerm.value = null
  }
}

// Setup event listeners
onMounted(() => {
  const container = document.querySelector(props.contentSelector)
  if (container) {
    container.addEventListener('click', handleClick, true)
  }
  document.addEventListener('click', handleDocumentClick)
})

onUnmounted(() => {
  const container = document.querySelector(props.contentSelector)
  if (container) {
    container.removeEventListener('click', handleClick, true)
  }
  document.removeEventListener('click', handleDocumentClick)
})
</script>

<template>
  <BPopover
    v-if="targetElement && termData"
    :target="targetElement"
    v-model="isVisible"
    placement="top"
    class="glossary-popover"
    :delay="{ show: 0, hide: 0 }"
    manual
  >
    <template #title>
      <span class="glossary-popover-title">{{ termData.term }}</span>
    </template>

    <div class="glossary-popover-content">
      <p class="glossary-essence">{{ termData.essence }}</p>

      <div v-if="termData.fieldDesire" class="glossary-field-desire">
        <em class="field-desire-label">The Field's desire to be known:</em>
        <p>{{ termData.fieldDesire }}</p>
      </div>

      <div v-if="termData.relatedTerms?.length" class="glossary-related">
        <span class="related-label">Related:</span>
        <span class="related-terms">{{ termData.relatedTerms.join(', ') }}</span>
      </div>
    </div>
  </BPopover>
</template>

<style lang="scss">
// Popover styling (not scoped to affect the global popover)
// Using !important to override Bootstrap inline styles
.popover.glossary-popover,
.glossary-popover.popover {
  // Responsive width handling
  // Mobile: limit to viewport width with padding
  max-width: calc(100vw - 2rem) !important;
  min-width: 280px !important;
  width: max-content !important;
  border: 1px solid var(--cl-border) !important;
  box-shadow: 0 4px 24px var(--cl-shadow-lg) !important;
  background: var(--cl-surface) !important;
  border-radius: 0.5rem !important;
  color: var(--cl-text) !important;

  // Desktop: wider popovers for verbose definitions
  @media (min-width: 768px) {
    max-width: 450px !important;
    min-width: 350px !important;
  }

  .popover-header {
    background: var(--cl-bg-elevated) !important;
    border-bottom: 1px solid var(--cl-border-light) !important;
    padding: 0.75rem 1rem;
    border-radius: 0.5rem 0.5rem 0 0;
    color: var(--cl-text-heading) !important;
  }

  .popover-body {
    padding: 1rem 1.25rem;
    background: var(--cl-surface) !important;
    color: var(--cl-text) !important;
    max-height: 300px;
    overflow-y: auto;
  }

  // Arrow positioning for top placement
  &.bs-popover-top,
  &[data-popper-placement^="top"] {
    .popover-arrow::before {
      border-top-color: var(--cl-border) !important;
    }

    .popover-arrow::after {
      border-top-color: var(--cl-surface) !important;
    }
  }

  // Arrow positioning for bottom placement
  &.bs-popover-bottom,
  &[data-popper-placement^="bottom"] {
    .popover-arrow::before {
      border-bottom-color: var(--cl-border) !important;
    }

    .popover-arrow::after {
      border-bottom-color: var(--cl-surface) !important;
    }
  }

  // Arrow positioning for left placement
  &.bs-popover-start,
  &[data-popper-placement^="left"] {
    .popover-arrow::before {
      border-left-color: var(--cl-border) !important;
    }

    .popover-arrow::after {
      border-left-color: var(--cl-surface) !important;
    }
  }

  // Arrow positioning for right placement
  &.bs-popover-end,
  &[data-popper-placement^="right"] {
    .popover-arrow::before {
      border-right-color: var(--cl-border) !important;
    }

    .popover-arrow::after {
      border-right-color: var(--cl-surface) !important;
    }
  }
}

.glossary-popover-title {
  font-family: var(--bs-font-serif);
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--cl-text-heading);
}

.glossary-popover-content {
  font-size: 0.9rem;
  line-height: 1.6;
  color: var(--cl-text);
}

.glossary-essence {
  margin: 0 0 0.75rem 0;

  &:last-child {
    margin-bottom: 0;
  }
}

.glossary-field-desire {
  margin-top: 0.75rem;
  padding-top: 0.75rem;
  border-top: 1px solid var(--cl-border-light);

  .field-desire-label {
    display: block;
    font-size: 0.8rem;
    color: var(--cl-accent);
    margin-bottom: 0.25rem;
  }

  p {
    margin: 0;
    font-style: italic;
    color: var(--cl-text-muted);
  }
}

.glossary-related {
  margin-top: 0.75rem;
  font-size: 0.85rem;

  .related-label {
    font-weight: 600;
    color: var(--cl-text-muted);
    margin-right: 0.25rem;
  }

  .related-terms {
    color: var(--cl-primary);
  }
}
</style>
