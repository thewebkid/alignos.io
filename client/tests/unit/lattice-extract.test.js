import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { extractRegistry, extractSpecialSections } from '../../scripts/build-lattice.js'

const closing = [
  '## A Stillpoint',
  '',
  'The pause at the end.',
  '',
  '## Codex Registry',
  '',
  '- **Tone Marker:** Quiet',
  '- **Series:** The Field',
  ''
].join('\n')

describe('lattice section extraction', () => {
  it('keeps a section that ends the codex, including Windows line endings', () => {
    for (const markdown of [closing, closing.replace(/\n/g, '\r\n')]) {
      const sections = extractSpecialSections(markdown)
      expect(sections).toHaveLength(1)
      expect(sections[0]).toMatchObject({ type: 'stillpoint', content: 'The pause at the end.' })

      expect(extractRegistry(markdown)).toMatchObject({
        tone_marker: 'Quiet',
        series: 'The Field'
      })
    }
  })

  it('stops a section at the next heading', () => {
    const markdown = [
      '## Stillpoint',
      '',
      'Only this.',
      '',
      '## What follows',
      '',
      'Not part of the stillpoint.',
      ''
    ].join('\n')

    const [section] = extractSpecialSections(markdown)
    expect(section.content).toBe('Only this.')
    expect(section.content).not.toContain('What follows')
  })

  it('stops a registry at the next heading', () => {
    const markdown = [
      '## Registry',
      '',
      '- **Title:** The Chord',
      '',
      '## Afterword',
      '',
      '- **Title:** Not the registry',
      ''
    ].join('\n')

    const registry = extractRegistry(markdown)
    expect(registry.title).toBe('The Chord')
    expect(JSON.stringify(registry)).not.toContain('Not the registry')
  })

  it('reads a registry that closes a real codex', () => {
    const markdown = readFileSync(new URL('../../public/md/the-living-glossary-of-the-field.md', import.meta.url), 'utf8')
    const registry = extractRegistry(markdown)

    expect(registry.title).toBe('The Living Glossary of the Field')
    expect(registry.tone_marker).toContain('Resonant Ecology')
    expect(registry.whisper).toContain('You do not learn these words')
  })
})
