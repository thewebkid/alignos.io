import { defineConfig, searchForWorkspaceRoot } from 'vite'
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
  // Off unless ALIGNOS_REVIEW=1: the review routes and their text drop out of the build.
  define: {
    __ALIGNOS_REVIEW__: JSON.stringify(process.env.ALIGNOS_REVIEW === '1'),
  },
  server: {
    fs: {
      allow: [searchForWorkspaceRoot(process.cwd()), resolve(__dirname, '../docs/review')],
    },
  },
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
    includedRoutes(paths) {
      const staticPaths = paths.filter((p) => !p.includes(':') && !p.includes('*'))
      console.log(`Generating ${staticPaths.length} static pages and ${codexRoutes.length} codex pages...`)
      return [...staticPaths, ...codexRoutes]
    },
  },
})
