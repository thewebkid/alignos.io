import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'
import { createPinia, setActivePinia } from 'pinia'
import { useReadingSettingsStore } from '../../src/stores/readingSettings.js'

// Just enough DOM for the store: attributes and properties on <html>, and font links in <head>
const fakeDocument = () => {
  const attrs = new Map()
  const props = new Map()
  const links = []
  return {
    attrs,
    props,
    links,
    documentElement: {
      setAttribute: (k, v) => attrs.set(k, v),
      removeAttribute: (k) => attrs.delete(k),
      style: {
        setProperty: (k, v) => props.set(k, v),
        removeProperty: (k) => props.delete(k)
      }
    },
    head: {
      querySelector: () => links[0] ?? null,
      appendChild: (el) => links.push(el)
    },
    createElement: () => ({ dataset: {}, remove() { links.splice(links.indexOf(this), 1) } })
  }
}

const fakeStorage = (initial = {}) => {
  const data = new Map(Object.entries(initial))
  return {
    getItem: (k) => data.get(k) ?? null,
    setItem: (k, v) => data.set(k, v)
  }
}

describe('reading settings', () => {
  let doc

  beforeEach(() => {
    doc = fakeDocument()
    vi.stubGlobal('window', {})
    vi.stubGlobal('document', doc)
    setActivePinia(createPinia())
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('starts from the defaults and leaves <html> untouched', () => {
    vi.stubGlobal('localStorage', fakeStorage())
    const store = useReadingSettingsStore()

    expect([store.font, store.scale, store.glossary, store.pace]).toEqual(['source-sans', 1, 'always', 'typical'])
    expect(doc.attrs.size).toBe(0)
    expect(doc.props.size).toBe(0)
    expect(store.minutesFor(5000)).toBe(25)
  })

  it('ignores invalid saved values', () => {
    vi.stubGlobal('localStorage', fakeStorage({
      'alignos-reading': JSON.stringify({ font: 'comic-sans', scale: 3, glossary: 'first-two', pace: 'brisk' })
    }))
    const store = useReadingSettingsStore()

    expect([store.font, store.scale, store.glossary, store.pace]).toEqual(['source-sans', 1, 'first-two', 'brisk'])
    expect(doc.attrs.get('data-glossary')).toBe('first-two')
  })

  it('applies changes to <html> and saves what the first-paint script reads', async () => {
    const storage = fakeStorage()
    vi.stubGlobal('localStorage', storage)
    const store = useReadingSettingsStore()

    store.glossary = 'off'
    store.font = 'atkinson'
    store.scale = 1.25
    store.pace = 'unhurried'
    await nextTick()

    expect(doc.attrs.get('data-glossary')).toBe('off')
    expect(doc.props.get('--cl-reading-scale')).toBe('1.25')
    expect(doc.props.get('--cl-font-reading')).toContain('Atkinson Hyperlegible Next')
    expect(doc.links[0].href).toContain('Atkinson+Hyperlegible+Next')
    expect(store.minutesFor(5000)).toBe(34)

    const saved = JSON.parse(storage.getItem('alignos-reading'))
    expect(saved).toMatchObject({ glossary: 'off', scale: 1.25, pace: 'unhurried', font: 'atkinson' })
    expect(saved.fontStack).toContain('Atkinson Hyperlegible Next')
    expect(saved.fontHref).toContain('fonts.googleapis.com')
  })
})
