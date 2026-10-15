<script setup>
import { useRoute } from 'vue-router'

const route = useRoute()
</script>

<template>
  <section class="page-pending container py-5">
    <h1>{{ route.meta.title || 'Alignos' }}</h1>
  </section>
</template>
