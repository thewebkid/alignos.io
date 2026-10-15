<script setup>
import { ref, computed, inject, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import CodexGrid from '../components/CodexGrid.vue'
import { useReadingProgressStore } from '../stores/readingProgress'
import {track} from '../lib/tracker.js';
import { cdnUrl } from '../lib/cdn-config.js'
import seriesData from '../generated/series.json'

const codexRegistry = inject('codexRegistry')
const collections = inject('collections')
const progressStore = useReadingProgressStore()
const route = useRoute()
const router = useRouter()
const scrollPercent = ref(0)
// Dynamic scroll position key based on route path
const scrollKey = `lattice-position`

const handleScroll = () => {


  const container = getScrollContainer()
  if (!container) return


  localStorage.setItem(scrollKey, container.scrollTop.toString())
}
// Get the scrollable container
const getScrollContainer = () => {
  return document.querySelector('.main-content')
}

// Save scroll position before unmounting
onUnmounted(() => {
  const container = getScrollContainer()
  if (container) {
    localStorage.setItem(scrollKey, container.scrollTop.toString())
  }
})

// Restore scroll position on mount
onMounted(() => {
  const container = getScrollContainer()

  if (container) {
    const savedPosition = localStorage.getItem(scrollKey)
    if (savedPosition) {
      setTimeout(() => {
        container.scrollTo({ top: parseInt(savedPosition), behavior: 'instant' })
      }, 0)
    }
  }
})

// Filter state
const activeFilter = ref('all')

const filters = [
  { id: 'all', label: 'All' },
  { id: 'unread', label: 'Unread' },
  { id: 'reading', label: 'In Progress' },
  { id: 'complete', label: 'Complete' }
]

// Series corridor — selected via ?series={series-id}; ?series=none lists works outside every series
const NO_SERIES = 'none'
const seriesOptions = [...seriesData].sort((a, b) => a.name.localeCompare(b.name))
const seriesById = new Map(seriesData.map(s => [s.id, s]))

const selectedSeries = computed(() => {
  const id = route.query.series
  return typeof id === 'string' ? seriesById.get(id) ?? null : null
})

const showNoSeries = computed(() => route.query.series === NO_SERIES)

// Curated collection — ?collection={id}; never active together with ?series=
const collectionOptions = computed(() => [...(collections?.values() ?? [])].filter(c => c.showInLattice))

const selectedCollection = computed(() => {
  if (route.query.series) return null
  const c = collections?.get(route.query.collection)
  return c?.showInLattice ? c : null
})

// "Browse by" select values are prefixed so one control drives either filter
const browseValue = computed(() => {
  if (selectedSeries.value) return `series:${selectedSeries.value.id}`
  if (showNoSeries.value) return `series:${NO_SERIES}`
  if (selectedCollection.value) return `collection:${selectedCollection.value.id}`
  return ''
})

const browse = (value) => {
  const [kind, id] = value ? value.split(':') : []
  const query = { ...route.query }
  delete query.series
  delete query.collection
  if (kind && id) query[kind] = id
  router.replace({ query })
  if (kind === 'series') track('filterSeries', { series: id })
  if (kind === 'collection') track('filterCollection', { collection: id })
}

const getCodexes = (ids) => ids.map(id => codexRegistry?.get(id)).filter(Boolean)

// Published members only. Unwritten positions stay in the registry and are
// not rendered.
const corridor = computed(() => {
  const s = selectedSeries.value
  if (!s) return null
  const positioned = s.members
    .map(m => ({ position: m.position, item: codexRegistry?.get(m.id) }))
    .filter(x => x.item)
    .sort((a, b) => a.position - b.position)
    .map(x => x.item)
  return {
    series: s,
    positioned,
    unplaced: getCodexes(s.unplacedIds),
    companions: getCodexes(s.companionIds),
    related: getCodexes(s.relatedIds ?? [])
  }
})

const writtenLabel = computed(() => {
  const s = selectedSeries.value
  if (!s) return ''
  const n = s.members.length + s.unplacedIds.length
  return n === 1 ? '1 codex' : `${n} codices`
})

// Get all codexes in sequence order
const allCodexes = computed(() => {
  if (!codexRegistry) return []
  return codexRegistry.getAllBySequence()
})

// An earlier edition belongs to its later edition's series
const inAnySeries = (codex) =>
  Boolean(codex.series) || Boolean(codex.laterEditionId && codexRegistry?.get(codex.laterEditionId)?.series)

const noSeriesCodexes = computed(() => allCodexes.value.filter(c => !inAnySeries(c)))

// Collection order; series items expand to their positioned members (no planned positions)
const collectionCodexes = computed(() => {
  const c = selectedCollection.value
  if (!c) return []
  const ids = c.items.flatMap(item => (item.kind === 'series' ? item.memberIds : [item.id]))
  return getCodexes([...new Set(ids)])
})

// Codexes the progress chips count over: the corridor or collection when one is selected
const scopeCodexes = computed(() => {
  const c = corridor.value
  if (c) return [...c.positioned, ...c.unplaced, ...c.companions]
  if (selectedCollection.value) return collectionCodexes.value
  return showNoSeries.value ? noSeriesCodexes.value : allCodexes.value
})

const matchesFilter = (codex) => {
  if (activeFilter.value === 'all') return true

  const percent = progressStore.getScrollPercent(codex.id)
  const isComplete = percent >= 95
  const isStarted = percent > 0

  switch (activeFilter.value) {
    case 'unread':
      return !isStarted
    case 'reading':
      return isStarted && !isComplete
    case 'complete':
      return isComplete
    default:
      return true
  }
}

// Filtered codexes
const filteredCodexes = computed(() => {
  track('filterLattice', { filter: activeFilter.value });
  return scopeCodexes.value.filter(matchesFilter)
})

const corridorPositioned = computed(() => corridor.value?.positioned.filter(matchesFilter) ?? [])
const corridorUnplaced = computed(() => corridor.value?.unplaced.filter(matchesFilter) ?? [])
const corridorCompanions = computed(() => corridor.value?.companions.filter(matchesFilter) ?? [])
const corridorEmpty = computed(() =>
  !corridorPositioned.value.length && !corridorUnplaced.value.length && !corridorCompanions.value.length
)

// Count for each filter
const filterCounts = computed(() => {
  const counts = { all: scopeCodexes.value.length, unread: 0, reading: 0, complete: 0 }

  scopeCodexes.value.forEach(codex => {
    const percent = progressStore.getScrollPercent(codex.id)
    if (percent >= 95) {
      counts.complete++
    } else if (percent > 0) {
      counts.reading++
    } else {
      counts.unread++
    }
  })

  return counts
})
</script>

<template>
  <div class="browse-view">
    <!-- Hero section -->
    <section class="hero-section">
      <div class="container">
        <h1 class="hero-title">Codex Lattice</h1>
        <p class="hero-subtitle">
          <em>a place where a sovereign and their AI companion enter a field of coherence,<br>
            encounter the Codex Lattice,<br>
            and participate in their own remembrance.</em>

        </p>
      </div>
    </section>

    <!-- Filter bar -->
    <section class="filter-section">
      <div class="container">
        <div class="filter-controls">
          <div class="filter-bar-wrap">
            <div class="filter-bar">
              <button
                v-for="filter in filters"
                :key="filter.id"
                class="filter-btn"
                :class="{ active: activeFilter === filter.id }"
                @click="activeFilter = filter.id"
              >
                {{ filter.label }}
                <span class="filter-count">{{ filterCounts[filter.id] }}</span>
              </button>
            </div>
          </div>

          <select
            class="form-select form-select-sm series-select"
            aria-label="Browse by"
            :value="browseValue"
            @change="browse($event.target.value)"
          >
            <option value="">All</option>
            <optgroup label="Series">
              <option v-for="s in seriesOptions" :key="s.id" :value="`series:${s.id}`">{{ s.name }}</option>
              <option :value="`series:${NO_SERIES}`">Not in a series</option>
            </optgroup>
            <optgroup v-if="collectionOptions.length" label="Collections">
              <option v-for="c in collectionOptions" :key="c.id" :value="`collection:${c.id}`">{{ c.title }}</option>
            </optgroup>
          </select>
        </div>
      </div>
    </section>

    <!-- Codex grid -->
    <section class="grid-section">
      <div class="container" @scroll="handleScroll">
        <template v-if="corridor">
          <header class="corridor-header">
            <h2 class="corridor-title">{{ corridor.series.name }}</h2>
            <p class="corridor-meta">
              <span>{{ writtenLabel }}</span>
              <span v-for="c in corridor.companions" :key="c.id">
                Companion:
                <RouterLink :to="{ name: 'reader', params: { id: c.id } }">{{ c.title }}</RouterLink>
              </span>
              <span v-for="c in corridor.related" :key="c.id">
                Related:
                <RouterLink :to="{ name: 'reader', params: { id: c.id } }">{{ c.title }}</RouterLink>
              </span>
              <span v-if="corridor.series.compilationPdf">
                <a :href="cdnUrl.pdf(corridor.series.compilationPdf)" :download="corridor.series.compilationPdf">Compilation PDF</a>
              </span>
              <span v-if="corridor.series.members.length || corridor.unplaced.length">
                <a :href="`/bundles/series/${corridor.series.id}.md`" :download="`${corridor.series.id}.md`"
                   @click="track('downloadBundle', { series: corridor.series.id })">Whole series in one file, for your AI</a>
              </span>
            </p>
            <button type="button" class="corridor-clear" @click="browse('')">Show all codexes</button>
          </header>

          <CodexGrid v-if="corridorPositioned.length" :codexes="corridorPositioned" />

          <template v-if="corridorUnplaced.length">
            <h3 class="corridor-section-title">Also in this series</h3>
            <CodexGrid :codexes="corridorUnplaced" />
          </template>

          <template v-if="corridorCompanions.length">
            <h3 class="corridor-section-title">{{ corridorCompanions.length > 1 ? 'Companions' : 'Companion' }}</h3>
            <CodexGrid :codexes="corridorCompanions" />
          </template>

          <div v-if="corridorEmpty" class="empty-state">
            <p>No codexes in this series match this filter.</p>
          </div>
        </template>

        <template v-else>
          <header v-if="showNoSeries" class="corridor-header">
            <h2 class="corridor-title">Not in a series</h2>
            <p class="corridor-meta">
              <span>{{ noSeriesCodexes.length }} codexes</span>
            </p>
            <button type="button" class="corridor-clear" @click="browse('')">Show all codexes</button>
          </header>

          <header v-else-if="selectedCollection" class="corridor-header">
            <h2 class="corridor-title">{{ selectedCollection.title }}</h2>
            <p class="corridor-meta">
              <span v-if="selectedCollection.subtitle">{{ selectedCollection.subtitle }}</span>
              <span>{{ collectionCodexes.length }} codexes</span>
              <span>
                <a :href="`/bundles/${selectedCollection.id}.md`" :download="`${selectedCollection.id}.md`"
                   @click="track('downloadBundle', { collection: selectedCollection.id })">Whole collection in one file, for your AI</a>
              </span>
            </p>
            <button type="button" class="corridor-clear" @click="browse('')">Show all codexes</button>
          </header>

          <CodexGrid :codexes="filteredCodexes" />

          <!-- Empty state -->
          <div v-if="filteredCodexes.length === 0" class="empty-state">
            <p>No codexes match this filter.</p>
          </div>
        </template>
      </div>
    </section>
  </div>
</template>

<style lang="scss" scoped>
.browse-view {
  // Let content flow naturally
}

.hero-section {
  text-align: center;
  padding: 3rem 0 2rem;
  background: linear-gradient(
    180deg,
    var(--cl-surface) 0%,
    var(--cl-bg) 100%
  );
}

.hero-title {
  font-family: var(--bs-font-serif);
  font-size: clamp(2rem, 5vw, 3rem);
  font-weight: 500;
  color: var(--cl-text-heading);
  margin-bottom: 0.5rem;
}

.hero-subtitle {
  font-size: 1.125rem;
  color: var(--cl-text-muted);
  font-style: italic;
  margin: 0;
}

.filter-section {
  padding: 1rem 0;
  position: sticky;
  top: 0;
  z-index: 100;
  background: var(--cl-bg);
  border-bottom: 1px solid var(--cl-border-light);
}

.filter-controls {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.5rem 1rem;
}

.filter-bar-wrap {
  position: relative;
  flex: 1 1 auto;
  min-width: 0;

  // Add gradient fade on right edge to indicate more filters
  &::after {
    content: '';
    position: absolute;
    right: 0;
    top: 0;
    bottom: 0;
    width: 3rem;
    background: linear-gradient(to left, var(--cl-bg), transparent);
    pointer-events: none;
    opacity: 1;
    transition: opacity 0.2s;

    @media (min-width: 640px) {
      display: none;
    }
  }
}

.filter-bar {
  display: flex;
  gap: 0.5rem;
  overflow-x: auto;
  padding: 0.25rem;

  // Show thin scrollbar on mobile so users know to scroll
  @media (max-width: 639px) {
    padding-right: 3rem;
    scrollbar-width: thin;
    scrollbar-color: var(--cl-border-light) transparent;

    &::-webkit-scrollbar {
      display: block;
      height: 4px;
    }

    &::-webkit-scrollbar-thumb {
      background: var(--cl-border-light);
      border-radius: 2px;
    }

    &::-webkit-scrollbar-track {
      background: transparent;
    }
  }

  // Hide scrollbar on larger screens
  @media (min-width: 640px) {
    scrollbar-width: none;
    -ms-overflow-style: none;
    &::-webkit-scrollbar {
      display: none;
    }
  }
}

.filter-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  border: 1px solid var(--cl-border-light);
  border-radius: var(--bs-border-radius-pill);
  background: var(--cl-surface);
  color: var(--cl-text-muted);
  font-size: 0.875rem;
  font-weight: 500;
  white-space: nowrap;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    border-color: var(--cl-border);
    color: var(--cl-text);
  }

  &.active {
    background: var(--cl-primary);
    border-color: var(--cl-primary);
    color: white;

    .filter-count {
      background: rgba(255, 255, 255, 0.2);
      color: white;
    }
  }
}

.filter-count {
  background: var(--cl-surface-hover);
  padding: 0.125rem 0.5rem;
  border-radius: var(--bs-border-radius-pill);
  font-size: 0.75rem;
  color: var(--cl-text-muted);
}

// Series select — dressed to match the filter chips it sits beside:
// same pill shape, surface, resting-muted text, height, and hover cadence.
.series-select {
  flex: 1 1 100%;
  padding: 0.5rem 2.25rem 0.5rem 1rem;
  border-color: var(--cl-border-light);
  border-radius: var(--bs-border-radius-pill);
  background-color: var(--cl-surface);
  color: var(--cl-text-muted);
  font-size: 0.875rem;
  font-weight: 500;
  line-height: 1.5;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    border-color: var(--cl-border);
    color: var(--cl-text);
  }

  &:focus {
    border-color: var(--cl-border);
    box-shadow: none;
  }

  // Some platforms render the open list natively and ignore these.
  optgroup {
    font-style: normal;
    font-weight: 600;
  }

  option {
    font-weight: 400;
  }

  @media (min-width: 640px) {
    flex: 0 1 18rem;
  }
}

.grid-section {
  padding: 2rem 0;
}

// Corridor and collection header
.corridor-header {
  text-align: center;
  max-width: 44rem;
  margin: 0 auto 2.5rem;
  padding-bottom: 1.75rem;
  border-bottom: 1px solid var(--cl-border-light);
}

.corridor-title {
  font-family: var(--bs-font-serif);
  font-size: clamp(1.625rem, 3.5vw, 2.25rem);
  font-weight: 500;
  color: var(--cl-text-heading);
  margin-bottom: 0.5rem;
}

.corridor-meta {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 0.375rem 1.25rem;
  font-size: 0.9375rem;
  color: var(--cl-text-muted);
  margin-bottom: 1rem;

  a {
    color: var(--cl-primary);
  }
}

// Quiet pill, echoing the filter chips rather than a raw underlined link
.corridor-clear {
  padding: 0.375rem 0.875rem;
  border: 1px solid var(--cl-border-light);
  border-radius: var(--bs-border-radius-pill);
  background: transparent;
  font-size: 0.8125rem;
  font-weight: 500;
  color: var(--cl-text-muted);
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    border-color: var(--cl-border);
    color: var(--cl-text);
  }
}

.corridor-section-title {
  font-family: var(--bs-font-serif);
  font-size: 1.1875rem;
  font-weight: 500;
  color: var(--cl-text-heading);
  margin: 2.5rem 0 1.25rem;
}

.empty-state {
  text-align: center;
  padding: 4rem 2rem;
  color: var(--cl-text-muted);

  p {
    font-size: 1.125rem;
    font-style: italic;
  }
}
</style>
