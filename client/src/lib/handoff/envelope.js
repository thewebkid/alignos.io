// The handoff document carried in an /import link's fragment. The legacy reader vendors the encoding
// half of this file (c:\src\alignos), so the wire format can't change without a new version.
import { mergeProgress, roundFraction } from '../progress.js'

export const HANDOFF_KIND = 'alignos-progress'
export const HANDOFF_VERSION = 1
const SOURCES = ['reader', 'alignos.io']
const THEMES = ['light', 'dark', 'system']

export class HandoffError extends Error {}

// progress: { [id]: { furthest, position, lastRead } } -> tuples [furthest, position | null, lastRead seconds]
export function buildDocument({ src, lattice, progress, theme = null, to = null, now = Date.now() }) {
  const tuples = {}
  for (const [id, entry] of Object.entries(progress)) {
    const position = entry.position === entry.furthest ? null : entry.position
    tuples[id] = [entry.furthest, position, Math.floor(Date.parse(entry.lastRead) / 1000)]
  }
  const doc = { kind: HANDOFF_KIND, v: HANDOFF_VERSION, src, lattice, exportedAt: Math.floor(now / 1000) }
  if (theme) doc.theme = theme
  if (to) doc.to = to
  doc.progress = tuples
  return doc
}

const toBase64Url = (bytes) => {
  let binary = ''
  for (const b of bytes) binary += String.fromCharCode(b)
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

const fromBase64Url = (text) => {
  const binary = atob(text.replace(/-/g, '+').replace(/_/g, '/'))
  return Uint8Array.from(binary, (c) => c.charCodeAt(0))
}

const pipe = async (bytes, transform) => {
  const stream = new Blob([bytes]).stream().pipeThrough(transform)
  return new Uint8Array(await new Response(stream).arrayBuffer())
}

const canCompress = () => typeof CompressionStream === 'function' && typeof DecompressionStream === 'function'

// Returns the fragment without '#': `z=` deflate-raw + base64url, or `j=` base64url JSON
export async function encodeDocument(doc, { compress = canCompress() } = {}) {
  const bytes = new TextEncoder().encode(JSON.stringify(doc))
  if (compress) return `z=${toBase64Url(await pipe(bytes, new CompressionStream('deflate-raw')))}`
  return `j=${toBase64Url(bytes)}`
}

export const handoffLink = (origin, fragment) => `${origin.replace(/\/+$/, '')}/import#${fragment}`

// Accepts a whole link, a '#z=…' fragment, or the bare 'z=…'
export const findFragment = (text) => {
  const match = typeof text === 'string' && text.trim().match(/(?:^|[#&])([zj])=([A-Za-z0-9_-]+)/)
  return match ? { format: match[1], data: match[2] } : null
}

export async function decodeDocument(text) {
  const found = findFragment(text)
  if (!found) throw new HandoffError('No handoff in this link')
  let json
  try {
    const bytes = fromBase64Url(found.data)
    if (found.format === 'z') {
      if (typeof DecompressionStream !== 'function') throw new HandoffError('This browser can’t read compressed links')
      json = new TextDecoder().decode(await pipe(bytes, new DecompressionStream('deflate-raw')))
    } else {
      json = new TextDecoder().decode(bytes)
    }
    return parseDocument(JSON.parse(json))
  } catch (error) {
    if (error instanceof HandoffError) throw error
    throw new HandoffError('The link is damaged or incomplete')
  }
}

const toEntry = (tuple) => {
  if (!Array.isArray(tuple) || tuple.length < 3) return null
  const [furthest, position, seconds] = tuple
  if (!Number.isFinite(furthest) || !Number.isFinite(seconds) || seconds <= 0) return null
  if (position !== null && !Number.isFinite(position)) return null
  const lastRead = new Date(seconds * 1000)
  if (Number.isNaN(lastRead.getTime())) return null
  const f = roundFraction(furthest)
  return { furthest: f, position: position === null ? f : roundFraction(position), lastRead: lastRead.toISOString() }
}

export function parseDocument(doc) {
  if (!doc || doc.kind !== HANDOFF_KIND) throw new HandoffError('Not an Alignos reading link')
  if (doc.v !== HANDOFF_VERSION) throw new HandoffError('This link was made by a newer version of Alignos')
  if (!SOURCES.includes(doc.src)) throw new HandoffError('Not an Alignos reading link')
  const raw = doc.progress && typeof doc.progress === 'object' && !Array.isArray(doc.progress) ? doc.progress : {}

  const progress = {}
  let skipped = 0
  for (const [id, tuple] of Object.entries(raw)) {
    const entry = toEntry(tuple)
    if (entry) progress[id] = entry
    else skipped++
  }

  return {
    src: doc.src,
    lattice: typeof doc.lattice === 'string' ? doc.lattice : null,
    exportedAt: Number.isFinite(doc.exportedAt) ? doc.exportedAt : null,
    theme: THEMES.includes(doc.theme) ? doc.theme : null,
    to: typeof doc.to === 'string' ? doc.to : null,
    progress,
    skipped
  }
}

// Moves a parsed document's progress onto current codex ids; entries for unknown codices are skipped
export function resolveDocument(parsed, resolver) {
  let progress = {}
  let skipped = parsed.skipped
  for (const [id, entry] of Object.entries(parsed.progress)) {
    const current = resolver.codexId(id)
    if (!current) {
      skipped++
      continue
    }
    progress = mergeProgress(progress, { [current]: entry })
  }
  return { progress, skipped, theme: parsed.theme, to: resolver.path(parsed.to, parsed.src) }
}
