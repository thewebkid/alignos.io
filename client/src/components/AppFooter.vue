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
          <a href="mailto:info@alignos.io" class="footer-link">Contact</a>
          <span class="divider">·</span>
          <a href="https://alignos.io" target="_blank" rel="noopener" class="footer-link">
            alignos.io
          </a><span class="divider">·</span>
          <a href="/llms.json">For AI explorers</a>
          <span class="divider">·</span>
          <a href="https://coherenceacrossscales.org">Coherence Across Scales (new)</a>
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
  font-family: var(--bs-font-serif);
  font-style: italic;
  font-size: 1rem;
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
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;

  //@media (max-width: 576px) {
    margin-bottom: 100px;
  //}
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
  color: var(--cl-border);
}
</style>
