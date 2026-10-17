import generatedAliases from '../../generated/codex-aliases.json'

const FALLBACK_PATH = '/lattice'
const READER_PATHS = { '/': '/lattice', '/about': '/', '/search': '/search' }
const CODEX_PATH = /^\/codex\/([^/]+)\/?$/

// Maps codex ids and return paths from a handoff onto this site's current lattice
export function createResolver(currentIds, aliases = generatedAliases) {
  const current = new Set(currentIds)

  const codexId = (id) => {
    if (typeof id !== 'string') return null
    if (current.has(id)) return id
    const alias = aliases[id]
    return alias && current.has(alias) ? alias : null
  }

  // Only same-site paths: one leading slash, and a URL that stays on this origin
  const path = (to, src) => {
    if (typeof to !== 'string' || !/^\/(?![/\\])/.test(to)) return FALLBACK_PATH
    let url
    try {
      url = new URL(to, 'http://local')
    } catch {
      return FALLBACK_PATH
    }
    if (url.origin !== 'http://local') return FALLBACK_PATH

    const codex = url.pathname.match(CODEX_PATH)
    if (codex) {
      const id = codexId(decodeURIComponent(codex[1]))
      return id ? `/codex/${id}` : FALLBACK_PATH
    }
    if (src === 'reader') return READER_PATHS[url.pathname] ?? FALLBACK_PATH
    if (url.pathname.replace(/\/+$/, '') === '/import') return FALLBACK_PATH
    return url.pathname + url.search
  }

  return { codexId, path }
}
