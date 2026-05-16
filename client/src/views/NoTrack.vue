<template>
  <div class="container mt-5 text-center">
    <div class="row justify-content-center">
      <div class="col-md-8">
        <h1 class="mb-4">Tracking Disabled</h1>
        <p class="lead">
          Analytics tracking has been disabled for your browser.
        </p>
        <p class="text-muted">
          Redirecting to home page...
        </p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

onMounted(() => {
  // Set the notrack flag in localStorage
  localStorage.setItem('notrack', 'true')
  
  // Disable window.umami if it exists
  if (typeof window.umami !== 'undefined') {
    window.umami = null
  }
  
  console.log('🚫 Analytics tracking disabled')
  
  // Redirect to home after a brief moment
  setTimeout(() => {
    router.push('/')
  }, 1500)
})
</script>

<style scoped>
.container {
  min-height: 50vh;
}
</style>
