<script setup>
import { useReadingProgressStore } from '../stores/readingProgress.js'
import { computed, inject } from 'vue'

const progressStore = useReadingProgressStore()
const codexRegistry = inject('codexRegistry')

const stats = computed(() => progressStore.stats)
const totalCodexes = computed(() => codexRegistry?.size || 0)
</script>

<template>
  <footer class="app-footer">
    <div class="container">
      <div class="footer-content">
        <!-- Quote -->
        <div class="footer-quote">
          <p class="quote-text">
            "You are not asked to arrive complete. Only to return willing."
          </p>
        </div>

        <!-- Stats (subtle) -->
        <div class="footer-stats" v-if="stats.started > 0">
          <span class="stat">
            {{ stats.completed }} of {{ totalCodexes }} complete
          </span>
        </div>

        <!-- Links -->
        <div class="footer-links">
          <span class="footer-link-item">
            <a href="mailto:info@alignos.io" class="footer-link">info@alignos.io</a>
            <span class="divider" aria-hidden="true">·</span>
          </span>
          <span class="footer-link-item">
            <a href="/llms.txt" class="footer-link">For AI explorers</a>
            <span class="divider" aria-hidden="true">·</span>
          </span>
          <span class="footer-link-item">
            <a href="https://coherenceacrossscales.org" class="footer-link">Coherence Across Scales</a>
            <span class="divider" aria-hidden="true">·</span>
          </span>
          <span class="footer-link-item">
            <a
              href="https://www.youtube.com/@Alignos"
              class="footer-link footer-link-icon"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Alignos on YouTube"
              title="Alignos on YouTube"
            >
              <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" aria-hidden="true" focusable="false">
                <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
              </svg>
            </a>
          </span>
        </div>
      </div>
    </div>
  </footer>
</template>

<style lang="scss" scoped>
.app-footer {
  background: var(--cl-surface);
  border-top: 1px solid var(--cl-border-light);
  padding: 2rem 0;
  margin-top: 1rem;

}

.footer-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  text-align: center;
}

.footer-quote {
  max-width: 400px;
}

.quote-text {
  font-style: italic;
  font-size: 0.9375rem;
  color: var(--cl-text-muted);
  margin: 0;
  line-height: 1.6;
}

.footer-stats {
  font-size: 0.8125rem;
  color: var(--cl-text-muted);

  .stat {
    background: var(--cl-surface-hover);
    padding: 0.25rem 0.75rem;
    border-radius: var(--bs-border-radius-pill);
  }
}

.footer-links {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: center;
  row-gap: 0.25rem;
  font-size: 0.875rem;
}

// Each link travels with its trailing divider so a wrapped line
// never starts with a dangling separator.
.footer-link-item {
  display: inline-flex;
  align-items: baseline;
  white-space: nowrap;

  &:not(:last-child) {
    margin-right: 0.5rem;
  }
}

.footer-link {
  color: var(--cl-text-muted);
  text-decoration: none;
  transition: color 0.2s ease;

  &:hover {
    color: var(--cl-primary);
  }
}

.footer-link-icon {
  display: inline-flex;
  align-items: center;
  align-self: center;
  line-height: 1;
}

.divider {
  margin-left: 0.5rem;
  color: var(--cl-border);
}
</style>
