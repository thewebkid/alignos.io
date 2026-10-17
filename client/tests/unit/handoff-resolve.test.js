import { describe, expect, it } from 'vitest'
import lattice from '../../src/generated/codex-lattice-meta.json'
import readerIds from '../fixtures/handoff/reader-ids.json'
import { createResolver } from '../../src/lib/handoff/resolve.js'
import { resolveAliases } from '../../scripts/codex-aliases.js'

const currentIds = lattice.map((c) => c.id)
const resolver = createResolver(currentIds)

describe('codex id resolution', () => {
  it('resolves every codex id the legacy reader knows', () => {
    const unresolved = readerIds.filter((id) => !resolver.codexId(id))
    expect(unresolved).toEqual([])
  })

  it('maps a reader id with a trailing number to the current id', () => {
    expect(resolver.codexId('the-codex-of-the-interbeing-lattice-42')).toBe('the-codex-of-the-interbeing-lattice')
  })

  it('maps a current id to itself', () => {
    expect(resolver.codexId('the-codex-of-listening')).toBe('the-codex-of-listening')
  })

  it('gives null for an unknown id', () => {
    expect(resolver.codexId('not-a-codex')).toBeNull()
    expect(resolver.codexId(42)).toBeNull()
  })
})

describe('return path resolution', () => {
  it('resolves retired codex paths', () => {
    expect(resolver.path('/codex/the-codex-of-listening-121', 'reader')).toBe('/codex/the-codex-of-listening')
    expect(resolver.path('/codex/bridge-between-chords-63', 'reader')).toBe('/codex/bridge-between-chords')
  })

  it('maps the reader pages to their homes here', () => {
    expect(resolver.path('/', 'reader')).toBe('/lattice')
    expect(resolver.path('/about', 'reader')).toBe('/')
    expect(resolver.path('/search', 'reader')).toBe('/search')
    expect(resolver.path('/elsewhere', 'reader')).toBe('/lattice')
  })

  it('keeps this site’s own paths, query included', () => {
    expect(resolver.path('/lattice?series=the-architecture-of-love', 'alignos.io')).toBe('/lattice?series=the-architecture-of-love')
    expect(resolver.path('/faq', 'alignos.io')).toBe('/faq')
  })

  it('falls back to the lattice for unknown codices and foreign or missing paths', () => {
    expect(resolver.path('/codex/not-a-codex', 'alignos.io')).toBe('/lattice')
    expect(resolver.path('//example.com/x', 'alignos.io')).toBe('/lattice')
    expect(resolver.path('/\\example.com', 'alignos.io')).toBe('/lattice')
    expect(resolver.path('https://example.com/', 'alignos.io')).toBe('/lattice')
    expect(resolver.path(undefined, 'reader')).toBe('/lattice')
    expect(resolver.path('/import', 'alignos.io')).toBe('/lattice')
  })
})

describe('alias generation', () => {
  const change = (old_value, new_value) => ({ change_type: 'id_change', old_value, new_value })

  it('follows chains of id changes to the current id', () => {
    const { errors, aliases } = resolveAliases([change('a-1', 'a-2'), change('a-2', 'a')], ['a'])
    expect(errors).toEqual([])
    expect(aliases).toEqual({ 'a-1': 'a', 'a-2': 'a' })
  })

  it('fails when a retired id is reused as a current id', () => {
    const { errors } = resolveAliases([change('a', 'b')], ['a', 'b'])
    expect(errors).toEqual(['retired id "a" is also a current codex id'])
  })

  it('fails when a change leads to no current codex', () => {
    const { errors } = resolveAliases([change('a-1', 'gone')], ['a'])
    expect(errors).toEqual(['retired id "a-1" leads to "gone", which is not a current codex'])
  })

  it('ignores records that are not id changes', () => {
    const { aliases } = resolveAliases([{ change_type: 'cover_rename', old_value: 'x.jpg', new_value: 'a.jpg' }], ['a'])
    expect(aliases).toEqual({})
  })
})
