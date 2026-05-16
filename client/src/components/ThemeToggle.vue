<script setup>
import { computed } from 'vue'
import { useTheme } from '../composables/useTheme.js'
import {track} from '../lib/tracker.js';

const props = defineProps({
  variant: {
    type: String,
    default: 'default', // 'default' or 'mobile'
    validator: (value) => ['default', 'mobile'].includes(value)
  }
})

const { themeMode, effectiveTheme, cycleTheme, THEME_MODES } = useTheme()

// Get the display text for the current theme mode
const themeLabel = computed(() => {
  switch (themeMode.value) {
    case THEME_MODES.LIGHT:
      return 'Light'
    case THEME_MODES.DARK:
      return 'Dark'
    case THEME_MODES.SYSTEM:
      return `Auto (${effectiveTheme.value === 'dark' ? 'Dark' : 'Light'})`
    default:
      return 'Auto'
  }
})

// Get icon for current theme
const currentIcon = computed(() => {
  if (themeMode.value === THEME_MODES.LIGHT) {
    return 'sun'
  } else if (themeMode.value === THEME_MODES.DARK) {
    return 'moon'
  } else {
    return 'auto'
  }
})

const handleClick = () => {
  cycleTheme();
  setTimeout(()=>{
    track('setTheme', {theme: themeLabel.value})
  }, 1);
}
</script>

<template>
  <button
    :class="[
      'theme-toggle',
      `theme-toggle--${variant}`,
      `theme-toggle--${currentIcon}`
    ]"
    @click="handleClick"
    :title="`Theme: ${themeLabel}`"
    :aria-label="`Toggle theme (current: ${themeLabel})`"
  >
    <!-- Sun Icon (Light Mode) -->
    <svg
      v-if="currentIcon === 'sun'"
      class="theme-toggle__icon"
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
    >
      <circle cx="12" cy="12" r="5"/>
      <line x1="12" y1="1" x2="12" y2="3"/>
      <line x1="12" y1="21" x2="12" y2="23"/>
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
      <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
      <line x1="1" y1="12" x2="3" y2="12"/>
      <line x1="21" y1="12" x2="23" y2="12"/>
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
      <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
    </svg>

    <!-- Moon Icon (Dark Mode) -->
    <svg
      v-else-if="currentIcon === 'moon'"
      class="theme-toggle__icon"
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
    >
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
    </svg>

    <!-- Auto Icon (System Mode) -->
    <svg
      v-else
      class="theme-toggle__icon"
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
    >
      <circle cx="12" cy="12" r="10"/>
      <path d="M12 2 L12 22 M12 2 A10 10 0 0 1 12 22"/>
    </svg>

    <!-- Label for mobile variant -->
    <span v-if="variant === 'mobile'" class="theme-toggle__label">
      {{ themeLabel }}
    </span>
  </button>
</template>

<style lang="scss" scoped>
.theme-toggle {
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: 1px solid var(--cl-border-light);
  color: var(--cl-text-muted);
  border-radius: var(--bs-border-radius);
  cursor: pointer;
  transition: all 0.2s ease;
  position: relative;

  &:hover {
    background: var(--cl-surface-hover);
    border-color: var(--cl-border);
    color: var(--cl-text);
  }

  &:active {
    transform: scale(0.95);
  }

  &:focus-visible {
    outline: 2px solid var(--cl-primary);
    outline-offset: 2px;
  }
}

// Default variant (compact for desktop)
.theme-toggle--default {
  width: 40px;
  height: 40px;
  padding: 0;

  .theme-toggle__icon {
    width: 20px;
    height: 20px;
  }
}

// Mobile variant (full width with label)
.theme-toggle--mobile {
  width: 100%;
  padding: 0.75rem 1rem;
  justify-content: flex-start;
  gap: 0.75rem;
  background: var(--cl-surface);
  border: none;
  border-radius: 0;

  &:hover {
    background: var(--cl-surface-hover);
  }

  .theme-toggle__icon {
    width: 20px;
    height: 20px;
    flex-shrink: 0;
  }

  .theme-toggle__label {
    font-size: 0.875rem;
    font-weight: 500;
    text-align: left;
    flex: 1;
  }
}

// Icon animations
.theme-toggle__icon {
  transition: transform 0.3s ease, opacity 0.2s ease;
}

// Rotate animation on click
.theme-toggle:active .theme-toggle__icon {
  transform: rotate(180deg);
}

// Special styling for sun icon
.theme-toggle--sun {
  .theme-toggle__icon {
    color: var(--cl-accent);
  }

  &:hover .theme-toggle__icon {
    color: var(--cl-accent-hover);
  }
}

// Special styling for moon icon
.theme-toggle--moon {
  .theme-toggle__icon {
    color: var(--cl-primary);
  }

  &:hover .theme-toggle__icon {
    color: var(--cl-primary-hover);
  }
}

// Special styling for auto icon
.theme-toggle--auto {
  .theme-toggle__icon {
    color: var(--cl-text-muted);
  }

  &:hover .theme-toggle__icon {
    color: var(--cl-text);
  }
}

// Subtle pulse animation for theme changes
@keyframes theme-pulse {
  0%, 100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.1);
  }
}
</style>
