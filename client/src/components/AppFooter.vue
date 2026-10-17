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
            <a href="https://coherenceacrossscales.org" class="footer-link">Coherence Across Scales (new)</a>
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
  font-family: var(--cl-font-reading);
  font-size-adjust: var(--cl-font-reading-adjust);
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

.divider {
  margin-left: 0.5rem;
  color: var(--cl-border);
}
</style>
