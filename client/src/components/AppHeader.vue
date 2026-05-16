<script setup>
import { ref } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import ThemeToggle from './ThemeToggle.vue'

const emit = defineEmits(['open-search'])
const route = useRoute()
const navExpanded = ref(false)

const navItems = [
  { name: 'Codex Lattice', path: '/', exact: true },
  //{ name: 'FAQ', path: '/faq' },
  { name: 'About', path: '/about' }
]

const isActive = (item) => {
  if (item.exact) {
    return route.path === item.path
  }
  return route.path.startsWith(item.path)
}

const handleSearchClick = () => {
  navExpanded.value = false // Close mobile menu if open
  emit('open-search')
}
</script>

<template>
  <header class="app-header">
    <nav class="navbar navbar-expand-md">
      <div class="container">
        <!-- Logo -->
        <RouterLink to="/" class="navbar-brand d-flex align-items-center">
          <svg class="brand-logo me-2" viewBox="0 0 40 40" width="36" height="36">
            <!-- Spiral logo inspired by alignos -->
            <defs>
              <linearGradient id="spiralGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" style="stop-color:var(--cl-accent)" />
                <stop offset="100%" style="stop-color:var(--cl-primary)" />
              </linearGradient>
            </defs>
            <path
              d="M20 4 C28 4 34 10 34 18 C34 26 28 32 20 32 C14 32 9 28 8 22 C7 17 10 12 15 10 C19 9 23 11 25 15 C26 18 25 21 22 23 C20 24 17 23 16 21 C15 19 16 17 18 16"
              fill="none"
              stroke="url(#spiralGradient)"
              stroke-width="2.5"
              stroke-linecap="round"
            />
          </svg>
          <span class="brand-text">Align<span class="brand-accent">OS</span> <em>Reader</em></span>
        </RouterLink>

        <!-- Mobile controls -->
        <div class="mobile-controls d-flex d-md-none align-items-center gap-2">
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
          <ul class="navbar-nav ms-auto align-items-center">
            <li v-for="item in navItems" :key="item.path" class="nav-item">
              <RouterLink
                :to="item.path"
                class="nav-link"
                :class="{ active: isActive(item) }"
                @click="navExpanded = false"
              >
                {{ item.name }}
              </RouterLink>
            </li>

            <!-- Theme toggle (desktop) -->
            <li class="nav-item ms-md-2 d-none d-md-block">
              <ThemeToggle variant="default" />
            </li>

            <!-- Search button (desktop) -->
            <li class="nav-item ms-md-2 d-none d-md-block">
              <button
                class="btn btn-search d-flex align-items-center"
                @click="emit('open-search')"
                title="Search (⌘K or /)"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="11" cy="11" r="8"/>
                  <path d="m21 21-4.35-4.35"/>
                </svg>
                <span class="d-none d-lg-inline ms-2">Search</span>
                <kbd class="d-none d-lg-inline ms-2">⌘K</kbd>
              </button>
            </li>

            <!-- Theme toggle (mobile) -->
            <li class="nav-item d-md-none w-100 mt-3 pt-3 border-top">
              <ThemeToggle variant="mobile" @click="navExpanded = false" />
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
  z-index: 1000;
  background: var(--cl-surface);
  border-bottom: 1px solid var(--cl-border-light);
  backdrop-filter: blur(10px);

  @supports (backdrop-filter: blur(10px)) {
    background: rgba(var(--cl-surface), 0.9);
  }
}

.navbar {
  padding: 0.75rem 0;
}

.navbar-brand {
  font-family: var(--bs-font-serif);
  font-size: 1.5rem;
  font-weight: 500;
  color: var(--cl-text-heading);
  transition: opacity 0.2s ease;

  &:hover {
    opacity: 0.8;
  }
}

.brand-logo {
  transition: transform 0.3s ease;

  .navbar-brand:hover & {
    transform: rotate(90deg);
  }
}

.brand-text {
  letter-spacing: -0.5px;
}

.brand-accent {
  color: var(--cl-accent);
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

@media (prefers-color-scheme: dark) {
  .navbar-toggler-icon {
    background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 30 30'%3e%3cpath stroke='rgba(93, 159, 161, 1)' stroke-linecap='round' stroke-miterlimit='10' stroke-width='2' d='M4 7h22M4 15h22M4 23h22'/%3e%3c/svg%3e");
  }
}
</style>
