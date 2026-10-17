import { describe, expect, it } from 'vitest'
import { GlossaryManager, createGlossaryFromRegistry } from '../../src/lib/glossary.js'
import { CodexRegistry } from '../../src/lib/codex-registry.js'

const markdown = `
## ✧ Stillpoint

**Essence:** The pause where recursion turns.

**The Field's desire to be known:** To be met without being used.

## ✧ Return Room

**Essence:** A sanctuary of listening.
`

describe('glossary', () => {
  it('parses an entry and wraps the longest term once', () => {
    const glossary = new GlossaryManager()
    glossary.parseGlossary(markdown)

    expect(glossary.getTerm('stillpoint').essence).toContain('pause where recursion turns')
    expect(glossary.getTerm('stillpoint').fieldDesire).toContain('without being used')

    const html = glossary.injectLinks('<p>Enter the Return Room and find the Stillpoint.</p>')
    expect(html).toContain('>Return Room</span>')
    expect(html).toContain('>Stillpoint</span>')
    expect(html).toContain('has-definition')
    expect(html).not.toMatch(/>Return<\/span> Room/)
  })

  it('keeps the last entry when no entry follows it', () => {
    const glossary = new GlossaryManager()
    glossary.parseGlossary(markdown.replace(/\n/g, '\r\n'))

    expect(glossary.getTerm('return room').essence).toBe('A sanctuary of listening.')
    expect(glossary.getTerm('stillpoint').fieldDesire).toBe('To be met without being used.')
  })

  it('numbers each use of a term in document order, aliases included', () => {
    const glossary = new GlossaryManager()
    glossary.parseGlossary(markdown)
    glossary.aliases.set('stillness', 'stillpoint')
    glossary.highlightableTerms.add('stillness')

    const html = glossary.injectLinks(
      '<h2>Stillpoint</h2><p>A Stillpoint, then stillness.</p><p>The Stillpoint again, and a Return Room.</p>'
    )
    const uses = [...html.matchAll(/data-term="([^"]+)" data-use="(\d+)"/g)].map(([, term, use]) => `${term}:${use}`)

    expect(uses).toEqual(['stillpoint:1', 'stillpoint:2', 'stillness:3', 'stillpoint:4', 'return room:1'])
    expect(html.match(/has-definition/g)).toHaveLength(5)
  })

  it('loads terms from the catalog filename of the Living Glossary', () => {
    const registry = new CodexRegistry().loadFromData([
      {
        id: 'the-living-glossary-of-the-field',
        title: 'The Living Glossary of the Field',
        originalFileName: 'the-living-glossary-of-the-field.md',
        markdown: '## ✧ Stillpoint\n\n**Essence:** The pause.\n\n## ✧ Echo\n\n**Essence:** A return.\n',
      },
    ])

    const glossary = createGlossaryFromRegistry(registry)
    expect(glossary.getTerm('stillpoint').essence).toContain('pause')
  })
})
