<script setup>
// ReviewView — James' review documents from docs/review/{name}.md (route meta: review).
// Only reachable when built with ALIGNOS_REVIEW=1; see router.
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useHead } from '@unhead/vue'
import PageView from './PageView.vue'

const docs = import.meta.glob('../../../docs/review/*.md', { query: '?raw', import: 'default', eager: true })

const route = useRoute()
const markdown = computed(() => docs[`../../../docs/review/${route.meta.review}.md`] ?? '')

useHead({ meta: [{ name: 'robots', content: 'noindex, nofollow' }] })
</script>

<template>
  <PageView :markdown="markdown" />
</template>
