import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'
import fs from 'fs'

const codexLatticeData = JSON.parse(
  fs.readFileSync(resolve(__dirname, 'src/generated/codex-lattice.json'), 'utf-8')
)

const codexRoutes = codexLatticeData.map(codex => `/codex/${codex.id}`)

export default defineConfig({
  plugins: [
    vue(),
  ],
  css: {
    preprocessorOptions: {
      scss: {
        silenceDeprecations: [
          'import',
          'if-function',
          'global-builtin',
          'color-functions'
        ],
      },
    },
  },
  ssgOptions: {
    script: 'async',
    formatting: 'minify',
    crittersOptions: {
      reduceInlineStyles: false,
    },
    includedRoutes(paths, routes) {
      console.log(`Generating ${codexRoutes.length} codex pages...`)
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
