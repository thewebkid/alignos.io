<script setup>
// CollectionList — one curated collection from data/collections.json, in James'
// order with his labels, taglines, and notes. Codex items open the reader; series
// items open the corridor. PDFs are offered in the reader, not here.
import { computed, inject } from 'vue'
import { cdnUrl } from '../lib/cdn-config.js'
import { track } from '../lib/tracker.js'
import { useLatticeStateStore } from '../stores/latticeState.js'

const props = defineProps({
  id: {
    type: String,
    required: true
  }
})

const collections = inject('collections')
const codexRegistry = inject('codexRegistry')
const lattice = useLatticeStateStore()

const collection = computed(() => collections?.get(props.id) ?? null)

// Consecutive items that share a group render as one list in that group's style
const sections = computed(() => {
  const c = collection.value
  if (!c) return []
  const styles = new Map(c.groups.map(g => [g.id, g.style]))
  const out = []
  for (const item of c.items) {
    const last = out[out.length - 1]
    if (last && last.group === item.group) last.items.push(item)
    else out.push({ group: item.group, style: styles.get(item.group) ?? 'numbered', items: [item] })
  }
  return out
})

const thumbFor = (item) => {
  if (item.kind !== 'codex') return null
  const codex = codexRegistry?.get(item.id)
  if (codex?.coverThumb) return cdnUrl.thumb(codex.coverThumb)
  return null
}

const itemLink = (item) =>
  item.kind === 'series'
    ? { name: 'lattice', query: { series: item.id } }
    : { name: 'reader', params: { id: item.id } }

const seriesLink = (s) => ({ name: 'lattice', query: { series: s.id } })
const collectionLink = computed(() => ({ name: 'lattice', query: { collection: props.id } }))

const seriesLabel = (s) => (s.position && s.total ? `${s.name} · Part ${s.position} of ${s.total}` : s.name)

const paragraphs = (note) => (note ? note.split('\n\n') : [])
</script>

<template>
  <div v-if="collection" class="collection-list" :class="`collection-list--${collection.id}`">
    <component
      :is="section.style === 'numbered' ? 'ol' : 'ul'"
      v-for="(section, si) in sections"
      :key="si"
      class="collection-section"
      :class="`collection-section--${section.style}`"
    >
      <li v-for="item in section.items" :key="`${item.kind}-${item.id}`" class="collection-item">
        <RouterLink v-if="thumbFor(item)" :to="itemLink(item)" @click="lattice.primeLink(itemLink(item), $event)" class="item-thumb" tabindex="-1" aria-hidden="true">
          <img :src="thumbFor(item)" alt="" loading="lazy" />
        </RouterLink>

        <div class="item-body">
          <h3 class="item-title">
            <span v-if="section.style === 'star'" class="item-star" aria-hidden="true">✧ </span>
            <RouterLink :to="itemLink(item)" @click="lattice.primeLink(itemLink(item), $event)" class="cl-title-link">{{ item.label }}</RouterLink>
          </h3>

          <RouterLink
            v-if="item.series"
            :to="seriesLink(item.series)"
            class="item-series"
            @click="lattice.primeLink(seriesLink(item.series), $event)"
          >{{ seriesLabel(item.series) }}</RouterLink>

          <p v-if="item.tagline" class="item-tagline"><em>{{ item.tagline }}</em></p>
          <p v-for="(p, pi) in paragraphs(item.note)" :key="pi" class="item-note">{{ p }}</p>

          <div class="item-actions">
            <RouterLink :to="itemLink(item)" @click="lattice.primeLink(itemLink(item), $event)" class="cl-pill cl-pill--primary">
              {{ item.kind === 'series' ? 'View series' : 'Read' }}
            </RouterLink>
          </div>
        </div>
      </li>
    </component>

    <p v-if="collection.showInLattice" class="collection-lattice-link">
      <RouterLink :to="collectionLink" @click="lattice.primeLink(collectionLink, $event)">Browse these in the Codex Lattice</RouterLink>
    </p>

    <p v-if="collection.offerBundle" class="collection-bundle">
      <a
        :href="`/bundles/${collection.id}.md`"
        :download="`${collection.id}.md`"
        class="cl-pill"
        @click="track('downloadBundle', { collection: collection.id })"
      >All readings in one file, for your AI</a>
    </p>
  </div>
</template>

<style lang="scss" scoped>
.collection-list {
  margin: 2.5rem 0;
}

.collection-section {
  list-style: none;
  margin: 0 0 1.5rem;
  padding: 0;

  &--numbered {
    counter-reset: collection;

    .collection-item {
      counter-increment: collection;
    }

    .item-title::before {
      content: counter(collection) '. ';
      color: var(--cl-text-muted);
    }
  }
}

.collection-item {
  display: flex;
  gap: 1.125rem;
  padding: 1.5rem 0;
  border-bottom: 1px solid var(--cl-border-light);

  &:last-child {
    border-bottom: none;
  }
}

.item-thumb {
  flex: none;
  width: 80px;

  @media (max-width: 640px) {
    width: 64px;
  }

  img {
    display: block;
    width: 100%;
    aspect-ratio: 3 / 4;
    object-fit: cover;
    border-radius: var(--bs-border-radius);
    box-shadow: 0 2px 8px var(--cl-shadow);
  }
}

.item-body {
  min-width: 0;
  flex: 1;
}

.item-title {
  font-family: var(--bs-font-serif);
  font-size-adjust: none;
  font-size: 1.375rem;
  font-weight: 500;
  margin: 0 0 0.375rem;
}

.item-star {
  color: var(--cl-accent);
}

// Series badge: small gold type, same family as the tone marker
.item-series {
  display: inline-block;
  margin-bottom: 0.5rem;
  font-size: 0.8125rem;
  letter-spacing: 0.05em;
  color: var(--cl-accent);
  text-decoration: none;

  &:hover {
    color: var(--cl-accent-hover);
  }
}

.item-tagline {
  margin: 0 0 0.625rem;
  font-size: 1rem;
  color: var(--cl-text-muted);
}

.item-note {
  margin: 0 0 0.5rem;
  line-height: 1.75;
  color: var(--cl-text);
}

.item-actions {
  display: flex;
  gap: 0.625rem;
  margin-top: 1rem;
}

.collection-lattice-link {
  margin: 0.25rem 0 0;
  padding-top: 1.25rem;
  border-top: 1px solid var(--cl-border-light);
  font-size: 0.875rem;

  a {
    color: var(--cl-primary);
  }
}

.collection-bundle {
  margin: 1.25rem 0 0;
}
</style>
