import { ViteSSG } from 'vite-ssg'
import { createPinia } from 'pinia'
import { createBootstrap } from 'bootstrap-vue-next'
import { inject as injectAnalytics } from '@vercel/analytics'
import { trackingDisabled } from './lib/tracker.js'

// Import SCSS with Bootstrap theme customization
import './assets/scss/main.scss'

import App from './App.vue'
import routes from './router'

// Codex Lattice imports
import { CodexRegistry } from './lib/codex-registry.js'
import { BrowserCodex } from './lib/codex-browser.js'
import { createGlossaryFromRegistry } from './lib/glossary.js'

// Export for vite-ssg
export const createApp = ViteSSG(
  App,
  { routes },
  async ({ app, router, routes, isClient, initialState }) => {
    // SSG (server-side) needs full content for pre-rendering
    // Client-side loads metadata only initially, full lattice loads in App.vue
    const latticeType = isClient ? 'metadata only (full loads in App.vue)' : 'full content for SSG'
    console.log(`🔮 Initializing Codex Lattice (${latticeType})...`)

    let latticeData
    if (isClient) {
      // Client-side: load metadata-only initially (127 KB)
      // Full lattice will be loaded asynchronously in App.vue for search
      const module = await import('./generated/codex-lattice-meta.json')
      latticeData = module.default
    } else {
      // SSG build: load full lattice (3.3 MB) - only used during pre-rendering
      const module = await import('./generated/codex-lattice.json')
      latticeData = module.default
    }

    const codexRegistry = new CodexRegistry().loadFromData(latticeData, BrowserCodex)
    const glossaryManager = createGlossaryFromRegistry(codexRegistry)

    console.log(`✨ Loaded ${codexRegistry.size} codexes`)
    console.log(`📚 ${codexRegistry.getSeriesNames().length} series detected`)
    console.log(`📖 ${glossaryManager.size} glossary terms loaded`)

    // Setup plugins
    const pinia = createPinia()
    app.use(pinia)
    app.use(createBootstrap())

    // Provide the registry and glossary to all components
    app.provide('codexRegistry', codexRegistry)
    app.provide('glossaryManager', glossaryManager)

    // Also make them available globally for debugging (client-side only)
    if (isClient && typeof window !== 'undefined') {
      window.codexRegistry = codexRegistry
      window.glossaryManager = glossaryManager

      if (!trackingDisabled()) {
        injectAnalytics({
          beforeSend(event) {
            if (trackingDisabled()) return null
            return event
          },
        })
      }
    }
  }
)
