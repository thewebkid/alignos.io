<script setup>
// ReadingSettings — the controls inside the header popover (desktop) and bottom sheet (mobile).
// Every change applies to the page immediately, so the text behind the panel is the preview.
import { ref, computed, onMounted } from 'vue'
import { useTheme } from '../composables/useTheme.js'
import {
  useReadingSettingsStore,
  READING_FONTS,
  TEXT_SCALES,
  GLOSSARY_MODES,
  READING_PACES
} from '../stores/readingSettings.js'
import { useReadingProgressStore } from '../stores/readingProgress.js'
import { track } from '../lib/tracker.js'

const settings = useReadingSettingsStore()
const progress = useReadingProgressStore()
const { themeMode, setThemeMode, THEME_MODES } = useTheme()

const themes = [
  { id: THEME_MODES.LIGHT, label: 'Light' },
  { id: THEME_MODES.DARK, label: 'Indigo' },
  { id: THEME_MODES.SYSTEM, label: 'Auto' }
]

const SAMPLE_WORDS = 5000
const sampleMinutes = computed(() => settings.minutesFor(SAMPLE_WORDS))
const fontName = computed(() => READING_FONTS.find(f => f.id === settings.font)?.name)

const confirmingReset = ref(false)

const set = (key, value) => {
  settings[key] = value
  track('readingSetting', { [key]: value })
}

const setTheme = (mode) => {
  setThemeMode(mode)
  track('setTheme', { theme: mode })
}

const resetProgress = () => {
  progress.clearAll()
  confirmingReset.value = false
  track('resetProgress')
}

onMounted(() => {
  for (const { preview } of READING_FONTS) {
    if (!preview || document.head.querySelector(`link[href="${preview}"]`)) continue
    const link = document.createElement('link')
    link.rel = 'stylesheet'
    link.href = preview
    document.head.appendChild(link)
  }
})
</script>

<template>
  <div class="reading-settings">
    <div class="rs-row">
      <span class="rs-label" id="rs-theme">Theme</span>
      <div class="rs-segment" role="radiogroup" aria-labelledby="rs-theme">
        <button
          v-for="t in themes"
          :key="t.id"
          type="button"
          role="radio"
          :aria-checked="themeMode === t.id"
          :class="{ active: themeMode === t.id }"
          @click="setTheme(t.id)"
        >{{ t.label }}</button>
      </div>
    </div>

    <div class="rs-row">
      <span class="rs-label" id="rs-font">Font</span>
      <div class="rs-fonts" role="radiogroup" aria-labelledby="rs-font">
        <button
          v-for="f in READING_FONTS"
          :key="f.id"
          type="button"
          role="radio"
          class="rs-font"
          :aria-checked="settings.font === f.id"
          :aria-label="f.name"
          :title="f.name"
          :class="{ active: settings.font === f.id }"
          :style="{ fontFamily: f.stack ?? 'var(--bs-font-sans-serif)' }"
          @click="set('font', f.id)"
        >Aa</button>
      </div>
      <span class="rs-hint">{{ fontName }}</span>
    </div>

    <div class="rs-row">
      <span class="rs-label" id="rs-size">Size</span>
      <div class="rs-segment rs-sizes" role="radiogroup" aria-labelledby="rs-size">
        <button
          v-for="(s, i) in TEXT_SCALES"
          :key="s"
          type="button"
          role="radio"
          :aria-checked="settings.scale === s"
          :aria-label="`${Math.round(s * 100)}%`"
          :class="{ active: settings.scale === s }"
          :style="{ fontSize: `${0.75 + i * 0.1875}rem` }"
          @click="set('scale', s)"
        >A</button>
      </div>
    </div>

    <div class="rs-row">
      <span class="rs-label" id="rs-glossary">Glossary</span>
      <div class="rs-segment" role="radiogroup" aria-labelledby="rs-glossary">
        <button
          v-for="m in GLOSSARY_MODES"
          :key="m.id"
          type="button"
          role="radio"
          :aria-checked="settings.glossary === m.id"
          :class="{ active: settings.glossary === m.id }"
          @click="set('glossary', m.id)"
        >{{ m.label }}</button>
      </div>
      <span class="rs-hint">Underlines on glossary terms. Tapping a term always opens it.</span>
    </div>

    <div class="rs-row">
      <span class="rs-label" id="rs-pace">Pace</span>
      <div class="rs-segment" role="radiogroup" aria-labelledby="rs-pace">
        <button
          v-for="p in READING_PACES"
          :key="p.id"
          type="button"
          role="radio"
          :aria-checked="settings.pace === p.id"
          :class="{ active: settings.pace === p.id }"
          @click="set('pace', p.id)"
        >{{ p.label }}</button>
      </div>
      <span class="rs-hint">About {{ sampleMinutes }} minutes for a {{ SAMPLE_WORDS.toLocaleString() }}-word codex</span>
    </div>

    <div class="rs-progress">
      <template v-if="!confirmingReset">
        <span>{{ progress.stats.started }} started · {{ progress.stats.completed }} complete</span>
        <button
          v-if="progress.stats.started"
          type="button"
          class="rs-link"
          @click="confirmingReset = true"
        >Reset…</button>
      </template>
      <template v-else>
        <span>Clear all reading progress?</span>
        <span class="rs-confirm">
          <button type="button" class="rs-link rs-link--danger" @click="resetProgress">Clear</button>
          <button type="button" class="rs-link" @click="confirmingReset = false">Keep</button>
        </span>
      </template>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.reading-settings {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  color: var(--cl-text);
  font-size: 0.875rem;
}

.rs-row {
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
}

.rs-label {
  font-size: 0.6875rem;
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--cl-text-muted);
}

.rs-hint {
  font-size: 0.75rem;
  color: var(--cl-text-muted);
}

.rs-segment {
  display: flex;
  padding: 0.1875rem;
  gap: 0.1875rem;
  background: var(--cl-bg);
  border: 1px solid var(--cl-border-light);
  border-radius: var(--bs-border-radius);

  button {
    flex: 1;
    padding: 0.375rem 0.5rem;
    border: none;
    border-radius: var(--bs-border-radius-sm);
    background: transparent;
    color: var(--cl-text-muted);
    font-weight: 500;
    line-height: 1.2;
    cursor: pointer;
    transition: color 0.2s ease, background-color 0.2s ease;

    &:hover {
      color: var(--cl-text);
    }

    &.active {
      background: var(--cl-surface-hover);
      color: var(--cl-primary);
    }
  }
}

.rs-sizes button {
  display: flex;
  align-items: flex-end;
  justify-content: center;
  min-height: 2.125rem;
}

.rs-fonts {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 0.375rem;
}

.rs-font {
  padding: 0.375rem 0;
  border: 1px solid var(--cl-border-light);
  border-radius: var(--bs-border-radius);
  background: transparent;
  color: var(--cl-text);
  font-size: 1.25rem;
  line-height: 1.3;
  cursor: pointer;
  transition: border-color 0.2s ease, color 0.2s ease;

  &:hover {
    border-color: var(--cl-border);
  }

  &.active {
    border-color: var(--cl-primary);
    color: var(--cl-primary);
  }
}

.rs-progress {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  padding-top: 0.875rem;
  border-top: 1px solid var(--cl-border-light);
  font-size: 0.8125rem;
  color: var(--cl-text-muted);
}

.rs-confirm {
  display: flex;
  gap: 0.75rem;
}

.rs-link {
  padding: 0;
  border: none;
  background: none;
  color: var(--cl-primary);
  font-size: inherit;
  cursor: pointer;

  &:hover {
    color: var(--cl-primary-hover);
  }

  &--danger {
    color: var(--bs-danger);
  }
}
</style>
