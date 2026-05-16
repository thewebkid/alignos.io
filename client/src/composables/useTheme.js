import { ref, watch, onMounted } from 'vue'
import {track} from '../lib/tracker.js';

const STORAGE_KEY = 'alignos-theme'
const THEME_MODES = {
  LIGHT: 'light',
  DARK: 'dark',
  SYSTEM: 'system'
}

// Shared state across all component instances
const themeMode = ref(THEME_MODES.SYSTEM)
const effectiveTheme = ref('light')

let mediaQuery = null
let isInitialized = false

/**
 * Get the system's preferred color scheme
 */
function getSystemTheme() {
  if (typeof window === 'undefined') return 'light'
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

/**
 * Apply theme to document
 */
function applyTheme(theme) {
  if (typeof document === 'undefined') return

  effectiveTheme.value = theme
  document.documentElement.setAttribute('data-theme', theme)

  // Also update color-scheme for native browser elements
  document.documentElement.style.colorScheme = theme
}

/**
 * Update the effective theme based on current mode
 */
function updateEffectiveTheme() {
  if (themeMode.value === THEME_MODES.SYSTEM) {
    applyTheme(getSystemTheme())
  } else {
    applyTheme(themeMode.value)
  }
}

/**
 * Save theme preference to localStorage
 */
function saveThemePreference(mode) {
  if (typeof localStorage === 'undefined') return
  try {
    localStorage.setItem(STORAGE_KEY, mode)
  } catch (e) {
    console.warn('Failed to save theme preference:', e)
  }
}

/**
 * Load theme preference from localStorage
 */
function loadThemePreference() {
  if (typeof localStorage === 'undefined') return THEME_MODES.SYSTEM
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    return saved && Object.values(THEME_MODES).includes(saved)
      ? saved
      : THEME_MODES.SYSTEM
  } catch (e) {
    console.warn('Failed to load theme preference:', e)
    return THEME_MODES.SYSTEM
  }
}

/**
 * Set up system theme change listener
 */
function setupSystemThemeListener() {
  if (typeof window === 'undefined') return

  mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')

  const handleChange = () => {
    if (themeMode.value === THEME_MODES.SYSTEM) {
      updateEffectiveTheme()
    }
  }

  // Modern API
  if (mediaQuery.addEventListener) {
    mediaQuery.addEventListener('change', handleChange)
  } else {
    // Legacy API fallback
    mediaQuery.addListener(handleChange)
  }
}

/**
 * Initialize theme system
 */
function initializeTheme() {
  if (isInitialized) return
  isInitialized = true

  // Load saved preference
  themeMode.value = loadThemePreference()

  // Apply initial theme
  updateEffectiveTheme()

  // Watch for theme mode changes
  watch(themeMode, () => {
    updateEffectiveTheme()
    saveThemePreference(themeMode.value)
  })

  // Listen for system theme changes
  setupSystemThemeListener()
}

/**
 * Composable hook for theme management
 */
export function useTheme() {
  onMounted(() => {
    initializeTheme()
  })

  /**
   * Set theme mode (light, dark, or system)
   */
  const setThemeMode = (mode) => {
    if (Object.values(THEME_MODES).includes(mode)) {
      themeMode.value = mode
    }
  }

  /**
   * Cycle through theme modes: system → light → dark → system
   */
  const cycleTheme = () => {
    const modes = [THEME_MODES.SYSTEM, THEME_MODES.LIGHT, THEME_MODES.DARK]
    const currentIndex = modes.indexOf(themeMode.value)
    const nextIndex = (currentIndex + 1) % modes.length
    themeMode.value = modes[nextIndex]
  }

  /**
   * Toggle between light and dark (skips system)
   */
  const toggleTheme = () => {
    if (themeMode.value === THEME_MODES.LIGHT ||
        (themeMode.value === THEME_MODES.SYSTEM && effectiveTheme.value === 'light')) {
      themeMode.value = THEME_MODES.DARK
    } else {
      themeMode.value = THEME_MODES.LIGHT
    }
  }

  return {
    themeMode,
    effectiveTheme,
    setThemeMode,
    cycleTheme,
    toggleTheme,
    THEME_MODES
  }
}

// Export for early initialization (before Vue app mounts)
export function initThemeEarly() {
  initializeTheme();
  setTimeout(()=>{
    track('initTheme', {theme: themeMode.value, effectiveTheme: effectiveTheme.value});
  },5000)

}
