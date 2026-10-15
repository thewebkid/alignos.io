<script setup>
import CodexCard from './CodexCard.vue'
import PlannedCard from './PlannedCard.vue'
import { useReadingProgressStore } from '../stores/readingProgress.js'

// Items are Codex instances, or `{ planned: true, id, position, total, title, subtitle }`
// for unwritten series positions (corridor view only).
defineProps({
  codexes: {
    type: Array,
    required: true
  }
})

const progressStore = useReadingProgressStore()

const getTooltipText = (codex) => {
  const percent = progressStore.getScrollPercent(codex.id)
  const lastRead = progressStore.getLastRead(codex.id)

  if (lastRead === 'unopened') {
    return null // Don't show tooltip for unopened books
  }

  const date = new Date(lastRead).toLocaleDateString();
  const time = new Date(lastRead).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  return `${percent}% complete | Last read: ${date} ${time}`
}
</script>

<template>
  <div class="codex-grid">
    <template v-for="item in codexes" :key="item.id">
      <PlannedCard
        v-if="item.planned"
        :position="item.position"
        :total="item.total"
        :title="item.title"
        :subtitle="item.subtitle"
      />
      <CodexCard
        v-else
        :codex="item"
        :tip="getTooltipText(item)"
      />
    </template>
  </div>
</template>

<style lang="scss" scoped>
.codex-grid {
  display: grid;
  gap: 1rem;

  // Mobile: 2 columns for better density
  grid-template-columns: repeat(2, 1fr);

  // Tablet: responsive columns based on available space
  @media (min-width: 640px) {
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: 1.5rem;
  }

  // Desktop: larger cards
  @media (min-width: 1024px) {
    grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
    gap: 2rem;
  }

  // Large desktop: even larger cards
  @media (min-width: 1400px) {
    grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  }
}
</style>
