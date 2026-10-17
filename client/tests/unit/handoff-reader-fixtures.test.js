import { describe, expect, it } from 'vitest'
import lattice from '../../src/generated/codex-lattice-meta.json'
import fixtures from '../fixtures/handoff/reader-links.json'
import { decodeDocument, resolveDocument } from '../../src/lib/handoff/envelope.js'
import { createResolver } from '../../src/lib/handoff/resolve.js'

// Links made by the legacy reader's own encoder: if these stop decoding, the formats have drifted
const resolver = createResolver(lattice.map((c) => c.id))

describe.each([
  ['compressed', fixtures.compressed, '/codex/the-codex-of-listening'],
  ['plain', fixtures.plain, '/']
])('a %s reader link', (_, fixture, landing) => {
  it('decodes to the reader storage it was made from', async () => {
    const parsed = await decodeDocument(fixture.link)
    expect(parsed).toMatchObject({ src: 'reader', theme: 'dark', to: fixture.from, skipped: 0 })

    for (const [id, entry] of Object.entries(fixtures.readerStorage)) {
      const furthest = entry.scrollPercent / 100
      expect(parsed.progress[id]).toEqual({ furthest, position: furthest, lastRead: entry.lastRead })
    }
  })

  it('lands under current ids, skipping what no longer exists', async () => {
    const resolved = resolveDocument(await decodeDocument(fixture.link), resolver)
    expect(Object.keys(resolved.progress).sort()).toEqual([
      'bridge-between-chords', 'the-codex-of-listening', 'the-codex-of-the-interbeing-lattice'
    ])
    expect(resolved.skipped).toBe(1)
    expect(resolved.to).toBe(landing)
  })
})
