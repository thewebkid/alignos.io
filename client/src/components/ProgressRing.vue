<script setup>
import { computed } from 'vue'

const props = defineProps({
  percent: {
    type: Number,
    default: 0
  },
  size: {
    type: Number,
    default: 40
  },
  strokeWidth: {
    type: Number,
    default: 3
  }
})

const radius = computed(() => (props.size - props.strokeWidth) / 2)
const circumference = computed(() => radius.value * 2 * Math.PI)
const offset = computed(() => {
  const progress = Math.min(Math.max(props.percent, 0), 100)
  return circumference.value - (progress / 100) * circumference.value
})
const displayPercent = computed(() => Math.round(props.percent))
</script>

<template>
  <svg 
    :width="size" 
    :height="size" 
    class="progress-ring"
    :style="{ '--size': size + 'px' }"
  >
    <!-- Background circle -->
    <circle
      class="progress-ring__background"
      :stroke-width="strokeWidth"
      fill="transparent"
      :r="radius"
      :cx="size / 2"
      :cy="size / 2"
    />
    <!-- Progress circle -->
    <circle
      class="progress-ring__progress"
      :stroke-width="strokeWidth"
      fill="transparent"
      :r="radius"
      :cx="size / 2"
      :cy="size / 2"
      :stroke-dasharray="circumference"
      :stroke-dashoffset="offset"
    />
    <!-- Percentage text -->
    <text 
      v-if="size >= 32"
      :x="size / 2" 
      :y="size / 2" 
      class="progress-ring__text"
      dominant-baseline="central"
      text-anchor="middle"
    >
      {{ displayPercent }}
    </text>
  </svg>
</template>

<style lang="scss" scoped>
.progress-ring {
  transform: rotate(-90deg);
}

.progress-ring__background {
  stroke: var(--cl-progress-track);
}

.progress-ring__progress {
  stroke: var(--cl-progress-fill);
  stroke-linecap: round;
  transition: stroke-dashoffset 0.3s ease;
}

.progress-ring__text {
  transform: rotate(90deg);
  transform-origin: center;
  fill: var(--cl-text-muted);
  font-size: 0.625rem;
  font-weight: 600;
}
</style>
