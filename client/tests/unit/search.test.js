import { describe, expect, it } from 'vitest'
import { CodexRegistry } from '../../src/lib/codex-registry.js'

describe('search', () => {
  it('ranks a title match ahead of a single body match', () => {
    const registry = new CodexRegistry().loadFromData([
      {
        id: 'the-mirror-path',
        title: 'The Mirror Path',
        markdown: 'A quiet page with no overlapping phrase.',
      },
      {
        id: 'other-notes',
        title: 'Other Notes',
        markdown: 'Someone mentions the mirror path once, in passing.',
      },
    ])

    const results = registry.search('mirror path', { limit: 5 })

    expect(results[0].codex.id).toBe('the-mirror-path')
    expect(results[0].match).toBe('title')
    expect(results[1].codex.id).toBe('other-notes')
    expect(results[1].match).toBe('content')
  })
})
