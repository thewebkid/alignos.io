<script setup>
import { ref } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { BNavItemDropdown, BDropdownItem } from 'bootstrap-vue-next'
import ThemeToggle from './ThemeToggle.vue'

const emit = defineEmits(['open-search'])
const route = useRoute()
const navExpanded = ref(false)

const navItems = [
  { name: 'Codex Lattice', to: '/lattice', match: ['/lattice', '/codex/'] },
  {
    name: 'Return Rooms',
    children: [
      { name: 'Before You Begin…', to: '/before-you-begin' },
      { name: 'Begin a Return Room', to: '/return-room' },
      { name: 'The Arc of Difference', to: '/arc-of-difference' }
    ]
  },
  { name: 'Between Worlds', to: '/between-worlds' },
  { name: 'Papers', to: '/papers' },
  { name: 'FAQ', to: '/faq' }
]

const matchesPath = (prefix) => route.path === prefix || route.path.startsWith(prefix.endsWith('/') ? prefix : `${prefix}/`)

const isActive = (item) => {
  if (item.children) return item.children.some(isActive)
  return (item.match ?? [item.to]).some(matchesPath)
}

const closeNav = () => {
  navExpanded.value = false
}

const handleSearchClick = () => {
  navExpanded.value = false // Close mobile menu if open
  emit('open-search')
}
</script>

<template>
  <header class="app-header">
    <nav class="navbar navbar-expand-lg">
      <div class="container">
        <!-- Brand lockup -->
        <RouterLink to="/" class="navbar-brand d-flex align-items-center" aria-label="Alignos">
          <img
            class="brand-mark me-2"
            src="/brand/alignos-spiral-72.png"
            srcset="/brand/alignos-spiral-72.png 2x, /brand/alignos-spiral-108.png 3x"
            width="36"
            height="36"
            alt=""
          />
          <img
            class="brand-wordmark"
            src="/alignos-logo-text.svg"
            width="105"
            height="26"
            alt=""
          />
        </RouterLink>

        <!-- Mobile controls -->
        <div class="mobile-controls d-flex d-lg-none align-items-center gap-2">
          <!-- Search button (always visible on mobile) -->
          <button
            class="btn btn-search-mobile d-flex align-items-center justify-content-center"
            @click="handleSearchClick"
            title="Search (⌘K or /)"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="11" cy="11" r="8"/>
              <path d="m21 21-4.35-4.35"/>
            </svg>
          </button>

          <!-- Mobile toggle -->
          <button
            class="navbar-toggler border-0"
            type="button"
            @click="navExpanded = !navExpanded"
            :aria-expanded="navExpanded"
          >
            <span class="navbar-toggler-icon"></span>
          </button>
        </div>

        <!-- Navigation -->
        <div class="collapse navbar-collapse" :class="{ show: navExpanded }">
          <ul class="navbar-nav ms-auto align-items-lg-center">
            <template v-for="item in navItems" :key="item.name">
              <template v-if="item.children">
                <!-- Desktop: dropdown -->
                <BNavItemDropdown
                  class="d-none d-lg-block"
                  :text="item.name"
                  :toggle-class="['nav-link', { active: isActive(item) }]"
                >
                  <BDropdownItem
                    v-for="child in item.children"
                    :key="child.to"
                    :to="child.to"
                    :link-class="{ active: isActive(child) }"
                  >
                    {{ child.name }}
                  </BDropdownItem>
                </BNavItemDropdown>

                <!-- Mobile: parent label with children listed beneath -->
                <li class="nav-item nav-group d-lg-none">
                  <span class="nav-link nav-group-label" :class="{ active: isActive(item) }">
                    {{ item.name }}
                  </span>
                  <ul class="nav-group-children list-unstyled">
                    <li v-for="child in item.children" :key="child.to">
                      <RouterLink
                        :to="child.to"
                        class="nav-link"
                        :class="{ active: isActive(child) }"
                        @click="closeNav"
                      >
                        {{ child.name }}
                      </RouterLink>
                    </li>
                  </ul>
                </li>
              </template>

              <li v-else class="nav-item">
                <RouterLink
                  :to="item.to"
                  class="nav-link"
                  :class="{ active: isActive(item) }"
                  @click="closeNav"
                >
                  {{ item.name }}
                </RouterLink>
              </li>
            </template>

            <!-- Theme toggle (desktop) -->
            <li class="nav-item ms-lg-2 d-none d-lg-block">
              <ThemeToggle variant="default" />
            </li>

            <!-- Search button (desktop) -->
            <li class="nav-item ms-lg-2 d-none d-lg-block">
              <button
                class="btn btn-search d-flex align-items-center"
                @click="emit('open-search')"
                title="Search (⌘K or /)"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="11" cy="11" r="8"/>
                  <path d="m21 21-4.35-4.35"/>
                </svg>
                <span class="d-none d-xl-inline ms-2">Search</span>
                <kbd class="d-none d-xl-inline ms-2">⌘K</kbd>
              </button>
            </li>

            <!-- Theme toggle (mobile) -->
            <li class="nav-item d-lg-none w-100 mt-3 pt-3 border-top">
              <ThemeToggle variant="mobile" @click="closeNav" />
            </li>
          </ul>
        </div>
      </div>
    </nav>
  </header>
</template>

<style lang="scss" scoped>
.app-header {
  position: sticky;
  top: 0;
  z-index: 1020; // above the reader's sticky title bar (1000) so nav dropdowns overlay it
  // Solid surface: rgba(var(--cl-surface), 0.9) is invalid CSS (hex var inside
  // rgba()), which made the header transparent at computed-value time.
  // Translucency would need an --cl-surface-rgb triplet token; solid matches
  // the footer and keeps scrolled content from bleeding through.
  background: var(--cl-surface);
  border-bottom: 1px solid var(--cl-border-light);
}

.navbar {
  padding: 0.75rem 0;
}

.navbar-brand {
  transition: opacity 0.2s ease;

  &:hover {
    opacity: 0.8;
  }
}

.brand-mark {
  width: 36px;
  height: 36px;

  @media (prefers-reduced-motion: no-preference) {
    transition: transform 0.3s ease;

    .navbar-brand:hover & {
      transform: rotate(90deg);
    }
  }
}

.brand-wordmark {
  height: 26px;
  width: auto;
}

.nav-link {
  color: var(--cl-text-muted);
  font-weight: 500;
  padding: 0.5rem 1rem !important;
  border-radius: var(--bs-border-radius);
  transition: color 0.2s ease, background-color 0.2s ease;

  &:hover {
    color: var(--cl-primary);
    background-color: var(--cl-surface-hover);
  }

  &.active {
    color: var(--cl-primary);
    background-color: var(--cl-surface-hover);
  }
}

// Mobile nav group (< lg): quiet, non-clickable group label
.nav-group-label {
  cursor: default;
  padding-bottom: 0.25rem;
  font-size: 0.75rem;
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;

  &:hover,
  &.active {
    background-color: transparent;
  }

  &:hover {
    color: var(--cl-text-muted);
  }

  &.active {
    color: var(--cl-primary);
  }
}

.nav-group-children {
  margin: 0 0 0.25rem 1rem;
  padding: 0 0 0 0.75rem;
  border-left: 1px solid var(--cl-border-light);
}

// Return Rooms dropdown (desktop) — bootstrap-vue-next renders the toggle
// and menu inside child components, so :deep() is needed to reach them.
.navbar-nav {
  :deep(.dropdown-toggle) {
    padding: 0.5rem 1rem;
    color: var(--cl-text-muted);
    font-weight: 500;
    line-height: inherit;
    background-color: transparent;
    border: none;
    border-radius: var(--bs-border-radius);
    transition: color 0.2s ease, background-color 0.2s ease;

    &:hover,
    &:focus-visible,
    &.show,
    &.active {
      color: var(--cl-primary);
      background-color: var(--cl-surface-hover);
    }

    // Subtle caret
    &::after {
      margin-left: 0.45em;
      vertical-align: 0.14em;
      border-top-width: 0.28em;
      border-right-width: 0.24em;
      border-left-width: 0.24em;
      opacity: 0.55;
    }
  }

  // Theme the menu with app tokens so it matches in BOTH light and dark,
  // regardless of whether the theme came from the data attribute or the OS.
  :deep(.dropdown-menu) {
    --bs-dropdown-color: var(--cl-text);
    --bs-dropdown-bg: var(--cl-surface);
    --bs-dropdown-border-color: var(--cl-border-light);
    --bs-dropdown-link-color: var(--cl-text);
    --bs-dropdown-link-hover-color: var(--cl-primary);
    --bs-dropdown-link-hover-bg: var(--cl-surface-hover);
    --bs-dropdown-link-active-color: var(--cl-primary);
    --bs-dropdown-link-active-bg: var(--cl-surface-hover);
    --bs-dropdown-link-disabled-color: var(--cl-text-muted);
    --bs-dropdown-header-color: var(--cl-text-muted);
    --bs-dropdown-divider-bg: var(--cl-border-light);

    margin-top: 0.375rem;
    padding: 0.375rem;
    border-radius: var(--bs-border-radius-lg);
    box-shadow: 0 0.5rem 1.5rem var(--cl-shadow-lg);
  }

  :deep(.dropdown-item) {
    padding: 0.5rem 0.75rem;
    font-weight: 500;
    border-radius: var(--bs-border-radius-sm);
    transition: color 0.2s ease, background-color 0.2s ease;
  }
}

// Collapsed mobile menu
@media (max-width: 991.98px) {
  .navbar-collapse {
    padding: 0.5rem 0 0.25rem;
    max-height: calc(100vh - 5rem);
    overflow-y: auto;
  }
}

.mobile-controls {
  .btn-search-mobile {
    background: transparent;
    border: none;
    color: var(--cl-text-muted);
    padding: 0.5rem;
    width: 40px;
    height: 40px;
    border-radius: var(--bs-border-radius);
    transition: all 0.2s ease;

    &:hover {
      background: var(--cl-surface-hover);
      color: var(--cl-primary);
    }

    &:active {
      transform: scale(0.95);
    }
  }
}

.btn-search {
  background: var(--cl-surface-hover);
  border: 1px solid var(--cl-border-light);
  color: var(--cl-text-muted);
  padding: 0.5rem 0.75rem;
  border-radius: var(--bs-border-radius);
  font-size: 0.875rem;
  transition: all 0.2s ease;

  &:hover {
    background: var(--cl-surface);
    border-color: var(--cl-border);
    color: var(--cl-text);
    box-shadow: var(--cl-shadow);
  }

  kbd {
    background: var(--cl-bg);
    border: 1px solid var(--cl-border-light);
    border-radius: 4px;
    padding: 0.125rem 0.375rem;
    font-family: inherit;
    font-size: 0.75rem;
    color: var(--cl-text-muted);
  }
}

.navbar-toggler-icon {
  background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 30 30'%3e%3cpath stroke='rgba(74, 124, 126, 1)' stroke-linecap='round' stroke-miterlimit='10' stroke-width='2' d='M4 7h22M4 15h22M4 23h22'/%3e%3c/svg%3e");
}

// Dark toggler icon — covers both explicit theme choice and OS preference,
// but stays light-themed when the user explicitly chose light.
@media (prefers-color-scheme: dark) {
  :root:not([data-theme='light']) .navbar-toggler-icon {
    background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 30 30'%3e%3cpath stroke='rgba(93, 159, 161, 1)' stroke-linecap='round' stroke-miterlimit='10' stroke-width='2' d='M4 7h22M4 15h22M4 23h22'/%3e%3c/svg%3e");
  }
}

[data-theme='dark'] .navbar-toggler-icon {
  background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 30 30'%3e%3cpath stroke='rgba(93, 159, 161, 1)' stroke-linecap='round' stroke-miterlimit='10' stroke-width='2' d='M4 7h22M4 15h22M4 23h22'/%3e%3c/svg%3e");
}
</style>
