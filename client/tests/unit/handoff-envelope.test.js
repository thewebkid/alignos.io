import { describe, expect, it } from 'vitest'
import {
  buildDocument, decodeDocument, encodeDocument, findFragment, handoffLink, parseDocument, resolveDocument, HandoffError
} from '../../src/lib/handoff/envelope.js'
import { createResolver } from '../../src/lib/handoff/resolve.js'

const TUE = '2026-10-13T10:00:00.000Z'
const progress = {
  'the-codex-of-listening': { furthest: 0.8, position: 0.5, lastRead: TUE },
  'bridge-between-chords': { furthest: 1, position: 1, lastRead: TUE }
}
const doc = buildDocument({ src: 'alignos.io', lattice: 'test', progress, theme: 'dark', to: '/faq', now: Date.parse(TUE) })

describe('handoff document', () => {
  it('writes compact tuples, leaving out a position equal to the furthest point', () => {
    expect(doc.progress).toEqual({
      'the-codex-of-listening': [0.8, 0.5, Date.parse(TUE) / 1000],
      'bridge-between-chords': [1, null, Date.parse(TUE) / 1000]
    })
    expect(doc).toMatchObject({ kind: 'alignos-progress', v: 1, src: 'alignos.io', theme: 'dark', to: '/faq' })
  })

  it('round-trips through the compressed encoding', async () => {
    const fragment = await encodeDocument(doc, { compress: true })
    expect(fragment.startsWith('z=')).toBe(true)
    const parsed = await decodeDocument(handoffLink('https://alignos.io', fragment))
    expect(parsed.progress).toEqual(progress)
    expect(parsed).toMatchObject({ src: 'alignos.io', theme: 'dark', to: '/faq', skipped: 0 })
  })

  it('round-trips through the uncompressed fallback', async () => {
    const fragment = await encodeDocument(doc, { compress: false })
    expect(fragment.startsWith('j=')).toBe(true)
    expect((await decodeDocument(`#${fragment}`)).progress).toEqual(progress)
  })

  it('finds the handoff in a whole link, a fragment, or the bare value', () => {
    expect(findFragment('https://alignos.io/import#z=abc_-')).toEqual({ format: 'z', data: 'abc_-' })
    expect(findFragment('#j=abc')).toEqual({ format: 'j', data: 'abc' })
    expect(findFragment('  z=abc  ')).toEqual({ format: 'z', data: 'abc' })
    expect(findFragment('https://alignos.io/lattice')).toBeNull()
  })

  it('rejects a truncated link', async () => {
    const fragment = await encodeDocument(doc, { compress: true })
    await expect(decodeDocument(fragment.slice(0, fragment.length / 2))).rejects.toBeInstanceOf(HandoffError)
  })

  it('rejects text with no handoff in it', async () => {
    await expect(decodeDocument('hello')).rejects.toBeInstanceOf(HandoffError)
  })

  it('rejects an unknown version and a foreign document', () => {
    expect(() => parseDocument({ ...doc, v: 2 })).toThrow(/newer version/)
    expect(() => parseDocument({ ...doc, kind: 'something-else' })).toThrow(HandoffError)
    expect(() => parseDocument({ ...doc, src: 'elsewhere' })).toThrow(HandoffError)
  })

  it('clamps out-of-range values, fills a null position, and skips bad entries', () => {
    const t = Date.parse(TUE) / 1000
    const parsed = parseDocument({
      ...doc,
      theme: 'neon',
      progress: { a: [4.2, null, t], b: [0.5, -3, t], c: ['x', null, t], d: [0.5, null, 'soon'], e: 'nope' }
    })
    expect(parsed.progress).toEqual({
      a: { furthest: 1, position: 1, lastRead: TUE },
      b: { furthest: 0.5, position: 0, lastRead: TUE }
    })
    expect(parsed.skipped).toBe(3)
    expect(parsed.theme).toBeNull()
  })
})

describe('resolving a document onto the current lattice', () => {
  const resolver = createResolver(['the-codex-of-listening', 'bridge-between-chords'], {
    'the-codex-of-listening-121': 'the-codex-of-listening',
    'bridge-between-chords-63': 'bridge-between-chords'
  })
  const t = Date.parse(TUE) / 1000

  it('maps reader ids and the return path, and counts unknown codices as skipped', () => {
    const parsed = parseDocument({
      kind: 'alignos-progress', v: 1, src: 'reader', lattice: 'reader', exportedAt: t,
      to: '/codex/bridge-between-chords-63',
      progress: { 'the-codex-of-listening-121': [0.62, null, t], 'gone-1': [0.3, null, t] }
    })
    const resolved = resolveDocument(parsed, resolver)
    expect(resolved.progress).toEqual({ 'the-codex-of-listening': { furthest: 0.62, position: 0.62, lastRead: TUE } })
    expect(resolved.skipped).toBe(1)
    expect(resolved.to).toBe('/codex/bridge-between-chords')
  })
})
