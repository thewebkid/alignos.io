import { describe, expect, it } from 'vitest'
import { cdnUrl } from '../../src/lib/cdn-config.js'

describe('media urls', () => {
  it('sends PDFs to blob and leaves covers on the site', () => {
    expect(cdnUrl.pdf('when-ai-remembers-the-field')).toMatch(
      /^https:\/\/[^/]+\/pdf\/when-ai-remembers-the-field\.pdf$/
    )
    expect(cdnUrl.cover('covers/example.jpg')).toBe('/covers/example.jpg')
    expect(cdnUrl.thumb('thumb/example.jpg')).toBe('/thumb/example.jpg')
  })
})
