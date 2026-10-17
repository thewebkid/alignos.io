<script setup>
// "Carry my reading": a link (share, copy, or QR) that brings this device's progress to another one
import { computed, inject, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { BModal } from 'bootstrap-vue-next'
import { useReadingSettingsStore } from '../stores/readingSettings.js'
import { useReadingProgressStore } from '../stores/readingProgress.js'
import { buildDocument, encodeDocument, handoffLink } from '../lib/handoff/envelope.js'
import { track } from '../lib/tracker.js'

// Longer links make codes too dense to scan reliably off a laptop screen
const QR_MAX_LENGTH = 1200

const route = useRoute()
const codexRegistry = inject('codexRegistry')
const settings = useReadingSettingsStore()
const progressStore = useReadingProgressStore()

const link = ref('')
const qrSvg = ref('')
const copied = ref(false)
const count = computed(() => Object.keys(progressStore.progress).length)
const canShare = typeof navigator !== 'undefined' && typeof navigator.share === 'function'

const build = async () => {
  link.value = ''
  qrSvg.value = ''
  copied.value = false
  if (!count.value) return

  const doc = buildDocument({
    src: 'alignos.io',
    lattice: `alignos.io/${codexRegistry?.codexes.size ?? 0}`,
    progress: progressStore.progress,
    theme: localStorage.getItem('alignos-theme'),
    to: route.fullPath
  })
  link.value = handoffLink(window.location.origin, await encodeDocument(doc))

  if (link.value.length <= QR_MAX_LENGTH) {
    const { renderSVG } = await import('uqr')
    qrSvg.value = renderSVG(link.value, { ecc: 'M', border: 2 })
  }
}

watch(() => settings.carryOpen, (open) => {
  if (open) build()
})

const share = async () => {
  try {
    await navigator.share({ title: 'My Alignos reading', url: link.value })
    track('carryReading', { via: 'share', codices: count.value })
  } catch (e) {
    if (e?.name !== 'AbortError') console.warn('Share failed:', e)
  }
}

const linkInput = ref(null)
const copy = async () => {
  try {
    await navigator.clipboard.writeText(link.value)
  } catch {
    linkInput.value?.select()
    document.execCommand?.('copy')
  }
  copied.value = true
  track('carryReading', { via: 'copy', codices: count.value })
}
</script>

<template>
  <BModal
    v-model="settings.carryOpen"
    title="Carry my reading"
    centered
    no-footer
    content-class="carry-modal"
  >
    <p v-if="!count" class="carry-empty">
      There’s nothing to carry yet. Once you’ve started a codex, this makes a link that brings your place to another device.
    </p>

    <template v-else>
      <p class="carry-lead">
        This link carries your reading of {{ count }} {{ count === 1 ? 'codex' : 'codices' }}.
        Open it on another device and it’s added to whatever is there.
      </p>

      <div v-if="link" class="carry-actions">
        <button v-if="canShare" type="button" class="carry-button" @click="share">Share…</button>
        <button type="button" class="carry-button" :class="{ 'carry-button--quiet': canShare }" @click="copy">
          {{ copied ? 'Copied' : 'Copy link' }}
        </button>
      </div>
      <label for="carry-link" class="visually-hidden">Reading link</label>
      <input
        v-if="link"
        id="carry-link"
        ref="linkInput"
        class="carry-link"
        :value="link"
        readonly
        @focus="$event.target.select()"
      />

      <figure v-if="qrSvg" class="carry-qr">
        <div class="carry-qr-code" v-html="qrSvg"></div>
        <figcaption>Or scan this with your phone’s camera.</figcaption>
      </figure>
      <p v-else-if="link" class="carry-qr-too-long">
        There’s too much reading here to fit in a scannable code. Share or copy the link instead.
      </p>
    </template>
  </BModal>
</template>

<style lang="scss">
.carry-modal {
  background: var(--cl-bg-elevated);
  color: var(--cl-text);
  border: 1px solid var(--cl-border);

  .modal-header {
    border-bottom-color: var(--cl-border-light);
  }

  .modal-title {
    font-family: var(--bs-font-serif);
    font-size-adjust: none;
    font-weight: 500;
    color: var(--cl-text-heading);
  }

  .carry-lead,
  .carry-empty {
    line-height: 1.6;
  }

  .carry-actions {
    display: flex;
    gap: 0.75rem;
    margin: 1rem 0 0.75rem;
  }

  .carry-button {
    padding: 0.625rem 1.25rem;
    border: 0;
    border-radius: var(--bs-border-radius-lg);
    background: var(--cl-primary);
    color: white;
    font-weight: 500;

    &:hover {
      background: var(--cl-primary-hover);
    }

    &--quiet {
      background: transparent;
      color: var(--cl-primary);
      border: 1px solid var(--cl-border);

      &:hover {
        background: var(--cl-surface-hover);
      }
    }
  }

  .carry-link {
    width: 100%;
    padding: 0.5rem 0.75rem;
    background: var(--cl-surface);
    color: var(--cl-text-muted);
    border: 1px solid var(--cl-border-light);
    border-radius: var(--bs-border-radius);
    font-size: 0.8125rem;
  }

  .carry-qr {
    margin: 1.25rem 0 0;
    text-align: center;

    figcaption {
      margin-top: 0.5rem;
      font-size: 0.875rem;
      color: var(--cl-text-muted);
    }
  }

  // Dark modules on white, whatever the theme, so phone cameras can read it
  .carry-qr-code {
    display: inline-block;
    width: min(16rem, 100%);
    padding: 0.5rem;
    background: white;
    border-radius: var(--bs-border-radius);

    svg {
      display: block;
      width: 100%;
      height: auto;
    }
  }

  .carry-qr-too-long {
    margin: 1rem 0 0;
    font-size: 0.875rem;
    color: var(--cl-text-muted);
  }
}
</style>
