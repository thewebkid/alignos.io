<script setup>
// PromptBlock — one of James' prompts for use with an AI. The text is the exact
// clipboard payload; the quotation marks are presentation only.
import { ref, onMounted } from 'vue'
import { track } from '../lib/tracker.js'

const props = defineProps({
  text: {
    type: String,
    required: true
  }
})

const canCopy = ref(false)
const copied = ref(false)

onMounted(() => {
  canCopy.value = typeof navigator !== 'undefined' && Boolean(navigator.clipboard?.writeText)
})

const copy = async () => {
  try {
    await navigator.clipboard.writeText(props.text)
    copied.value = true
    setTimeout(() => { copied.value = false }, 2000)
    track('copyPrompt', { prompt: props.text.slice(0, 60) })
  } catch (err) {
    console.error('Failed to copy prompt:', err)
  }
}
</script>

<template>
  <figure class="prompt-block cl-panel">
    <blockquote class="prompt-text">&ldquo;{{ text }}&rdquo;</blockquote>
    <button
      v-if="canCopy"
      type="button"
      class="prompt-copy cl-pill"
      :aria-label="copied ? 'Prompt copied' : 'Copy prompt'"
      @click="copy"
    >
      <svg v-if="!copied" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
        <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
      </svg>
      <svg v-else width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
        <polyline points="20 6 9 17 4 12"/>
      </svg>
      <span>{{ copied ? 'Copied' : 'Copy' }}</span>
    </button>
  </figure>
</template>

<style lang="scss" scoped>
// A panel, not a bar, so prompts read differently from prose blockquotes.
.prompt-block {
  display: flex;
  flex-direction: column;
  margin: 1.75rem 0;
  padding: 1.25rem 1.375rem;
}

.prompt-text {
  margin: 0;
  font-family: var(--bs-font-serif);
  font-size: 1.125rem;
  font-style: italic;
  line-height: 1.7;
  color: var(--cl-text);
  white-space: pre-line;
}

.prompt-copy {
  align-self: flex-end;
  margin-top: 1rem;
}
</style>
