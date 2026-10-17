import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'

// index.html reads this key before first paint; keep the persisted shape in sync with it
const STORAGE_KEY = 'alignos-reading'

export const READING_FONTS = [
  {
    id: 'source-sans',
    name: 'Source Sans 3',
    stack: null, // the --cl-font-reading default in main.scss
    href: null
  },
  {
    id: 'georgia',
    name: 'Georgia',
    stack: "Georgia, 'Times New Roman', serif",
    href: null
  },
  {
    id: 'cormorant',
    name: 'Cormorant Garamond',
    stack: "'Cormorant Garamond', Georgia, serif",
    href: null // loaded in index.html as the heading face
  },
  {
    id: 'atkinson',
    name: 'Atkinson Hyperlegible',
    stack: "'Atkinson Hyperlegible Next', system-ui, sans-serif",
    href: 'https://fonts.googleapis.com/css2?family=Atkinson+Hyperlegible+Next:ital,wght@0,200..800;1,200..800&display=swap',
    // Just the swatch glyphs, so the picker previews the face without downloading it
    preview: 'https://fonts.googleapis.com/css2?family=Atkinson+Hyperlegible+Next&text=Aa'
  },
  {
    id: 'encode',
    name: 'Encode Sans',
    stack: "'Encode Sans', system-ui, sans-serif",
    href: 'https://fonts.googleapis.com/css2?family=Encode+Sans:wdth,wght@75..125,100..900&display=swap',
    preview: 'https://fonts.googleapis.com/css2?family=Encode+Sans&text=Aa'
  }
]

export const TEXT_SCALES = [0.9, 1, 1.125, 1.25]

export const GLOSSARY_MODES = [
  { id: 'always', label: 'Always' },
  { id: 'first-two', label: 'First two' },
  { id: 'off', label: 'Off' }
]

export const READING_PACES = [
  { id: 'unhurried', label: 'Unhurried', wpm: 150 },
  { id: 'typical', label: 'Typical', wpm: 200 },
  { id: 'brisk', label: 'Brisk', wpm: 275 }
]

const DEFAULTS = { font: 'source-sans', scale: 1, glossary: 'always', pace: 'typical' }

const isValid = {
  font: (v) => READING_FONTS.some(f => f.id === v),
  scale: (v) => TEXT_SCALES.includes(v),
  glossary: (v) => GLOSSARY_MODES.some(m => m.id === v),
  pace: (v) => READING_PACES.some(p => p.id === v)
}

const loadFromStorage = () => {
  if (typeof window === 'undefined') return { ...DEFAULTS }
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}')
    return Object.fromEntries(
      Object.entries(DEFAULTS).map(([key, fallback]) => [key, isValid[key](stored[key]) ? stored[key] : fallback])
    )
  } catch (e) {
    console.warn('Failed to load reading settings:', e)
    return { ...DEFAULTS }
  }
}

const applyFontLink = (href) => {
  let link = document.head.querySelector('link[data-reading-font]')
  if (!href) {
    link?.remove()
    return
  }
  if (!link) {
    link = document.createElement('link')
    link.rel = 'stylesheet'
    link.dataset.readingFont = ''
    document.head.appendChild(link)
  }
  if (link.href !== href) link.href = href
}

export const useReadingSettingsStore = defineStore('readingSettings', () => {
  const initial = loadFromStorage()
  const font = ref(initial.font)
  const scale = ref(initial.scale)
  const glossary = ref(initial.glossary)
  const pace = ref(initial.pace)

  // Whether the settings panel is open; opened from the header, glossary popup, or codex menu
  const panelOpen = ref(false)

  const fontOption = computed(() => READING_FONTS.find(f => f.id === font.value))
  const wpm = computed(() => READING_PACES.find(p => p.id === pace.value).wpm)

  const minutesFor = (wordCount) => Math.max(1, Math.ceil((wordCount || 0) / wpm.value))

  const apply = () => {
    if (typeof document === 'undefined') return
    const root = document.documentElement

    if (glossary.value === DEFAULTS.glossary) root.removeAttribute('data-glossary')
    else root.setAttribute('data-glossary', glossary.value)

    if (scale.value === DEFAULTS.scale) root.style.removeProperty('--cl-reading-scale')
    else root.style.setProperty('--cl-reading-scale', String(scale.value))

    const { stack, href } = fontOption.value
    if (stack) root.style.setProperty('--cl-font-reading', stack)
    else root.style.removeProperty('--cl-font-reading')
    applyFontLink(href)
  }

  const save = () => {
    if (typeof window === 'undefined') return
    const { stack, href } = fontOption.value
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        font: font.value,
        scale: scale.value,
        glossary: glossary.value,
        pace: pace.value,
        fontStack: stack,
        fontHref: href
      }))
    } catch (e) {
      console.warn('Failed to save reading settings:', e)
    }
  }

  watch([font, scale, glossary, pace], () => {
    apply()
    save()
  })

  apply()

  const openPanel = () => {
    panelOpen.value = true
  }

  const closePanel = () => {
    panelOpen.value = false
  }

  return {
    font,
    scale,
    glossary,
    pace,
    wpm,
    panelOpen,
    minutesFor,
    openPanel,
    closePanel
  }
})
