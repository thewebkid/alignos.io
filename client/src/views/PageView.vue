<script setup>
// PageView — James' framing pages from client/src/content/pages/{slug}.md.
// Route meta: page (slug), layout ('threshold' | 'standard'), next (onward action).
// A `markdown` prop replaces the slug lookup (ReviewView).
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import PromptBlock from '../components/PromptBlock.vue'
import CollectionList from '../components/CollectionList.vue'
import { parsePageMarkdown } from '../lib/markdown.js'

const pages = import.meta.glob('../content/pages/*.md', { query: '?raw', import: 'default', eager: true })

const props = defineProps({ markdown: { type: String, default: null } })

const route = useRoute()
const router = useRouter()

const source = computed(() => props.markdown ?? pages[`../content/pages/${route.meta.page}.md`] ?? '')
const segments = computed(() => parsePageMarkdown(source.value))
const layout = computed(() => route.meta.layout ?? 'standard')
const next = computed(() => route.meta.next ?? null)

// Files (/pdf/…, /llms.txt, /bundles/….md) load normally; only app routes go through the router
const isInternal = (href) => href?.startsWith('/') && !/\.[a-z0-9]+$/i.test(href.split(/[?#]/)[0])

// Internal links inside rendered markdown navigate with the router
const handleContentClick = (e) => {
  const link = e.target.closest('a')
  if (!link) return
  const href = link.getAttribute('href')
  if (isInternal(href) && !e.metaKey && !e.ctrlKey && !e.shiftKey) {
    e.preventDefault()
    router.push(href)
  }
}
</script>

<template>
  <article class="page-view" :class="`page-view--${layout}`">
    <div class="container">
      <div class="page-column" @click="handleContentClick">
        <template v-for="(segment, i) in segments" :key="i">
          <div v-if="segment.type === 'html'" class="page-prose" v-html="segment.html"></div>
          <PromptBlock v-else-if="segment.type === 'prompt'" :text="segment.text" />
          <CollectionList v-else-if="segment.type === 'collection'" :id="segment.id" />
        </template>

        <nav v-if="next" class="page-next">
          <RouterLink :to="next.to" class="page-next-primary">{{ next.label }}</RouterLink>
          <div v-if="next.secondary?.length" class="page-next-secondary">
            <RouterLink v-for="s in next.secondary" :key="s.label" :to="s.to">{{ s.label }}</RouterLink>
          </div>
        </nav>
      </div>
    </div>
  </article>
</template>

<style lang="scss" scoped>
.page-view {
  padding: 3.5rem 0 6rem;
}

.page-column {
  max-width: 720px;
  margin: 0 auto;
}

.page-view--threshold .page-column {
  max-width: 34rem;
}

.page-prose {
  color: var(--cl-text);
  font-size: 1.0625rem;
  line-height: 1.8;

  :deep(h1) {
    font-family: var(--bs-font-serif);
    font-size: clamp(2.125rem, 5vw, 2.75rem);
    font-weight: 500;
    line-height: 1.3;
    color: var(--cl-text-heading);
    margin: 0 0 1.75rem;
  }

  :deep(h2) {
    font-family: var(--bs-font-serif);
    font-size: 1.625rem;
    font-weight: 500;
    color: var(--cl-text-heading);
    margin: 3rem 0 1rem;
  }

  :deep(h3) {
    font-family: var(--bs-font-serif);
    font-size: 1.3125rem;
    font-weight: 500;
    font-style: italic;
    color: var(--cl-text-heading);
    margin: 2.25rem 0 0.875rem;
  }

  :deep(h4) {
    font-family: var(--bs-font-serif);
    font-size: 1.1875rem;
    font-weight: 500;
    color: var(--cl-text-heading);
    margin: 2rem 0 0.75rem;
  }

  :deep(p) {
    margin: 0 0 1rem;
  }

  :deep(strong) {
    color: var(--cl-text-heading);
    font-weight: 600;
  }

  // Prose links only; styled links from embedded components keep their own colors.
  :deep(a:not([class])) {
    color: var(--cl-primary);

    &:hover {
      color: var(--cl-primary-hover);
    }
  }

  :deep(blockquote) {
    margin: 2.5rem 0;
    padding-left: 1.25rem;
    border-left: 3px solid var(--cl-accent);
    font-family: var(--bs-font-serif);
    font-size: 1.125rem;
    font-style: italic;
    line-height: 1.7;
    color: var(--cl-text-muted);
  }

  :deep(ul),
  :deep(ol) {
    margin: 0 0 1rem;
    padding-left: 1.25rem;
  }

  :deep(li) {
    margin-bottom: 0.375rem;
  }

  :deep(li::marker) {
    color: var(--cl-accent);
  }
}

// Threshold: a left-aligned serif column. Each poetic line is its own paragraph, so paragraph
// spacing stays tight and sections are separated by the h2 top margin instead.
.page-view--threshold .page-prose {
  font-family: var(--bs-font-serif);
  font-size: 1.1875rem;
  line-height: 1.7;

  :deep(h2) {
    margin: 3.25rem 0 1.125rem;
    font-size: 1.5rem;

    &::before {
      content: '';
      display: block;
      width: 18px;
      height: 18px;
      margin: 0 0 0.75rem;
      background: url('/brand/alignos-spiral-72.png') center / contain no-repeat;
    }
  }

  // Arc of Difference tones: an h4 followed by its italic subline paragraph
  :deep(h4) {
    margin: 1.625rem 0 0.125rem;
    font-size: 1.125rem;
  }

  :deep(h4 + p) {
    color: var(--cl-text-muted);
  }

  :deep(p) {
    margin-bottom: 0.625rem;
  }

  :deep(ul) {
    list-style: none;
    padding-left: 0;
  }

  :deep(li) {
    margin-bottom: 0.125rem;
  }
}

// Onward action
.page-next {
  margin-top: 4rem;
  padding-top: 2.25rem;
  border-top: 1px solid var(--cl-border-light);
}

.page-next-primary {
  display: inline-flex;
  align-items: center;
  max-width: 100%;
  padding: 0.8125rem 1.75rem;
  background: var(--cl-primary);
  color: white;
  border-radius: var(--bs-border-radius-lg);
  text-decoration: none;
  font-weight: 500;
  line-height: 1.45;
  transition: background 0.2s ease;

  &:hover {
    background: var(--cl-primary-hover);
    color: white;
  }
}

.page-next-secondary {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem 1.5rem;
  margin-top: 1.125rem;
  font-size: 0.9375rem;

  a {
    color: var(--cl-primary);
  }
}
</style>
