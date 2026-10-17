<script setup>
// Arrival for a handoff link: /import#z=… (or #j=…) from the legacy reader or another device
import { computed, inject, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useReadingProgressStore } from '../stores/readingProgress.js'
import { useTheme } from '../composables/useTheme.js'
import { COMPLETE_AT } from '../lib/progress.js'
import { decodeDocument, resolveDocument, HandoffError } from '../lib/handoff/envelope.js'
import { createResolver } from '../lib/handoff/resolve.js'
import { takeHandoff } from '../lib/handoff/slot.js'
import { track } from '../lib/tracker.js'

const router = useRouter()
const codexRegistry = inject('codexRegistry')
const progressStore = useReadingProgressStore()
const { setThemeMode } = useTheme()

// idle until mounted, so the prerendered page and the first client render match
const state = ref('idle')
const error = ref('')
const pasted = ref('')
const result = ref(null)

const applyHandoff = async (text) => {
  state.value = 'working'
  try {
    const parsed = await decodeDocument(text)
    const resolver = createResolver([...codexRegistry.codexes.keys()])
    const { progress, skipped, theme, to } = resolveDocument(parsed, resolver)

    progressStore.merge(progress)
    if (theme && localStorage.getItem('alignos-theme') === null) setThemeMode(theme)

    const entries = Object.entries(progress)
    track('handoffImport', { src: parsed.src, codices: entries.length, skipped })
    if (!entries.length) {
      router.replace(to)
      return
    }

    const [lastId] = entries.reduce((a, b) => (Date.parse(b[1].lastRead) > Date.parse(a[1].lastRead) ? b : a))
    const completed = entries.filter(([, e]) => e.furthest >= COMPLETE_AT).length
    result.value = {
      src: parsed.src,
      completed,
      inProgress: entries.length - completed,
      lastTitle: codexRegistry.codexes.get(lastId)?.title ?? null,
      skipped,
      to
    }
    state.value = 'welcome'
  } catch (e) {
    if (!(e instanceof HandoffError)) console.warn('Handoff failed:', e)
    error.value = e instanceof HandoffError ? e.message : 'The link could not be read'
    state.value = 'unreadable'
  }
}

const submitPaste = () => {
  if (pasted.value.trim()) applyHandoff(pasted.value)
}

const heading = computed(() => (result.value?.src === 'reader' ? 'Welcome to alignos.io' : 'Your reading is here'))
const lead = computed(() => (result.value?.src === 'reader'
  ? 'Your reading came with you:'
  : 'Your reading from another device was added:'))

onMounted(() => {
  const hash = takeHandoff()
  if (hash) applyHandoff(hash)
  else state.value = 'paste'
})
</script>

<template>
  <article class="import-view">
    <div class="container">
      <div class="import-column">
        <p v-if="state === 'working'" class="import-working">Bringing your reading in…</p>

        <template v-else-if="state === 'welcome'">
          <h1 class="import-title">{{ heading }}</h1>
          <p class="import-lead">{{ lead }}</p>
          <p class="import-counts">
            <span>{{ result.completed }} complete</span>
            <span aria-hidden="true">·</span>
            <span>{{ result.inProgress }} in progress</span>
          </p>
          <p v-if="result.lastTitle" class="import-last">Last read: <em>{{ result.lastTitle }}</em></p>
          <p v-if="result.skipped" class="import-note">
            {{ result.skipped }} {{ result.skipped === 1 ? 'entry' : 'entries' }} didn’t match a codex here and {{ result.skipped === 1 ? 'was' : 'were' }} left out.
          </p>
          <RouterLink :to="result.to" class="import-continue">Continue reading</RouterLink>
        </template>

        <template v-else-if="state === 'paste' || state === 'unreadable'">
          <h1 class="import-title">Carry your reading</h1>
          <p v-if="state === 'unreadable'" class="import-error" role="alert">
            {{ error }}. Nothing on this device was changed.
          </p>
          <p class="import-lead">
            Paste a reading link from another device or from the Alignos reader, and your progress will be added here.
          </p>
          <form class="import-paste" @submit.prevent="submitPaste">
            <label for="handoff-link" class="visually-hidden">Reading link</label>
            <input
              id="handoff-link"
              v-model="pasted"
              type="text"
              inputmode="url"
              autocomplete="off"
              spellcheck="false"
              placeholder="https://alignos.io/import#…"
            />
            <button type="submit" :disabled="!pasted.trim()">Add my reading</button>
          </form>
          <RouterLink to="/lattice" class="import-lattice">Go to the Codex Lattice</RouterLink>
        </template>
      </div>
    </div>
  </article>
</template>

<style lang="scss" scoped>
.import-view {
  padding: 3.5rem 0 6rem;
}

.import-column {
  max-width: 34rem;
  margin: 0 auto;
}

.import-title {
  font-family: var(--bs-font-serif);
  font-size-adjust: none;
  font-size: clamp(2rem, 5vw, 2.5rem);
  font-weight: 500;
  color: var(--cl-text-heading);
  margin: 0 0 1.25rem;
}

.import-lead,
.import-working {
  color: var(--cl-text);
  font-size: 1.0625rem;
  line-height: 1.7;
  margin: 0 0 1rem;
}

.import-counts {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  font-size: 1.25rem;
  color: var(--cl-text-heading);
  margin: 0 0 0.5rem;
}

.import-last,
.import-note {
  color: var(--cl-text-muted);
  margin: 0 0 0.5rem;
}

.import-error {
  color: var(--cl-accent);
  margin: 0 0 1rem;
}

.import-continue,
.import-paste button {
  display: inline-flex;
  align-items: center;
  padding: 0.8125rem 1.75rem;
  background: var(--cl-primary);
  color: white;
  border: 0;
  border-radius: var(--bs-border-radius-lg);
  text-decoration: none;
  font-weight: 500;
  transition: background 0.2s ease;

  &:hover:not(:disabled) {
    background: var(--cl-primary-hover);
    color: white;
  }

  &:disabled {
    opacity: 0.5;
  }
}

.import-continue {
  margin-top: 1.75rem;
}

.import-paste {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  margin: 1.25rem 0 1.75rem;

  input {
    flex: 1 1 16rem;
    min-width: 0;
    padding: 0.75rem 1rem;
    background: var(--cl-surface);
    color: var(--cl-text);
    border: 1px solid var(--cl-border);
    border-radius: var(--bs-border-radius-lg);
  }
}

.import-lattice {
  color: var(--cl-primary);
}
</style>
