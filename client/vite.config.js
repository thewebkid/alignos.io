import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'
import fs from 'fs'

// Read codex lattice to generate all routes for SSG
const codexLatticeData = JSON.parse(
  fs.readFileSync(resolve(__dirname, 'src/generated/codex-lattice.json'), 'utf-8')
)

// Generate all codex routes
const codexRoutes = codexLatticeData.map(codex => `/codex/${codex.id}`)

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    // Serve md folder for cover images
    {
      name: 'serve-md-folder',
      configureServer(server) {
        server.middlewares.use('/md', (req, res, next) => {
          const filePath = resolve(__dirname, 'md', req.url.slice(1))
          import('fs').then(fs => {
            if (fs.existsSync(filePath)) {
              const stream = fs.createReadStream(filePath)
              const ext = filePath.split('.').pop().toLowerCase()
              const mimeTypes = {
                jpg: 'image/jpeg',
                jpeg: 'image/jpeg',
                png: 'image/png',
                gif: 'image/gif',
                webp: 'image/webp',
                md: 'text/markdown'
              }
              res.setHeader('Content-Type', mimeTypes[ext] || 'application/octet-stream')
              stream.pipe(res)
            } else {
              next()
            }
          })
        })
      }
    }
  ],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
    },
    fs: {
      // Allow serving files from md and codex-content directories
      allow: ['..', 'md', 'public/codex-content']
    }
  },
  css: {
    preprocessorOptions: {
      scss: {
        // Silence deprecation warnings from Bootstrap
        // These warnings come from Bootstrap's internal code and will be fixed in Bootstrap 6
        silenceDeprecations: [
          'import',
          'if-function',
          'global-builtin',
          'color-functions'
        ],
      },
    },
  },
  // vite-ssg configuration
  ssgOptions: {
    script: 'async',
    formatting: 'minify',
    crittersOptions: {
      reduceInlineStyles: false,
    },
    includedRoutes(paths, routes) {
      // Generate all 133+ codex routes for production
      console.log(`📝 Generating ${codexRoutes.length} codex pages...`)
      return [
        '/',
        '/search',
        '/faq',
        '/about',
        ...codexRoutes
      ]
    },
  },
})
